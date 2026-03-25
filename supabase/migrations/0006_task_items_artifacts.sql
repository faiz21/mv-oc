-- Migration 0006: Task Items & Artifacts

-- Must create artifacts first (task_item_files references it)
create table artifacts (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id),
  workflow_run_step_id uuid references workflow_run_steps(id),
  task_id uuid references tasks(id),
  task_item_id uuid, -- FK added after task_items exists
  artifact_type text not null,
  title text not null,
  storage_kind text not null check (
    storage_kind in ('inline_json', 'markdown', 'file_path', 'supabase_storage')
  ),
  content jsonb,
  file_path text,
  storage_key text,
  correlation_id text,
  created_by_type text not null check (created_by_type in ('agent', 'human', 'system')),
  created_by_ref text,
  created_at timestamptz not null default now()
);

create table task_items (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id) on delete cascade,
  workflow_run_step_id uuid references workflow_run_steps(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  parent_task_item_id uuid references task_items(id),
  correlation_id text,
  item_type text not null,
  title text not null,
  description text,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'awaiting_review', 'complete', 'rejected', 'cancelled')
  ),
  assigned_to uuid references profiles(id),
  created_by_type text not null check (created_by_type in ('agent', 'human', 'system')),
  created_by_ref text,
  priority int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Add deferred FK on artifacts → task_items
alter table artifacts
  add constraint artifacts_task_item_fk
  foreign key (task_item_id) references task_items(id);

create table task_item_files (
  id uuid primary key default gen_random_uuid(),
  task_item_id uuid not null references task_items(id) on delete cascade,
  artifact_id uuid references artifacts(id) on delete set null,
  file_kind text not null,
  storage_kind text not null check (
    storage_kind in ('inline_json', 'file_path', 'supabase_storage')
  ),
  file_name text,
  file_path text,
  storage_key text,
  mime_type text,
  version_number int not null default 1,
  is_primary boolean not null default false,
  review_status text not null default 'unreviewed' check (
    review_status in ('unreviewed', 'awaiting_review', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index task_items_workflow_run_id_idx on task_items(workflow_run_id);
create index task_items_item_type_idx on task_items(item_type);
create index task_item_files_task_item_id_idx on task_item_files(task_item_id);
create index artifacts_workflow_run_id_idx on artifacts(workflow_run_id);
create index artifacts_artifact_type_idx on artifacts(artifact_type);

-- RLS
alter table task_items enable row level security;
alter table task_item_files enable row level security;
alter table artifacts enable row level security;

create policy "Authenticated users can read task items"
  on task_items for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read task item files"
  on task_item_files for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read artifacts"
  on artifacts for select using (auth.role() = 'authenticated');
