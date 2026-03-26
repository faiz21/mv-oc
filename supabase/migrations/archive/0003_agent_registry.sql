-- Migration 0003: Runtime Agent Registry — agents, relationships, groups

create table agents (
  id text primary key,
  name text not null,
  description text,
  openclaw_endpoint text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'unreachable')),
  capabilities jsonb not null default '[]'::jsonb,
  last_seen timestamptz,
  error_rate_24h numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table agent_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_agent_id text not null references agents(id) on delete cascade,
  child_agent_id text not null references agents(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in ('reports_to', 'coordinates', 'supports')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(parent_agent_id, child_agent_id, relationship_type),
  check (parent_agent_id <> child_agent_id)
);

create table agent_groups (
  id uuid primary key default gen_random_uuid(),
  group_key text unique not null,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agent_group_members (
  id uuid primary key default gen_random_uuid(),
  agent_group_id uuid not null references agent_groups(id) on delete cascade,
  agent_id text not null references agents(id) on delete cascade,
  membership_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(agent_group_id, agent_id)
);

create index agents_status_idx on agents(status);
create index agent_relationships_parent_idx on agent_relationships(parent_agent_id);
create index agent_relationships_child_idx on agent_relationships(child_agent_id);

-- RLS
alter table agents enable row level security;
alter table agent_relationships enable row level security;
alter table agent_groups enable row level security;
alter table agent_group_members enable row level security;

create policy "Authenticated users can read agents"
  on agents for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read agent relationships"
  on agent_relationships for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read agent groups"
  on agent_groups for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read agent group members"
  on agent_group_members for select using (auth.role() = 'authenticated');

create policy "Admins can manage agents"
  on agents for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can manage agent relationships"
  on agent_relationships for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can manage agent groups"
  on agent_groups for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can manage agent group members"
  on agent_group_members for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
