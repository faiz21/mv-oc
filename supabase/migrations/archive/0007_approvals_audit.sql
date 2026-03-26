-- Migration 0007: Approvals & Audit

create table approval_queue (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  workflow_run_id uuid references workflow_runs(id),
  task_item_id uuid references task_items(id),
  source_type text not null check (
    source_type in (
      'task', 'task_item', 'workflow_publish', 'wiki_article',
      'changelog', 'pulse_summary', 'daily_digest', 'escalation'
    )
  ),
  source_ref text not null,
  gate_type text not null check (
    gate_type in ('outbound-message', 'task-result', 'document', 'publish')
  ),
  status text not null default 'awaiting_review' check (
    status in ('awaiting_review', 'approved', 'rejected', 'expired')
  ),
  content jsonb not null,
  submitted_by uuid references profiles(id),
  assigned_reviewer_id uuid references profiles(id),
  reviewed_by uuid references profiles(id),
  decision text check (decision in ('approved', 'rejected')),
  notes text,
  notified_at timestamptz,
  expires_at timestamptz,
  decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  entity_type text not null,
  entity_id text not null,
  task_id uuid references tasks(id),
  workflow_id uuid references workflows(id),
  workflow_run_id uuid references workflow_runs(id),
  actor_type text not null check (actor_type in ('system', 'agent', 'human')),
  actor_ref text,
  event text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index approval_queue_status_idx on approval_queue(status);
create index approval_queue_assigned_reviewer_id_idx on approval_queue(assigned_reviewer_id);
create index approval_queue_workflow_run_id_idx on approval_queue(workflow_run_id);
create index audit_log_workflow_run_id_idx on audit_log(workflow_run_id);
create index audit_log_task_id_idx on audit_log(task_id);
create index audit_log_entity_type_idx on audit_log(entity_type);
create index audit_log_created_at_idx on audit_log(created_at);

-- RLS
alter table approval_queue enable row level security;
alter table audit_log enable row level security;

-- Officers see items assigned to them or submitted by them
create policy "Users can read their own approval queue items"
  on approval_queue for select
  using (
    assigned_reviewer_id = auth.uid()
    or submitted_by = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can manage approval queue"
  on approval_queue for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Authenticated users can read audit log"
  on audit_log for select using (auth.role() = 'authenticated');
