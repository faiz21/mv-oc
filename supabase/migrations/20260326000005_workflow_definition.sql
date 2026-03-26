-- Migration 20260326000005: Workflow Definition
-- Tables: workflows, workflow_versions, workflow_nodes, workflow_edges, workflow_triggers
-- Circular FK: workflows.active_version_id ↔ workflow_versions (resolved via ALTER TABLE at end)

-- ─────────────────────────────────────────────
-- workflows (active_version_id FK added after workflow_versions)
-- ─────────────────────────────────────────────
create table if not exists workflows (
  id                        uuid primary key default gen_random_uuid(),
  key                       text unique not null,
  name                      text not null,
  description               text,
  department_id             uuid not null references departments(id),
  status                    text not null default 'draft'
                            check (status in ('draft', 'active', 'inactive')),
  primary_agent_id          text references agents(id),
  requires_approval         boolean not null default false,
  requires_approval_reason  text,
  active_version_id         uuid,   -- FK added below after workflow_versions exists
  created_by                uuid references profiles(id),
  updated_by                uuid references profiles(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz,
  check (
    requires_approval = false
    or requires_approval_reason is not null
  )
);

alter table workflows enable row level security;

create policy "workflows_member_select"
  on workflows for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "workflows_director_insert"
  on workflows for insert
  with check (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "workflows_director_update"
  on workflows for update
  using (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "workflows_admin_all"
  on workflows for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_versions
-- ─────────────────────────────────────────────
create table if not exists workflow_versions (
  id                     uuid primary key default gen_random_uuid(),
  workflow_id            uuid not null references workflows(id) on delete cascade,
  version_number         int not null,
  status_snapshot        text not null,
  name_snapshot          text not null,
  description_snapshot   text,
  primary_agent_id       text references agents(id),
  requires_approval      boolean not null,
  requires_approval_reason text,
  change_summary         text,
  saved_by               uuid references profiles(id),
  created_at             timestamptz not null default now(),
  unique(workflow_id, version_number)
);

alter table workflow_versions enable row level security;

create policy "workflow_versions_member_select"
  on workflow_versions for select
  using (
    workflow_id in (
      select w.id from workflows w
      join department_members dm on dm.department_id = w.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_versions_admin_all"
  on workflow_versions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_nodes
-- ─────────────────────────────────────────────
create table if not exists workflow_nodes (
  id                  uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  node_key            text not null,
  node_type           text not null check (
    node_type in (
      'start', 'agent_task', 'approval_gate', 'wait_join',
      'parallel_branch', 'webhook_trigger', 'manual_trigger', 'cron_trigger', 'end'
    )
  ),
  label               text not null,
  position_x          numeric(12,2),
  position_y          numeric(12,2),
  config              jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  unique(workflow_version_id, node_key)
);

alter table workflow_nodes enable row level security;

create policy "workflow_nodes_member_select"
  on workflow_nodes for select
  using (
    workflow_version_id in (
      select wv.id from workflow_versions wv
      join workflows w on w.id = wv.workflow_id
      join department_members dm on dm.department_id = w.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_nodes_admin_all"
  on workflow_nodes for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_edges
-- ─────────────────────────────────────────────
create table if not exists workflow_edges (
  id                  uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  edge_key            text not null,
  source_node_key     text not null,
  target_node_key     text not null,
  condition_type      text not null default 'always'
                      check (condition_type in ('always', 'success', 'failure', 'approval')),
  config              jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  unique(workflow_version_id, edge_key),
  constraint workflow_edges_source_fk
    foreign key (workflow_version_id, source_node_key)
    references workflow_nodes(workflow_version_id, node_key),
  constraint workflow_edges_target_fk
    foreign key (workflow_version_id, target_node_key)
    references workflow_nodes(workflow_version_id, node_key)
);

alter table workflow_edges enable row level security;

create policy "workflow_edges_member_select"
  on workflow_edges for select
  using (
    workflow_version_id in (
      select wv.id from workflow_versions wv
      join workflows w on w.id = wv.workflow_id
      join department_members dm on dm.department_id = w.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_edges_admin_all"
  on workflow_edges for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_triggers
-- ─────────────────────────────────────────────
create table if not exists workflow_triggers (
  id                  uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  trigger_key         text not null,
  trigger_type        text not null
                      check (trigger_type in ('channel_message', 'webhook', 'cron', 'manual')),
  config              jsonb not null,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  unique(workflow_version_id, trigger_key)
);

alter table workflow_triggers enable row level security;

create policy "workflow_triggers_member_select"
  on workflow_triggers for select
  using (
    workflow_version_id in (
      select wv.id from workflow_versions wv
      join workflows w on w.id = wv.workflow_id
      join department_members dm on dm.department_id = w.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_triggers_admin_all"
  on workflow_triggers for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- Resolve circular FK: workflows.active_version_id → workflow_versions
-- ─────────────────────────────────────────────
alter table workflows
  add constraint workflows_active_version_fk
  foreign key (active_version_id) references workflow_versions(id)
  deferrable initially deferred;
