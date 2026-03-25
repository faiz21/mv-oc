-- Migration 0011: pgvector Execution Memory

-- Enable pgvector extension
create extension if not exists vector;

-- Semantic memory store (with HNSW index for fast cosine similarity)
create table memory_vectors (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null
              check (scope in ('step_takeaway', 'task_item_takeaway', 'entity_takeaway')),
  scope_ref   uuid,
  entity_id   uuid,
  agent_id    text,
  workflow_id uuid,
  content     text not null,
  embedding   vector(1536),
  token_count int,
  metadata    jsonb,
  created_at  timestamptz default now()
);

create index on memory_vectors
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Daily agent activity snapshots
create table agent_daily_summaries (
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

-- Durable cross-workflow agent insights
create table agent_lessons_learned (
  id              uuid primary key default gen_random_uuid(),
  agent_id        text references agents(id),
  lesson          text not null,
  context         text,
  source_ref      uuid,
  confidence      int default 3
                  check (confidence between 1 and 5),
  applies_to      jsonb,
  confirmed_count int default 1,
  embedding       vector(1536),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index on agent_lessons_learned
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index memory_vectors_entity_id_idx on memory_vectors(entity_id);
create index memory_vectors_agent_id_idx on memory_vectors(agent_id);
create index memory_vectors_scope_idx on memory_vectors(scope);
create index agent_daily_summaries_agent_id_idx on agent_daily_summaries(agent_id);
create index agent_daily_summaries_date_idx on agent_daily_summaries(date);
create index agent_lessons_learned_agent_id_idx on agent_lessons_learned(agent_id);
create index agent_lessons_learned_confidence_idx on agent_lessons_learned(confidence);

-- SQL function: semantic vector search
create or replace function match_memory_vectors (
  query_embedding    vector(1536),
  match_threshold    float,
  match_count        int,
  filter_scope       text  default null,
  filter_entity_id   uuid  default null,
  filter_scope_ref   uuid  default null
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
    (filter_scope      is null or scope     = filter_scope)
    and (filter_entity_id is null or entity_id = filter_entity_id)
    and (filter_scope_ref is null or scope_ref = filter_scope_ref)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- RLS
alter table memory_vectors enable row level security;
alter table agent_daily_summaries enable row level security;
alter table agent_lessons_learned enable row level security;

create policy "Authenticated users can read memory vectors" on memory_vectors for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read agent daily summaries" on agent_daily_summaries for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read agent lessons learned" on agent_lessons_learned for select using (auth.role() = 'authenticated');
create policy "Officers can update lesson confidence" on agent_lessons_learned for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')));
