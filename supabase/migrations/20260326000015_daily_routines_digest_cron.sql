-- Migration 20260326000015: Daily Routines digest pg_cron job
-- Registers a daily-digest-generation stub that fires at 23:59.
-- The stub logs to audit_log; Phase C wires to the real Edge Function / API route.
-- NO auto-distribution. Every digest requires explicit human approval
-- before reaching any team channel (enforced via approval_queue gate).

-- ─────────────────────────────────────────────────────────────────────────────
-- Stub function: trigger_daily_digest_generation
-- Called nightly at 23:59 by pg_cron.
-- Inserts an audit_log tick so DevOps can confirm the job fires.
-- Phase C: replace body with net.http_post call to the digest-generate endpoint.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function trigger_daily_digest_generation()
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_log (entity_type, entity_id, actor_type, actor_ref, event, data)
  values (
    'system',
    'pg_cron',
    'system',
    'pg_cron',
    'daily_digest:cron_tick',
    jsonb_build_object('date', current_date, 'stub', true)
  );

  -- Phase C implementation (uncomment and set PROJECT_ID once net extension enabled):
  -- perform net.http_post(
  --   url     := 'https://[PROJECT_ID].supabase.co/functions/v1/daily-routines-digest-generate',
  --   body    := '{}'::jsonb,
  --   headers := jsonb_build_object(
  --     'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
  --     'Content-Type', 'application/json'
  --   )
  -- );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Schedule the cron job (idempotent: unschedule first)
-- Default: 23:59 UTC daily. Admin can change via daily_routines_config.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.unschedule(jobname)
from cron.job
where jobname = 'daily-digest-generation';

select cron.schedule(
  'daily-digest-generation',
  '59 23 * * *',
  $$select trigger_daily_digest_generation()$$
);
