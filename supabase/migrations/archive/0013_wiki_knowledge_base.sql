-- Migration 0013: Wiki knowledge base

create table if not exists wiki_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  author_id uuid not null references profiles(id) on delete restrict,
  published_by uuid references profiles(id) on delete set null,
  published_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  import_source text,
  import_source_path text,
  content_tsvector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wiki_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references wiki_articles(id) on delete cascade,
  version_number integer not null,
  content text not null,
  status_at_version text,
  change_summary text,
  parent_version_id uuid references wiki_article_versions(id) on delete set null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_from text not null default 'app' check (created_from in ('app', 'import', 'admin_edit', 'autosave')),
  created_at timestamptz not null default now(),
  unique(article_id, version_number)
);

create index if not exists wiki_articles_status_idx on wiki_articles(status);
create index if not exists wiki_articles_author_id_idx on wiki_articles(author_id);
create index if not exists wiki_articles_category_idx on wiki_articles(category);
create index if not exists wiki_articles_deleted_at_idx on wiki_articles(deleted_at);
create index if not exists wiki_articles_published_at_idx on wiki_articles(published_at desc);
create index if not exists wiki_articles_tsvector_idx on wiki_articles using gin(content_tsvector);
create index if not exists wiki_article_versions_article_id_idx on wiki_article_versions(article_id);
create index if not exists wiki_article_versions_created_at_idx on wiki_article_versions(created_at desc);

create or replace function set_wiki_article_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists wiki_articles_updated_at on wiki_articles;
create trigger wiki_articles_updated_at
before update on wiki_articles
for each row
execute function set_wiki_article_updated_at();

alter table wiki_articles enable row level security;
alter table wiki_article_versions enable row level security;

create policy "Published wiki visible to authenticated users"
  on wiki_articles for select
  using (deleted_at is null and status = 'published' and auth.role() = 'authenticated');

create policy "Authors and admins can read drafts"
  on wiki_articles for select
  using (
    deleted_at is null
    and (
      exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      or author_id = auth.uid()
      or (
        status = 'review'
        and exists (
          select 1 from profiles p
          where p.id = auth.uid() and p.role in ('admin', 'operator', 'officer', 'director')
        )
      )
    )
  );

create policy "Officers and admins can insert wiki drafts"
  on wiki_articles for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'operator', 'officer')
    )
  );

create policy "Authors can update drafts and admins can update all wiki articles"
  on wiki_articles for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
    or (author_id = auth.uid() and status = 'draft')
  )
  with check (true);

create policy "Wiki versions follow article visibility"
  on wiki_article_versions for select
  using (
    exists (
      select 1
      from wiki_articles a
      where a.id = wiki_article_versions.article_id
        and a.deleted_at is null
        and (
          a.status = 'published'
          or a.author_id = auth.uid()
          or exists (
            select 1 from profiles p
            where p.id = auth.uid() and p.role in ('admin', 'operator', 'officer', 'director')
          )
        )
    )
  );

create policy "Authors and admins can insert wiki versions"
  on wiki_article_versions for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from wiki_articles a
      where a.id = article_id
        and (
          exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
          or (a.author_id = auth.uid() and a.status = 'draft')
        )
    )
  );
