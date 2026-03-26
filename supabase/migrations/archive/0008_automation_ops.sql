-- Migration 0008: Automation & Operational Infrastructure

create table automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text unique not null,
  name text not null,
  owner_type text not null check (owner_type in ('workflow', 'routine', 'system')),
  owner_ref text not null,
  schedule_type text not null check (schedule_type in ('cron', 'heartbeat', 'manual_only')),
  schedule_expression text,
  status text not null default 'active' check (status in ('active', 'paused', 'deprecated')),
  source_of_truth text not null check (source_of_truth in ('supabase', 'openclaw', 'external')),
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table automation_job_runs (
  id uuid primary key default gen_random_uuid(),
  automation_job_id uuid not null references automation_jobs(id) on delete cascade,
  workflow_run_id uuid references workflow_runs(id),
  task_id uuid references tasks(id),
  status text not null check (
    status in ('scheduled', 'running', 'complete', 'failed', 'missed', 'skipped', 'awaiting_approval')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms int,
  error text,
  created_at timestamptz not null default now()
);

create table heartbeat_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  source_type text not null check (source_type in ('gateway', 'agent', 'worker')),
  agent_id text references agents(id),
  expected_interval_seconds int not null,
  status text not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table heartbeat_events (
  id uuid primary key default gen_random_uuid(),
  heartbeat_source_id uuid not null references heartbeat_sources(id) on delete cascade,
  status text not null check (status in ('healthy', 'idle', 'degraded', 'unreachable')),
  payload jsonb,
  created_at timestamptz not null default now()
);

create table gateway_health_checks (
  id uuid primary key default gen_random_uuid(),
  heartbeat_source_id uuid references heartbeat_sources(id),
  gateway_name text not null,
  status text not null check (status in ('healthy', 'degraded', 'down')),
  latency_ms int,
  payload jsonb,
  checked_at timestamptz not null default now()
);

create table diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  diagnostic_type text not null check (
    diagnostic_type in ('doctor', 'channels_probe', 'logs_follow', 'restart_gateway')
  ),
  gateway_name text not null,
  triggered_by uuid references profiles(id),
  status text not null default 'queued' check (
    status in ('queued', 'running', 'complete', 'failed', 'timed_out')
  ),
  command_label text,
  output text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null check (
    incident_type in (
      'task_failure', 'agent_unreachable', 'gateway_down',
      'queue_backlog', 'approval_backlog', 'automation_missed'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (
    status in ('open', 'acknowledged', 'investigating', 'resolved', 'suppressed')
  ),
  source_ref text not null,
  title text not null,
  summary text,
  task_id uuid references tasks(id),
  agent_id text references agents(id),
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table system_state (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- Seed: default system state
insert into system_state (key, value) values
  ('global_execution', '{"emergency_stop": false}'::jsonb),
  ('global_automation_pause', '{"paused": false}'::jsonb),
  ('heartbeat_alerting', '{"enabled": true}'::jsonb),
  ('channel_health', '{"discord": "healthy", "teams": "healthy"}'::jsonb)
on conflict (key) do nothing;

create index automation_jobs_status_idx on automation_jobs(status);
create index automation_job_runs_automation_job_id_idx on automation_job_runs(automation_job_id);
create index automation_job_runs_status_idx on automation_job_runs(status);
create index heartbeat_sources_source_key_idx on heartbeat_sources(source_key);
create index heartbeat_events_heartbeat_source_id_idx on heartbeat_events(heartbeat_source_id);
create index incidents_status_idx on incidents(status);

-- RLS
alter table automation_jobs enable row level security;
alter table automation_job_runs enable row level security;
alter table heartbeat_sources enable row level security;
alter table heartbeat_events enable row level security;
alter table gateway_health_checks enable row level security;
alter table diagnostic_runs enable row level security;
alter table incidents enable row level security;
alter table system_state enable row level security;

create policy "Authenticated users can read automation jobs" on automation_jobs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read automation job runs" on automation_job_runs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read heartbeat sources" on heartbeat_sources for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read heartbeat events" on heartbeat_events for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read gateway health checks" on gateway_health_checks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read diagnostic runs" on diagnostic_runs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read incidents" on incidents for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read system state" on system_state for select using (auth.role() = 'authenticated');
create policy "Admins can manage system state" on system_state for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
