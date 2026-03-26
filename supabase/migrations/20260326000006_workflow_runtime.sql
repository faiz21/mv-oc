-- Migration 20260326000006: Workflow Runtime & Outputs
-- Tables: workflow_runs, workflow_run_steps, workflow_step_dependencies,
--         tasks, task_queue, task_items, task_item_files, context_packets
-- Circular FKs resolved:
--   workflow_runs.context_packet_id ↔ context_packets (ALTER TABLE at end)
--   task_item_files.artifact_id ↔ artifacts (ALTER TABLE in migration 7)

-- ─────────────────────────────────────────────
-- workflow_runs (context_packet_id FK added after context_packets)
-- ─────────────────────────────────────────────
create table if not exists workflow_runs (
  id                  uuid primary key default gen_random_uuid(),
  workflow_id         uuid not null references workflows(id),
  workflow_version_id uuid not null references workflow_versions(id),
  trigger_type        text not null,
  trigger_ref         text,
  status              text not null default 'pending' check (
    status in (
      'pending', 'running', 'awaiting_approval', 'paused',
      'complete', 'failed', 'cancelled'
    )
  ),
  correlation_id      text,
  project_id          uuid references projects(id),
  department_id       uuid not null references departments(id),
  initiated_by        uuid references profiles(id),
  current_step_run_id uuid,
  input_payload       jsonb not null default '{}'::jsonb,
  context_packet_id   uuid,  -- FK added below after context_packets exists
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table workflow_runs enable row level security;

create policy "workflow_runs_member_select"
  on workflow_runs for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "workflow_runs_admin_all"
  on workflow_runs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_run_steps
-- ─────────────────────────────────────────────
create table if not exists workflow_run_steps (
  id                  uuid primary key default gen_random_uuid(),
  workflow_run_id     uuid not null references workflow_runs(id) on delete cascade,
  workflow_node_id    uuid not null references workflow_nodes(id),
  parent_step_run_id  uuid references workflow_run_steps(id),
  status              text not null default 'pending' check (
    status in (
      'pending', 'ready', 'running', 'awaiting_approval', 'blocked',
      'complete', 'failed', 'rejected', 'skipped', 'cancelled'
    )
  ),
  executor_type       text not null check (executor_type in ('agent', 'agent_group', 'system')),
  executor_ref        text,
  correlation_id      text,
  group_key           text,
  input_payload       jsonb not null default '{}'::jsonb,
  output_payload      jsonb,
  error               text,
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table workflow_run_steps enable row level security;

create policy "workflow_run_steps_member_select"
  on workflow_run_steps for select
  using (
    workflow_run_id in (
      select wr.id from workflow_runs wr
      join department_members dm on dm.department_id = wr.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_run_steps_admin_all"
  on workflow_run_steps for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- workflow_step_dependencies
-- ─────────────────────────────────────────────
create table if not exists workflow_step_dependencies (
  id                       uuid primary key default gen_random_uuid(),
  workflow_run_id          uuid not null references workflow_runs(id) on delete cascade,
  step_run_id              uuid not null references workflow_run_steps(id) on delete cascade,
  depends_on_step_run_id   uuid not null references workflow_run_steps(id) on delete cascade,
  dependency_type          text not null default 'complete'
                           check (dependency_type in ('complete', 'approved', 'success')),
  unique(step_run_id, depends_on_step_run_id, dependency_type)
);

alter table workflow_step_dependencies enable row level security;

create policy "workflow_step_deps_member_select"
  on workflow_step_dependencies for select
  using (
    workflow_run_id in (
      select wr.id from workflow_runs wr
      join department_members dm on dm.department_id = wr.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "workflow_step_deps_admin_all"
  on workflow_step_dependencies for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────
create table if not exists tasks (
  id                    uuid primary key default gen_random_uuid(),
  workflow_run_id       uuid references workflow_runs(id),
  workflow_run_step_id  uuid references workflow_run_steps(id),
  workflow_id           uuid references workflows(id),
  workflow_version_id   uuid references workflow_versions(id),
  project_id            uuid references projects(id),
  department_id         uuid references departments(id),
  type                  text not null,
  status                text not null default 'pending' check (
    status in (
      'pending', 'queued', 'running', 'awaiting_approval', 'approved',
      'complete', 'failed', 'rejected', 'cancelled'
    )
  ),
  source                text,
  source_ref            text,
  assigned_to           uuid references profiles(id),
  agent_id              text references agents(id),
  correlation_id        text,
  parent_task_id        uuid references tasks(id),
  context               jsonb not null default '{}'::jsonb,
  payload               jsonb not null default '{}'::jsonb,
  result                jsonb,
  approved_by           uuid references profiles(id),
  attempt_count         int not null default 0,
  error                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  completed_at          timestamptz
);

alter table tasks enable row level security;

create policy "tasks_member_select"
  on tasks for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
    or assigned_to = auth.uid()
  );

create policy "tasks_admin_all"
  on tasks for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- task_queue
-- ─────────────────────────────────────────────
create table if not exists task_queue (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null unique references tasks(id) on delete cascade,
  priority       int not null default 5,
  claimed_by     text,
  locked_until   timestamptz,
  queued_at      timestamptz not null default now(),
  released_at    timestamptz,
  release_reason text
);

alter table task_queue enable row level security;
-- Service role only — no user-facing policies

-- ─────────────────────────────────────────────
-- task_items
-- ─────────────────────────────────────────────
create table if not exists task_items (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid references projects(id),
  department_id        uuid references departments(id),
  workflow_run_id      uuid references workflow_runs(id) on delete cascade,
  workflow_run_step_id uuid references workflow_run_steps(id) on delete set null,
  task_id              uuid references tasks(id) on delete set null,
  parent_task_item_id  uuid references task_items(id),
  board_column_id      uuid references board_columns(id),
  correlation_id       text,
  item_type            text not null,
  title                text not null,
  description          text,
  status               text not null default 'open' check (
    status in ('open', 'in_progress', 'awaiting_review', 'complete', 'rejected', 'cancelled')
  ),
  assigned_to          uuid references profiles(id),
  created_by_type      text not null check (created_by_type in ('agent', 'human', 'system')),
  created_by_ref       text,
  priority             int not null default 5,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz
);

alter table task_items enable row level security;

create policy "task_items_member_select"
  on task_items for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
    or assigned_to = auth.uid()
  );

create policy "task_items_admin_all"
  on task_items for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- task_item_files (artifact_id FK added in migration 7)
-- ─────────────────────────────────────────────
create table if not exists task_item_files (
  id             uuid primary key default gen_random_uuid(),
  task_item_id   uuid not null references task_items(id) on delete cascade,
  artifact_id    uuid,  -- FK to artifacts added in migration 7
  file_kind      text not null,
  storage_kind   text not null
                 check (storage_kind in ('inline_json', 'file_path', 'supabase_storage')),
  file_name      text,
  file_path      text,
  storage_key    text,
  mime_type      text,
  version_number int not null default 1,
  is_primary     boolean not null default false,
  review_status  text not null default 'unreviewed'
                 check (review_status in ('unreviewed', 'awaiting_review', 'approved', 'rejected')),
  created_at     timestamptz not null default now()
);

alter table task_item_files enable row level security;

create policy "task_item_files_member_select"
  on task_item_files for select
  using (
    task_item_id in (
      select ti.id from task_items ti
      join department_members dm on dm.department_id = ti.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "task_item_files_admin_all"
  on task_item_files for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- context_packets
-- ─────────────────────────────────────────────
create table if not exists context_packets (
  id                   uuid primary key default gen_random_uuid(),
  workflow_run_id      uuid references workflow_runs(id),
  workflow_run_step_id uuid references workflow_run_steps(id),
  task_id              uuid references tasks(id),
  agent_id             text references agents(id),
  packet_type          text not null
                       check (packet_type in ('execution', 'approval_review', 'resume', 'sandbox')),
  state_json           jsonb not null,
  prompt_text          text not null,
  retrieval_doc_ids    uuid[] default '{}',
  created_at           timestamptz not null default now()
);

alter table context_packets enable row level security;
-- Service role only for writes; authenticated for own workflow run context
create policy "context_packets_member_select"
  on context_packets for select
  using (
    workflow_run_id in (
      select wr.id from workflow_runs wr
      join department_members dm on dm.department_id = wr.department_id
      where dm.user_id = auth.uid()
    )
  );

create policy "context_packets_admin_all"
  on context_packets for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- Resolve circular FK: workflow_runs.context_packet_id → context_packets
-- ─────────────────────────────────────────────
alter table workflow_runs
  add constraint workflow_runs_context_packet_fk
  foreign key (context_packet_id) references context_packets(id)
  deferrable initially deferred;
