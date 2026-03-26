-- Migration 20260326000008: Automation, Governance, and Operations
-- Tables: automation_jobs, automation_job_runs, heartbeat_sources, heartbeat_events,
--         gateway_health_checks, diagnostic_runs, incidents, system_state

-- ─────────────────────────────────────────────
-- automation_jobs
-- ─────────────────────────────────────────────
create table if not exists automation_jobs (
  id                  uuid primary key default gen_random_uuid(),
  job_key             text unique not null,
  name                text not null,
  owner_type          text not null check (owner_type in ('workflow', 'routine', 'system')),
  owner_ref           text not null,
  schedule_type       text not null check (schedule_type in ('cron', 'heartbeat', 'manual_only')),
  schedule_expression text,
  status              text not null default 'active'
                      check (status in ('active', 'paused', 'deprecated')),
  source_of_truth     text not null
                      check (source_of_truth in ('supabase', 'openclaw', 'external')),
  last_run_at         timestamptz,
  next_run_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table automation_jobs enable row level security;

create policy "automation_jobs_director_select"
  on automation_jobs for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "automation_jobs_admin_all"
  on automation_jobs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- automation_job_runs
-- ─────────────────────────────────────────────
create table if not exists automation_job_runs (
  id               uuid primary key default gen_random_uuid(),
  automation_job_id uuid not null references automation_jobs(id) on delete cascade,
  workflow_run_id  uuid references workflow_runs(id),
  task_id          uuid references tasks(id),
  status           text not null check (
    status in (
      'scheduled', 'running', 'complete', 'failed', 'missed', 'skipped', 'awaiting_approval'
    )
  ),
  started_at       timestamptz,
  completed_at     timestamptz,
  duration_ms      int,
  error            text,
  created_at       timestamptz not null default now()
);

alter table automation_job_runs enable row level security;

create policy "automation_job_runs_director_select"
  on automation_job_runs for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "automation_job_runs_admin_all"
  on automation_job_runs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- heartbeat_sources
-- ─────────────────────────────────────────────
create table if not exists heartbeat_sources (
  id                        uuid primary key default gen_random_uuid(),
  source_key                text unique not null,
  source_type               text not null
                            check (source_type in ('gateway', 'agent', 'worker')),
  agent_id                  text references agents(id),
  expected_interval_seconds int not null,
  status                    text not null,
  last_seen_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table heartbeat_sources enable row level security;

create policy "heartbeat_sources_director_select"
  on heartbeat_sources for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "heartbeat_sources_admin_all"
  on heartbeat_sources for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- heartbeat_events
-- ─────────────────────────────────────────────
create table if not exists heartbeat_events (
  id                  uuid primary key default gen_random_uuid(),
  heartbeat_source_id uuid not null references heartbeat_sources(id) on delete cascade,
  status              text not null
                      check (status in ('healthy', 'idle', 'degraded', 'unreachable')),
  payload             jsonb,
  created_at          timestamptz not null default now()
);

alter table heartbeat_events enable row level security;

create policy "heartbeat_events_director_select"
  on heartbeat_events for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "heartbeat_events_admin_all"
  on heartbeat_events for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- gateway_health_checks
-- ─────────────────────────────────────────────
create table if not exists gateway_health_checks (
  id                  uuid primary key default gen_random_uuid(),
  heartbeat_source_id uuid references heartbeat_sources(id),
  gateway_name        text not null,
  status              text not null check (status in ('healthy', 'degraded', 'down')),
  latency_ms          int,
  payload             jsonb,
  checked_at          timestamptz not null default now()
);

alter table gateway_health_checks enable row level security;

create policy "gateway_health_checks_director_select"
  on gateway_health_checks for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "gateway_health_checks_admin_all"
  on gateway_health_checks for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- diagnostic_runs
-- ─────────────────────────────────────────────
create table if not exists diagnostic_runs (
  id               uuid primary key default gen_random_uuid(),
  diagnostic_type  text not null check (
    diagnostic_type in ('doctor', 'channels_probe', 'logs_follow', 'restart_gateway')
  ),
  gateway_name     text not null,
  triggered_by     uuid references profiles(id),
  status           text not null default 'queued'
                   check (status in ('queued', 'running', 'complete', 'failed', 'timed_out')),
  command_label    text,
  output           text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table diagnostic_runs enable row level security;

create policy "diagnostic_runs_director_select"
  on diagnostic_runs for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "diagnostic_runs_director_insert"
  on diagnostic_runs for insert
  with check (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "diagnostic_runs_admin_all"
  on diagnostic_runs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- incidents
-- ─────────────────────────────────────────────
create table if not exists incidents (
  id            uuid primary key default gen_random_uuid(),
  incident_type text not null check (
    incident_type in (
      'task_failure', 'agent_unreachable', 'gateway_down',
      'queue_backlog', 'approval_backlog', 'automation_missed'
    )
  ),
  severity      text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status        text not null default 'open' check (
    status in ('open', 'acknowledged', 'investigating', 'resolved', 'suppressed')
  ),
  source_ref    text not null,
  title         text not null,
  summary       text,
  task_id       uuid references tasks(id),
  agent_id      text references agents(id),
  opened_at     timestamptz not null default now(),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table incidents enable row level security;

create policy "incidents_director_select"
  on incidents for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "incidents_admin_all"
  on incidents for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- system_state
-- ─────────────────────────────────────────────
create table if not exists system_state (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

alter table system_state enable row level security;

create policy "system_state_director_select"
  on system_state for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('director', 'admin')
    )
  );

create policy "system_state_admin_all"
  on system_state for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed required governance state rows
insert into system_state (key, value) values
  ('global_execution',       '{"emergency_stop": false}'),
  ('global_automation_pause', '{"paused": false}'),
  ('heartbeat_alerting',     '{"enabled": true}'),
  ('channel_health',         '{"discord": "unknown", "teams": "unknown"}')
on conflict (key) do nothing;
