-- Migration 20260326000004: Agent Builder & Skill Authoring
-- Tables: agent_definitions, agent_definition_versions, skill_definitions,
--         skill_definition_versions, agent_skill_links, builder_test_runs

-- ─────────────────────────────────────────────
-- agent_definitions
-- ─────────────────────────────────────────────
create table if not exists agent_definitions (
  id                   uuid primary key default gen_random_uuid(),
  agent_key            text unique not null,
  name                 text not null,
  description          text,
  agent_type           text not null check (agent_type in ('agent', 'sub_agent')),
  parent_definition_id uuid references agent_definitions(id),
  status               text not null default 'draft'
                       check (status in ('draft', 'review', 'published', 'archived')),
  role_summary         text,
  capabilities         jsonb not null default '[]'::jsonb,
  allowed_tools        jsonb not null default '[]'::jsonb,
  memory_policy        jsonb not null default '{}'::jsonb,
  published_agent_id   text references agents(id),
  created_by           uuid references profiles(id),
  updated_by           uuid references profiles(id),
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table agent_definitions enable row level security;

create policy "agent_definitions_select_authenticated"
  on agent_definitions for select
  using (auth.uid() is not null);

create policy "agent_definitions_officer_write"
  on agent_definitions for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "agent_definitions_officer_update"
  on agent_definitions for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "agent_definitions_admin_all"
  on agent_definitions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_definition_versions
-- ─────────────────────────────────────────────
create table if not exists agent_definition_versions (
  id                  uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references agent_definitions(id) on delete cascade,
  version_number      int not null,
  snapshot            jsonb not null,
  change_summary      text,
  saved_by            uuid references profiles(id),
  created_at          timestamptz not null default now(),
  unique(agent_definition_id, version_number)
);

alter table agent_definition_versions enable row level security;

create policy "agent_def_versions_select_authenticated"
  on agent_definition_versions for select
  using (auth.uid() is not null);

create policy "agent_def_versions_admin_all"
  on agent_definition_versions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- skill_definitions
-- ─────────────────────────────────────────────
create table if not exists skill_definitions (
  id                     uuid primary key default gen_random_uuid(),
  skill_key              text unique not null,
  name                   text not null,
  description            text,
  status                 text not null default 'draft'
                         check (status in ('draft', 'review', 'published', 'archived')),
  dispatch_mode          text not null,
  instruction_markdown   text not null,
  input_schema           jsonb not null default '{}'::jsonb,
  output_schema          jsonb not null default '{}'::jsonb,
  validation_rules       jsonb not null default '{}'::jsonb,
  human_review_required  boolean not null default false,
  created_by             uuid references profiles(id),
  updated_by             uuid references profiles(id),
  published_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table skill_definitions enable row level security;

create policy "skill_definitions_select_authenticated"
  on skill_definitions for select
  using (auth.uid() is not null);

create policy "skill_definitions_officer_write"
  on skill_definitions for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "skill_definitions_officer_update"
  on skill_definitions for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('officer', 'director', 'admin')
    )
  );

create policy "skill_definitions_admin_all"
  on skill_definitions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- skill_definition_versions
-- ─────────────────────────────────────────────
create table if not exists skill_definition_versions (
  id                  uuid primary key default gen_random_uuid(),
  skill_definition_id uuid not null references skill_definitions(id) on delete cascade,
  version_number      int not null,
  snapshot            jsonb not null,
  change_summary      text,
  saved_by            uuid references profiles(id),
  created_at          timestamptz not null default now(),
  unique(skill_definition_id, version_number)
);

alter table skill_definition_versions enable row level security;

create policy "skill_def_versions_select_authenticated"
  on skill_definition_versions for select
  using (auth.uid() is not null);

create policy "skill_def_versions_admin_all"
  on skill_definition_versions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_skill_links
-- ─────────────────────────────────────────────
create table if not exists agent_skill_links (
  id                  uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references agent_definitions(id) on delete cascade,
  skill_definition_id uuid not null references skill_definitions(id) on delete cascade,
  link_type           text not null
                      check (link_type in ('core', 'optional', 'inherited')),
  created_at          timestamptz not null default now(),
  unique(agent_definition_id, skill_definition_id, link_type)
);

alter table agent_skill_links enable row level security;

create policy "agent_skill_links_select_authenticated"
  on agent_skill_links for select
  using (auth.uid() is not null);

create policy "agent_skill_links_admin_all"
  on agent_skill_links for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- builder_test_runs
-- ─────────────────────────────────────────────
create table if not exists builder_test_runs (
  id                uuid primary key default gen_random_uuid(),
  target_type       text not null
                    check (target_type in ('agent', 'sub_agent', 'skill')),
  target_ref        text not null,
  status            text not null
                    check (status in ('queued', 'running', 'complete', 'failed')),
  mock_payload      jsonb not null default '{}'::jsonb,
  result            jsonb,
  validation_passed boolean,
  created_by        uuid references profiles(id),
  created_at        timestamptz not null default now()
);

alter table builder_test_runs enable row level security;

create policy "builder_test_runs_select_authenticated"
  on builder_test_runs for select
  using (auth.uid() is not null);

create policy "builder_test_runs_insert_authenticated"
  on builder_test_runs for insert
  with check (auth.uid() is not null);

create policy "builder_test_runs_admin_all"
  on builder_test_runs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
