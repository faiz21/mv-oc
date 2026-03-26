-- Migration 20260326000007: Approvals, Artifacts, and Audit
-- Tables: approval_queue, artifacts, audit_log
-- Also resolves: task_item_files.artifact_id → artifacts (cross-migration FK)

-- ─────────────────────────────────────────────
-- approval_queue
-- ─────────────────────────────────────────────
create table if not exists approval_queue (
  id                   uuid primary key default gen_random_uuid(),
  task_id              uuid references tasks(id),
  workflow_run_id      uuid references workflow_runs(id),
  task_item_id         uuid references task_items(id),
  source_type          text not null check (
    source_type in (
      'task', 'task_item', 'workflow_publish', 'wiki_article',
      'changelog', 'pulse_summary', 'daily_digest', 'escalation'
    )
  ),
  source_ref           text not null,
  gate_type            text not null
                       check (gate_type in ('outbound-message', 'task-result', 'document', 'publish')),
  status               text not null default 'awaiting_review' check (
    status in ('awaiting_review', 'approved', 'rejected', 'expired')
  ),
  content              jsonb not null,
  submitted_by         uuid references profiles(id),
  assigned_reviewer_id uuid references profiles(id),
  reviewed_by          uuid references profiles(id),
  decision             text check (decision in ('approved', 'rejected')),
  notes                text,
  notified_at          timestamptz,
  expires_at           timestamptz,
  decision_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table approval_queue enable row level security;

create policy "approval_queue_assignee_select"
  on approval_queue for select
  using (
    assigned_reviewer_id = auth.uid()
    or submitted_by = auth.uid()
  );

create policy "approval_queue_director_select"
  on approval_queue for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "approval_queue_admin_all"
  on approval_queue for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- artifacts
-- ─────────────────────────────────────────────
create table if not exists artifacts (
  id                   uuid primary key default gen_random_uuid(),
  workflow_run_id      uuid references workflow_runs(id),
  workflow_run_step_id uuid references workflow_run_steps(id),
  task_id              uuid references tasks(id),
  task_item_id         uuid references task_items(id),
  artifact_type        text not null,
  title                text not null,
  storage_kind         text not null
                       check (storage_kind in ('inline_json', 'markdown', 'file_path', 'supabase_storage')),
  content              jsonb,
  file_path            text,
  storage_key          text,
  correlation_id       text,
  created_by_type      text not null check (created_by_type in ('agent', 'human', 'system')),
  created_by_ref       text,
  created_at           timestamptz not null default now()
);

alter table artifacts enable row level security;

create policy "artifacts_select_authenticated"
  on artifacts for select
  using (auth.uid() is not null);

create policy "artifacts_admin_all"
  on artifacts for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- Resolve cross-migration FK: task_item_files.artifact_id → artifacts
-- ─────────────────────────────────────────────
alter table task_item_files
  add constraint task_item_files_artifact_fk
  foreign key (artifact_id) references artifacts(id) on delete set null;

-- ─────────────────────────────────────────────
-- audit_log
-- ─────────────────────────────────────────────
create table if not exists audit_log (
  id              bigserial primary key,
  entity_type     text not null,
  entity_id       text not null,
  task_id         uuid references tasks(id),
  workflow_id     uuid references workflows(id),
  workflow_run_id uuid references workflow_runs(id),
  actor_type      text not null check (actor_type in ('system', 'agent', 'human')),
  actor_ref       text,
  event           text not null,
  data            jsonb,
  created_at      timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "audit_log_select_authenticated"
  on audit_log for select
  using (auth.uid() is not null);

-- No update or delete — audit_log is immutable
