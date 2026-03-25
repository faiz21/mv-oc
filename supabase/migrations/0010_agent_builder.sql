-- Migration 0010: Agent Builder & Skill Authoring

create table agent_definitions (
  id uuid primary key default gen_random_uuid(),
  agent_key text unique not null,
  name text not null,
  description text,
  agent_type text not null check (agent_type in ('agent', 'sub_agent')),
  parent_definition_id uuid references agent_definitions(id),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  role_summary text,
  capabilities jsonb not null default '[]'::jsonb,
  allowed_tools jsonb not null default '[]'::jsonb,
  memory_policy jsonb not null default '{}'::jsonb,
  published_agent_id text references agents(id),
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agent_definition_versions (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references agent_definitions(id) on delete cascade,
  version_number int not null,
  snapshot jsonb not null,
  change_summary text,
  saved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique(agent_definition_id, version_number)
);

create table skill_definitions (
  id uuid primary key default gen_random_uuid(),
  skill_key text unique not null,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  dispatch_mode text not null,
  instruction_markdown text not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  validation_rules jsonb not null default '{}'::jsonb,
  human_review_required boolean not null default false,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table skill_definition_versions (
  id uuid primary key default gen_random_uuid(),
  skill_definition_id uuid not null references skill_definitions(id) on delete cascade,
  version_number int not null,
  snapshot jsonb not null,
  change_summary text,
  saved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique(skill_definition_id, version_number)
);

create table agent_skill_links (
  id uuid primary key default gen_random_uuid(),
  agent_definition_id uuid not null references agent_definitions(id) on delete cascade,
  skill_definition_id uuid not null references skill_definitions(id) on delete cascade,
  link_type text not null check (link_type in ('core', 'optional', 'inherited')),
  created_at timestamptz not null default now(),
  unique(agent_definition_id, skill_definition_id, link_type)
);

create table builder_test_runs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('agent', 'sub_agent', 'skill')),
  target_ref text not null,
  status text not null check (status in ('queued', 'running', 'complete', 'failed')),
  mock_payload jsonb not null default '{}'::jsonb,
  result jsonb,
  validation_passed boolean,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index agent_definitions_status_idx on agent_definitions(status);
create index agent_definitions_agent_key_idx on agent_definitions(agent_key);
create index skill_definitions_status_idx on skill_definitions(status);
create index skill_definitions_skill_key_idx on skill_definitions(skill_key);

-- RLS
alter table agent_definitions enable row level security;
alter table agent_definition_versions enable row level security;
alter table skill_definitions enable row level security;
alter table skill_definition_versions enable row level security;
alter table agent_skill_links enable row level security;
alter table builder_test_runs enable row level security;

create policy "Authenticated users can read agent definitions" on agent_definitions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read agent definition versions" on agent_definition_versions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read skill definitions" on skill_definitions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read skill definition versions" on skill_definition_versions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read agent skill links" on agent_skill_links for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read builder test runs" on builder_test_runs for select using (auth.role() = 'authenticated');
create policy "Admins can manage agent definitions" on agent_definitions for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins can manage skill definitions" on skill_definitions for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
