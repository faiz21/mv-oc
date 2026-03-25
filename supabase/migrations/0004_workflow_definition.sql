-- Migration 0004: Workflow Definition — workflows, versions, nodes, edges, triggers

create table workflows (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive')),
  primary_agent_id text references agents(id),
  requires_approval boolean not null default false,
  requires_approval_reason text,
  active_version_id uuid, -- FK added after workflow_versions exists (below)
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (
    requires_approval = false
    or requires_approval_reason is not null
  )
);

create table workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  version_number int not null,
  status_snapshot text not null,
  name_snapshot text not null,
  description_snapshot text,
  primary_agent_id text references agents(id),
  requires_approval boolean not null,
  requires_approval_reason text,
  change_summary text,
  saved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique(workflow_id, version_number)
);

-- Add deferred FK now that workflow_versions exists
alter table workflows
  add constraint workflows_active_version_fk
  foreign key (active_version_id) references workflow_versions(id);

-- React Flow node definitions
create table workflow_nodes (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  node_key text not null,
  node_type text not null check (
    node_type in (
      'start',
      'agent_task',
      'approval_gate',
      'wait_join',
      'parallel_branch',
      'webhook_trigger',
      'manual_trigger',
      'cron_trigger',
      'end'
    )
  ),
  label text not null,
  position_x numeric(12,2),
  position_y numeric(12,2),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(workflow_version_id, node_key)
);

create table workflow_edges (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  edge_key text not null,
  source_node_key text not null,
  target_node_key text not null,
  condition_type text not null default 'always'
    check (condition_type in ('always', 'success', 'failure', 'approval')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(workflow_version_id, edge_key),
  constraint workflow_edges_source_fk
    foreign key (workflow_version_id, source_node_key)
    references workflow_nodes(workflow_version_id, node_key),
  constraint workflow_edges_target_fk
    foreign key (workflow_version_id, target_node_key)
    references workflow_nodes(workflow_version_id, node_key)
);

create table workflow_triggers (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references workflow_versions(id) on delete cascade,
  trigger_key text not null,
  trigger_type text not null
    check (trigger_type in ('channel_message', 'webhook', 'cron', 'manual')),
  config jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workflow_version_id, trigger_key)
);

create index workflows_key_idx on workflows(key);
create index workflows_status_idx on workflows(status);
create index workflow_nodes_version_idx on workflow_nodes(workflow_version_id);
create index workflow_edges_version_idx on workflow_edges(workflow_version_id);

-- RLS
alter table workflows enable row level security;
alter table workflow_versions enable row level security;
alter table workflow_nodes enable row level security;
alter table workflow_edges enable row level security;
alter table workflow_triggers enable row level security;

create policy "Authenticated users can read workflows"
  on workflows for select using (auth.role() = 'authenticated');

create policy "Operators and admins can write workflows"
  on workflows for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')
  ));

create policy "Authenticated users can read workflow versions"
  on workflow_versions for select using (auth.role() = 'authenticated');

create policy "Operators and admins can write workflow versions"
  on workflow_versions for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')
  ));

create policy "Authenticated users can read workflow nodes"
  on workflow_nodes for select using (auth.role() = 'authenticated');

create policy "Operators and admins can write workflow nodes"
  on workflow_nodes for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')
  ));

create policy "Authenticated users can read workflow edges"
  on workflow_edges for select using (auth.role() = 'authenticated');

create policy "Operators and admins can write workflow edges"
  on workflow_edges for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')
  ));

create policy "Authenticated users can read workflow triggers"
  on workflow_triggers for select using (auth.role() = 'authenticated');

create policy "Operators and admins can write workflow triggers"
  on workflow_triggers for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator')
  ));
