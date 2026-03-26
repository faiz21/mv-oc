-- ============================================================
-- Migration 0021: Gaming Session (Phase 4)
-- Tables: points_ledger, badges, user_badges, leaderboard_snapshots,
--         sandbox_runs, sandbox_run_steps, point_config,
--         team_activity, team_activity_responses, team_activity_reactions
-- ============================================================

-- 1. points_ledger (append-only)
create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points integer not null,
  action_type text not null,
  reason text,
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  approval_queue_id uuid references approval_queue(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint positive_points check (points > 0)
);

create index if not exists idx_points_ledger_user_id on points_ledger(user_id);
create index if not exists idx_points_ledger_created_at on points_ledger(created_at);
create index if not exists idx_points_ledger_action_type on points_ledger(action_type);

-- Immutability trigger
create or replace function prevent_points_ledger_mutation()
returns trigger as $$
begin
  raise exception 'points_ledger is append-only: no updates or deletes allowed';
end;
$$ language plpgsql;

create trigger trg_prevent_points_ledger_mutation
before update or delete on points_ledger
for each row execute function prevent_points_ledger_mutation();

-- 2. badges
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon_id text not null,
  color text not null default 'amber',
  criteria jsonb not null default '{}',
  tier text not null default 'standard' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_badges_slug on badges(slug);
create index if not exists idx_badges_enabled on badges(enabled);

-- 3. user_badges
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by text not null default 'system',
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_badges_user_id on user_badges(user_id);
create index if not exists idx_user_badges_badge_id on user_badges(badge_id);
create index if not exists idx_user_badges_awarded_at on user_badges(awarded_at);

-- 4. leaderboard_snapshots
create table if not exists leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('daily', 'weekly', 'monthly', 'alltime')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  data jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_leaderboard_snapshots_period on leaderboard_snapshots(period, period_start);
create index if not exists idx_leaderboard_snapshots_generated_at on leaderboard_snapshots(generated_at);

-- 5. sandbox_runs
create table if not exists sandbox_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed', 'halted')),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  scenario_name text,
  started_at timestamptz,
  completed_at timestamptz,
  execution_time_ms integer,
  sandbox_tag text unique default ('sandbox-' || gen_random_uuid()::text),
  created_at timestamptz not null default now()
);

create index if not exists idx_sandbox_runs_user_id on sandbox_runs(user_id);
create index if not exists idx_sandbox_runs_workflow_id on sandbox_runs(workflow_id);
create index if not exists idx_sandbox_runs_status on sandbox_runs(status);
create index if not exists idx_sandbox_runs_created_at on sandbox_runs(created_at);

-- 6. sandbox_run_steps
create table if not exists sandbox_run_steps (
  id uuid primary key default gen_random_uuid(),
  sandbox_run_id uuid not null references sandbox_runs(id) on delete cascade,
  step_index integer not null,
  step_name text not null,
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed')),
  executor_type text check (executor_type in ('agent', 'human', 'system')),
  executor_ref text,
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_sandbox_run_steps_sandbox_run_id on sandbox_run_steps(sandbox_run_id);
create index if not exists idx_sandbox_run_steps_status on sandbox_run_steps(status);

-- 7. point_config
create table if not exists point_config (
  id uuid primary key default gen_random_uuid(),
  action_type text unique not null,
  base_points integer not null,
  bonus_points integer default 0,
  bonus_condition text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

insert into point_config (action_type, base_points, bonus_points, bonus_condition) values
  ('task_completed', 10, 5, 'completed_within_1h'),
  ('approval_reviewed_fast', 15, 0, null),
  ('approval_reviewed_slow', 5, 0, null),
  ('approval_rejected', 5, 0, null),
  ('standup_submitted_ontime', 5, 0, null),
  ('standup_submitted_late', 2, 0, null),
  ('daily_login', 2, 0, null),
  ('incident_high_severity', 25, 0, null),
  ('workflow_created', 20, 0, null)
on conflict (action_type) do nothing;

-- 8. team_activity
create table if not exists team_activity (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('poll', 'shoutout', 'event')),
  author_id uuid not null references profiles(id) on delete cascade,
  content jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  visibility text not null default 'team' check (visibility in ('team', 'admins_only')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closes_at timestamptz
);

create index if not exists idx_team_activity_type on team_activity(type);
create index if not exists idx_team_activity_author_id on team_activity(author_id);
create index if not exists idx_team_activity_status on team_activity(status);
create index if not exists idx_team_activity_created_at on team_activity(created_at);

-- 9. team_activity_responses
create table if not exists team_activity_responses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references team_activity(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique(activity_id, user_id)
);

create index if not exists idx_team_activity_responses_activity_id on team_activity_responses(activity_id);
create index if not exists idx_team_activity_responses_user_id on team_activity_responses(user_id);

-- 10. team_activity_reactions
create table if not exists team_activity_reactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references team_activity(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(activity_id, user_id, emoji)
);

create index if not exists idx_team_activity_reactions_activity_id on team_activity_reactions(activity_id);

-- ============================================================
-- Helper Functions
-- ============================================================

create or replace function get_user_total_points(p_user_id uuid)
returns bigint as $$
  select coalesce(sum(points), 0)
  from points_ledger
  where user_id = p_user_id;
$$ language sql stable;

create or replace function get_user_total_points_for_period(p_user_id uuid, p_period text)
returns bigint as $$
  select coalesce(sum(points), 0)
  from points_ledger
  where user_id = p_user_id
    and (
      p_period = 'alltime'
      or (p_period = 'daily' and created_at >= date_trunc('day', now()))
      or (p_period = 'weekly' and created_at >= date_trunc('week', now()))
      or (p_period = 'monthly' and created_at >= date_trunc('month', now()))
    );
$$ language sql stable;

create or replace function get_user_standup_streak_days(p_user_id uuid)
returns integer as $$
declare
  streak integer := 0;
  check_date date := current_date;
  has_entry boolean;
begin
  loop
    select exists(
      select 1 from daily_entries
      where user_id = p_user_id
        and type = 'standup'
        and date_trunc('day', created_at) = check_date
    ) into has_entry;

    if not has_entry then
      exit;
    end if;

    streak := streak + 1;
    check_date := check_date - interval '1 day';
  end loop;

  return streak;
end;
$$ language plpgsql stable;

-- ============================================================
-- RLS Policies
-- ============================================================

alter table points_ledger enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table leaderboard_snapshots enable row level security;
alter table sandbox_runs enable row level security;
alter table sandbox_run_steps enable row level security;
alter table point_config enable row level security;
alter table team_activity enable row level security;
alter table team_activity_responses enable row level security;
alter table team_activity_reactions enable row level security;

-- points_ledger: users see own entries; admins see all
create policy "users_own_points" on points_ledger
  for select using (auth.uid() = user_id);

create policy "admin_all_points" on points_ledger
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "system_insert_points" on points_ledger
  for insert with check (true);

-- badges: all authenticated users can read
create policy "all_read_badges" on badges
  for select using (auth.role() = 'authenticated');

create policy "admin_manage_badges" on badges
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- user_badges: users see own; all see others for leaderboard display
create policy "all_read_user_badges" on user_badges
  for select using (auth.role() = 'authenticated');

create policy "system_insert_user_badges" on user_badges
  for insert with check (true);

-- leaderboard_snapshots: all authenticated users can read
create policy "all_read_leaderboard" on leaderboard_snapshots
  for select using (auth.role() = 'authenticated');

create policy "system_manage_leaderboard" on leaderboard_snapshots
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- sandbox_runs: users see own runs; admins see all
create policy "users_own_sandbox_runs" on sandbox_runs
  for select using (auth.uid() = user_id);

create policy "users_insert_sandbox_runs" on sandbox_runs
  for insert with check (auth.uid() = user_id);

create policy "admin_all_sandbox_runs" on sandbox_runs
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- sandbox_run_steps: follow parent sandbox_run access
create policy "sandbox_steps_via_run" on sandbox_run_steps
  for select using (
    exists (
      select 1 from sandbox_runs
      where id = sandbox_run_id and user_id = auth.uid()
    )
  );

create policy "system_insert_sandbox_steps" on sandbox_run_steps
  for insert with check (true);

-- point_config: all read; admin write
create policy "all_read_point_config" on point_config
  for select using (auth.role() = 'authenticated');

create policy "admin_manage_point_config" on point_config
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- team_activity: all authenticated can read active team-visibility items
create policy "all_read_team_activity" on team_activity
  for select using (
    auth.role() = 'authenticated'
    and (visibility = 'team' or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

create policy "users_create_team_activity" on team_activity
  for insert with check (auth.uid() = author_id);

create policy "author_update_team_activity" on team_activity
  for update using (auth.uid() = author_id);

create policy "admin_manage_team_activity" on team_activity
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- team_activity_responses
create policy "all_read_responses" on team_activity_responses
  for select using (auth.role() = 'authenticated');

create policy "users_insert_responses" on team_activity_responses
  for insert with check (auth.uid() = user_id);

-- team_activity_reactions
create policy "all_read_reactions" on team_activity_reactions
  for select using (auth.role() = 'authenticated');

create policy "users_manage_own_reactions" on team_activity_reactions
  for all using (auth.uid() = user_id);

-- ============================================================
-- Default Badge Seeds
-- ============================================================

insert into badges (slug, name, description, icon_id, color, criteria, tier) values
  ('first-task', 'First Step', 'Complete your first task', 'check-circle', 'green',
   '{"type": "task_count", "count": 1, "period": "alltime"}', 'bronze'),
  ('task-master', 'Task Master', 'Complete 50 tasks all time', 'zap', 'blue',
   '{"type": "task_count", "count": 50, "period": "alltime"}', 'gold'),
  ('standup-30-streak', 'Standup Champion', 'Submit standups for 30 consecutive days', 'award', 'amber',
   '{"type": "standup_streak", "days": 30}', 'gold'),
  ('standup-7-streak', 'Consistent', 'Submit standups for 7 consecutive days', 'calendar-check', 'purple',
   '{"type": "standup_streak", "days": 7}', 'silver'),
  ('speed-demon', 'Speed Demon', 'Complete 20 approvals within 1 hour', 'timer', 'orange',
   '{"type": "approval_count_fast", "count": 20, "period": "alltime"}', 'silver'),
  ('incident-responder', 'Rapid Responder', 'Resolve a high-severity incident in under 1 hour', 'alert-octagon', 'red',
   '{"type": "incident_response_fast", "count": 1}', 'platinum'),
  ('first-workflow', 'Architect', 'Create and activate your first workflow', 'git-branch', 'teal',
   '{"type": "workflow_created", "count": 1}', 'bronze'),
  ('point-century', 'Century Club', 'Earn 100 points total', 'star', 'yellow',
   '{"type": "cumulative_points", "threshold": 100, "period": "alltime"}', 'bronze'),
  ('point-millionaire', 'Point Millionaire', 'Earn 1000 points total', 'trophy', 'gold',
   '{"type": "cumulative_points", "threshold": 1000, "period": "alltime"}', 'platinum')
on conflict (slug) do nothing;
