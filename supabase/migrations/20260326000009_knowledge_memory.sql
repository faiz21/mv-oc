-- Migration 20260326000009: Knowledge, Wiki, and Retrieval Projection (pgvector)
-- Tables: memory_documents, memory_facts, memory_vectors, agent_daily_summaries,
--         agent_lessons_learned, wiki_articles, wiki_versions
-- Functions: match_memory_vectors
-- Note: context_packets was created in migration 6 — do NOT recreate here

-- Enable pgvector extension
create extension if not exists vector;

-- ─────────────────────────────────────────────
-- memory_documents
-- ─────────────────────────────────────────────
create table if not exists memory_documents (
  id               uuid primary key default gen_random_uuid(),
  scope            text not null check (
    scope in (
      'global', 'team', 'department', 'project', 'workflow_run',
      'artifact', 'agent', 'wiki_article', 'survey', 'changelog'
    )
  ),
  scope_ref        text not null,
  doc_type         text not null,
  title            text not null,
  markdown_content text not null,
  source_kind      text not null
                   check (source_kind in ('system', 'human', 'agent', 'projection')),
  source_ref       text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table memory_documents enable row level security;

create policy "memory_documents_select_authenticated"
  on memory_documents for select
  using (auth.uid() is not null);

create policy "memory_documents_officer_write"
  on memory_documents for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "memory_documents_admin_all"
  on memory_documents for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- memory_facts
-- ─────────────────────────────────────────────
create table if not exists memory_facts (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null,
  scope_ref   text not null,
  fact_key    text not null,
  fact_value  jsonb not null,
  fact_type   text not null,
  approved    boolean not null default false,
  source_kind text not null,
  source_ref  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(scope, scope_ref, fact_key)
);

alter table memory_facts enable row level security;

create policy "memory_facts_select_authenticated"
  on memory_facts for select
  using (auth.uid() is not null);

create policy "memory_facts_officer_write"
  on memory_facts for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "memory_facts_admin_all"
  on memory_facts for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- memory_vectors
-- ─────────────────────────────────────────────
create table if not exists memory_vectors (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null
              check (scope in ('step_takeaway', 'task_item_takeaway', 'project_takeaway')),
  scope_ref   uuid,
  project_id  uuid references projects(id),
  agent_id    text,
  workflow_id text,
  content     text not null,
  embedding   vector(1536),
  token_count int,
  metadata    jsonb,
  created_at  timestamptz default now()
);

-- HNSW index for fast cosine similarity search
create index if not exists memory_vectors_embedding_idx
  on memory_vectors
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table memory_vectors enable row level security;

create policy "memory_vectors_select_authenticated"
  on memory_vectors for select
  using (auth.uid() is not null);

create policy "memory_vectors_admin_all"
  on memory_vectors for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_daily_summaries
-- ─────────────────────────────────────────────
create table if not exists agent_daily_summaries (
  id             uuid primary key default gen_random_uuid(),
  agent_id       text references agents(id),
  date           date not null,
  summary        text,
  task_count     int default 0,
  step_count     int default 0,
  error_count    int default 0,
  approval_count int default 0,
  top_workflows  jsonb,
  key_patterns   jsonb,
  token_used     int default 0,
  created_at     timestamptz default now(),
  unique(agent_id, date)
);

alter table agent_daily_summaries enable row level security;

create policy "agent_daily_summaries_select_authenticated"
  on agent_daily_summaries for select
  using (auth.uid() is not null);

create policy "agent_daily_summaries_admin_all"
  on agent_daily_summaries for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_lessons_learned
-- ─────────────────────────────────────────────
create table if not exists agent_lessons_learned (
  id              uuid primary key default gen_random_uuid(),
  agent_id        text references agents(id),
  lesson          text not null,
  context         text,
  source_ref      uuid,
  confidence      int default 3 check (confidence between 1 and 5),
  applies_to      jsonb,
  confirmed_count int default 1,
  embedding       vector(1536),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists agent_lessons_embedding_idx
  on agent_lessons_learned
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table agent_lessons_learned enable row level security;

create policy "agent_lessons_select_authenticated"
  on agent_lessons_learned for select
  using (auth.uid() is not null);

create policy "agent_lessons_admin_all"
  on agent_lessons_learned for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- match_memory_vectors function
-- ─────────────────────────────────────────────
create or replace function match_memory_vectors (
  query_embedding   vector(1536),
  match_threshold   float,
  match_count       int,
  filter_scope      text  default null,
  filter_project_id uuid  default null,
  filter_scope_ref  uuid  default null
)
returns table (
  id         uuid,
  scope      text,
  content    text,
  similarity float
)
language sql stable
as $$
  select
    id,
    scope,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from memory_vectors
  where
    (filter_scope      is null or scope      = filter_scope)
    and (filter_project_id is null or project_id = filter_project_id)
    and (filter_scope_ref  is null or scope_ref  = filter_scope_ref)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ─────────────────────────────────────────────
-- wiki_articles
-- ─────────────────────────────────────────────
create table if not exists wiki_articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  category    text not null,
  content     text not null,
  status      text not null default 'draft'
              check (status in ('draft', 'review', 'published', 'archived')),
  author_id   uuid references profiles(id),
  editor_id   uuid references profiles(id),
  published_at timestamptz,
  archived_at  timestamptz,
  deleted_at   timestamptz,
  view_count   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table wiki_articles enable row level security;

create policy "wiki_articles_published_select"
  on wiki_articles for select
  using (
    status = 'published'
    or auth.uid() in (author_id, editor_id)
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "wiki_articles_officer_insert"
  on wiki_articles for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "wiki_articles_officer_update"
  on wiki_articles for update
  using (
    auth.uid() in (author_id, editor_id)
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "wiki_articles_admin_all"
  on wiki_articles for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- wiki_versions
-- ─────────────────────────────────────────────
create table if not exists wiki_versions (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid not null references wiki_articles(id) on delete cascade,
  version_number int not null,
  content        text not null,
  change_summary text,
  edited_by      uuid references profiles(id),
  created_at     timestamptz not null default now(),
  unique(article_id, version_number)
);

alter table wiki_versions enable row level security;

create policy "wiki_versions_select_authenticated"
  on wiki_versions for select
  using (auth.uid() is not null);

create policy "wiki_versions_admin_all"
  on wiki_versions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
