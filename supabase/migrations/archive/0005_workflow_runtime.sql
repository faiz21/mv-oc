-- Migration 0005: Workflow Runtime — runs, steps, dependencies, tasks, task_queue

create table workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id),
  workflow_version_id uuid not null references workflow_versions(id),
  trigger_type text not null,
  trigger_ref text,
  status text not null default 'pending' check (
    status in (
      'pending', 'running', 'awaiting_approval', 'paused',
      'complete', 'failed', 'cancelled'
    )
  ),
  correlation_id text,
  project_key text,
  entity_id uuid,
  initiated_by uuid references profiles(id),
  current_step_run_id uuid,
  input_payload jsonb not null default '{}'::jsonb,
  context_packet_id uuid,
  sla_due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  workflow_node_id uuid not null references workflow_nodes(id),
  parent_step_run_id uuid references workflow_run_steps(id),
  status text not null default 'pending' check (
    status in (
      'pending', 'ready', 'running', 'awaiting_approval',
      'blocked', 'complete', 'failed', 'rejected', 'skipped', 'cancelled'
    )
  ),
  executor_type text not null check (executor_type in ('agent', 'agent_group', 'system')),
  executor_ref text,
  correlation_id text,
  group_key text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error text,
  sla_due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workflow_step_dependencies (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  step_run_id uuid not null references workflow_run_steps(id) on delete cascade,
  depends_on_step_run_id uuid not null references workflow_run_steps(id) on delete cascade,
  dependency_type text not null default 'complete' check (
    dependency_type in ('complete', 'approved', 'success')
  ),
  unique(step_run_id, depends_on_step_run_id, dependency_type)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id),
  workflow_run_step_id uuid references workflow_run_steps(id),
  workflow_id uuid references workflows(id),
  workflow_version_id uuid references workflow_versions(id),
  type text not null,
  status text not null default 'pending' check (
    status in (
      'pending', 'queued', 'running', 'awaiting_approval',
      'approved', 'complete', 'failed', 'rejected', 'cancelled'
    )
  ),
  title text,
  source text,
  source_ref text,
  assigned_to uuid references profiles(id),
  agent_id text references agents(id),
  correlation_id text,
  parent_task_id uuid references tasks(id),
  context jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  approved_by uuid references profiles(id),
  attempt_count int not null default 0,
  due_at timestamptz,
  priority int not null default 5,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table task_queue (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique references tasks(id) on delete cascade,
  priority int not null default 5,
  claimed_by text,
  locked_until timestamptz,
  queued_at timestamptz not null default now(),
  released_at timestamptz,
  release_reason text
);

create index workflow_runs_workflow_id_idx on workflow_runs(workflow_id);
create index workflow_runs_status_idx on workflow_runs(status);
create index workflow_run_steps_workflow_run_id_idx on workflow_run_steps(workflow_run_id);
create index workflow_run_steps_status_idx on workflow_run_steps(status);
create index tasks_workflow_run_id_idx on tasks(workflow_run_id);
create index tasks_status_idx on tasks(status);
create index tasks_agent_id_idx on tasks(agent_id);
create index tasks_assigned_to_idx on tasks(assigned_to);
create index task_queue_priority_idx on task_queue(priority);
create index task_queue_locked_until_idx on task_queue(locked_until);

-- RLS
alter table workflow_runs enable row level security;
alter table workflow_run_steps enable row level security;
alter table workflow_step_dependencies enable row level security;
alter table tasks enable row level security;
alter table task_queue enable row level security;

create policy "Authenticated users can read workflow runs"
  on workflow_runs for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read workflow run steps"
  on workflow_run_steps for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read step dependencies"
  on workflow_step_dependencies for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read tasks"
  on tasks for select using (auth.role() = 'authenticated');

create policy "Users can read their assigned tasks"
  on tasks for select using (assigned_to = auth.uid());

create policy "Authenticated users can read task queue"
  on task_queue for select using (auth.role() = 'authenticated');
