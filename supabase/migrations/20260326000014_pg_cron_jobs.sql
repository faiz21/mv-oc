-- Migration 20260326000014: pg_cron extension + 4 scheduled jobs + 4 stub functions
-- Phase B: functions are stubs that log to audit_log. Phase C wires up real logic.

-- Enable pg_cron extension (available by default in Supabase hosted projects)
create extension if not exists pg_cron schema pg_catalog;
grant usage on schema cron to postgres;

-- ─────────────────────────────────────────────
-- Stub function: generate_agent_daily_summaries
-- Runs at 23:59 daily via pg_cron
-- Phase C: query task/step data per agent and write agent_daily_summaries rows
-- ─────────────────────────────────────────────
create or replace function generate_agent_daily_summaries()
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_log (entity_type, entity_id, actor_type, event, data)
  values (
    'system',
    'pg_cron',
    'system',
    'agent-daily-summary-tick',
    jsonb_build_object('date', current_date, 'stub', true)
  );
end;
$$;

-- ─────────────────────────────────────────────
-- Stub function: check_sla_violations
-- Runs every 15 minutes via pg_cron
-- Phase C: scan task_items past SLA deadline, create incidents rows
-- ─────────────────────────────────────────────
create or replace function check_sla_violations()
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_log (entity_type, entity_id, actor_type, event, data)
  values (
    'system',
    'pg_cron',
    'system',
    'sla-check-tick',
    jsonb_build_object('checked_at', now(), 'stub', true)
  );
end;
$$;

-- ─────────────────────────────────────────────
-- Stub function: check_gateway_health
-- Runs every 5 minutes via pg_cron
-- Phase C: call openclaw-bridge health endpoint, update heartbeat_sources
-- ─────────────────────────────────────────────
create or replace function check_gateway_health()
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_log (entity_type, entity_id, actor_type, event, data)
  values (
    'system',
    'pg_cron',
    'system',
    'gateway-health-tick',
    jsonb_build_object('checked_at', now(), 'stub', true)
  );
end;
$$;

-- ─────────────────────────────────────────────
-- Stub function: cleanup_stale_workflow_runs
-- Runs daily at 02:00 via pg_cron
-- Phase C: find workflow_runs stuck in 'running' for >24h, set to 'failed'
-- ─────────────────────────────────────────────
create or replace function cleanup_stale_workflow_runs()
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_log (entity_type, entity_id, actor_type, event, data)
  values (
    'system',
    'pg_cron',
    'system',
    'stale-run-cleanup-tick',
    jsonb_build_object('cleaned_at', now(), 'stub', true)
  );
end;
$$;

-- ─────────────────────────────────────────────
-- Schedule the 4 cron jobs (idempotent)
-- ─────────────────────────────────────────────
select cron.unschedule(jobname)
from cron.job
where jobname in (
  'agent-daily-summary',
  'sla-check',
  'gateway-health',
  'stale-run-cleanup'
);

select cron.schedule(
  'agent-daily-summary',
  '59 23 * * *',
  $$select generate_agent_daily_summaries()$$
);

select cron.schedule(
  'sla-check',
  '*/15 * * * *',
  $$select check_sla_violations()$$
);

select cron.schedule(
  'gateway-health',
  '*/5 * * * *',
  $$select check_gateway_health()$$
);

select cron.schedule(
  'stale-run-cleanup',
  '0 2 * * *',
  $$select cleanup_stale_workflow_runs()$$
);
