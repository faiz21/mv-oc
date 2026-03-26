-- PENDING MIGRATION — T-08-10 and T-08-11
-- Points Award Triggers
--
-- These triggers require the `net` (pg_net) or `http` Postgres extension to be
-- enabled in Supabase to call Edge Functions from triggers.
-- The Database Engineer must verify `pg_net` is available before applying.
--
-- Owner: Database Engineer
-- Dependencies: T-08-02 (points-award Edge Function deployed)
--
-- DO NOT apply this migration until:
--   1. `pg_net` extension is confirmed enabled
--   2. SUPABASE_URL and SERVICE_ROLE_KEY are available as DB secrets
--   3. points-backfill Edge Function is deployed

-- ─────────────────────────────────────────────
-- T-08-10: Trigger — Points Award on Task Complete
-- ─────────────────────────────────────────────
-- Fires when tasks.status transitions to 'complete' and is_sandbox = false.
-- Calls points-award Edge Function via HTTP.

create or replace function gaming_award_points_on_task_complete()
returns trigger
language plpgsql
security definer
as $$
declare
  supabase_url text;
  service_key  text;
begin
  -- Only fire on completion of non-sandbox tasks
  if new.status = 'complete' and old.status <> 'complete' and (new.is_sandbox is null or new.is_sandbox = false) then
    -- Get secrets (set via Supabase vault or environment)
    select decrypted_secret into supabase_url
    from vault.decrypted_secrets
    where name = 'SUPABASE_URL'
    limit 1;

    select decrypted_secret into service_key
    from vault.decrypted_secrets
    where name = 'SUPABASE_SERVICE_ROLE_KEY'
    limit 1;

    -- Fire-and-forget HTTP call to points-award Edge Function
    perform net.http_post(
      url    := supabase_url || '/functions/v1/points-award',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'user_id',     new.assigned_to,
        'action_type', 'task_completed',
        'ref_id',      new.id::text,
        'ref_type',    'task',
        'context', jsonb_build_object(
          'task_created_at',   new.created_at,
          'task_completed_at', now()
        )
      )::text
    );

  end if;
  return new;
exception
  when others then
    -- Log error but do not block task completion
    raise warning 'gaming_award_points_on_task_complete: %', sqlerrm;
    return new;
end;
$$;

-- Drop trigger if exists before creating
drop trigger if exists gaming_task_complete_points on tasks;

create trigger gaming_task_complete_points
  after update of status on tasks
  for each row
  execute function gaming_award_points_on_task_complete();

-- ─────────────────────────────────────────────
-- T-08-11: Trigger — Points Award on Approval Decision
-- ─────────────────────────────────────────────
-- Fires when approval_queue.decision transitions to 'approved' or 'rejected'.

create or replace function gaming_award_points_on_approval()
returns trigger
language plpgsql
security definer
as $$
declare
  supabase_url   text;
  service_key    text;
  elapsed_min    float;
  action_type_v  text;
begin
  if new.decision in ('approved', 'rejected') and (old.decision is null or old.decision not in ('approved', 'rejected')) then
    -- Determine action type based on elapsed time and decision
    elapsed_min := extract(epoch from (now() - new.created_at)) / 60.0;

    if new.decision = 'rejected' then
      action_type_v := 'approval_rejected';
    elsif elapsed_min < 60 then
      action_type_v := 'approval_reviewed_fast';
    else
      action_type_v := 'approval_reviewed_slow';
    end if;

    select decrypted_secret into supabase_url
    from vault.decrypted_secrets
    where name = 'SUPABASE_URL'
    limit 1;

    select decrypted_secret into service_key
    from vault.decrypted_secrets
    where name = 'SUPABASE_SERVICE_ROLE_KEY'
    limit 1;

    perform net.http_post(
      url     := supabase_url || '/functions/v1/points-award',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'user_id',     new.reviewer_id,
        'action_type', action_type_v,
        'ref_id',      new.id::text,
        'ref_type',    'approval_queue',
        'context', jsonb_build_object(
          'approval_created_at',  new.created_at,
          'approval_reviewed_at', now()
        )
      )::text
    );

  end if;
  return new;
exception
  when others then
    raise warning 'gaming_award_points_on_approval: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists gaming_approval_decision_points on approval_queue;

create trigger gaming_approval_decision_points
  after update of decision on approval_queue
  for each row
  execute function gaming_award_points_on_approval();
