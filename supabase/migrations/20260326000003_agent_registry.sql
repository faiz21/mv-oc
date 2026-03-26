-- Migration 20260326000003: Runtime Agent Registry & Topology
-- Tables: agents, agent_relationships, agent_groups, agent_group_members

-- ─────────────────────────────────────────────
-- agents
-- ─────────────────────────────────────────────
create table if not exists agents (
  id                text primary key,
  name              text not null,
  description       text,
  department_id     uuid references departments(id),
  openclaw_endpoint text not null,
  status            text not null default 'active'
                    check (status in ('active', 'inactive', 'unreachable')),
  capabilities      jsonb not null default '[]'::jsonb,
  last_seen         timestamptz,
  error_rate_24h    numeric(5,2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

alter table agents enable row level security;

create policy "agents_member_select"
  on agents for select
  using (
    department_id is null
    or department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "agents_admin_all"
  on agents for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_relationships
-- ─────────────────────────────────────────────
create table if not exists agent_relationships (
  id                  uuid primary key default gen_random_uuid(),
  parent_agent_id     text not null references agents(id) on delete cascade,
  child_agent_id      text not null references agents(id) on delete cascade,
  relationship_type   text not null
                      check (relationship_type in ('reports_to', 'coordinates', 'supports')),
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  unique(parent_agent_id, child_agent_id, relationship_type),
  check (parent_agent_id <> child_agent_id)
);

alter table agent_relationships enable row level security;

create policy "agent_relationships_select_authenticated"
  on agent_relationships for select
  using (auth.uid() is not null);

create policy "agent_relationships_admin_all"
  on agent_relationships for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_groups
-- ─────────────────────────────────────────────
create table if not exists agent_groups (
  id          uuid primary key default gen_random_uuid(),
  group_key   text unique not null,
  name        text not null,
  description text,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table agent_groups enable row level security;

create policy "agent_groups_select_authenticated"
  on agent_groups for select
  using (auth.uid() is not null);

create policy "agent_groups_admin_all"
  on agent_groups for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- agent_group_members
-- ─────────────────────────────────────────────
create table if not exists agent_group_members (
  id              uuid primary key default gen_random_uuid(),
  agent_group_id  uuid not null references agent_groups(id) on delete cascade,
  agent_id        text not null references agents(id) on delete cascade,
  membership_role text not null default 'member',
  created_at      timestamptz not null default now(),
  unique(agent_group_id, agent_id)
);

alter table agent_group_members enable row level security;

create policy "agent_group_members_select_authenticated"
  on agent_group_members for select
  using (auth.uid() is not null);

create policy "agent_group_members_admin_all"
  on agent_group_members for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
