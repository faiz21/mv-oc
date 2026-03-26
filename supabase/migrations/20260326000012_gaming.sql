-- Migration 20260326000012: Gaming Session / Sandbox
-- Tables: points_log, badges, badges_earned, sandbox_runs, sandbox_artifacts,
--         team_activity, team_activity_responses, team_activity_reactions

-- ─────────────────────────────────────────────
-- points_log
-- ─────────────────────────────────────────────
create table if not exists points_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  action_type text not null,
  points      int not null check (points >= 0),
  ref_id      uuid,
  ref_type    text,
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  created_by  text not null default 'system'
);

alter table points_log enable row level security;

create policy "points_log_select_own"
  on points_log for select
  using (user_id = auth.uid());

create policy "points_log_admin_all"
  on points_log for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- badges
-- ─────────────────────────────────────────────
create table if not exists badges (
  id               text primary key,
  name             text not null,
  description      text not null,
  icon_url         text,
  unlock_condition text not null,
  rarity           text not null default 'common'
                   check (rarity in ('common', 'rare', 'legendary')),
  created_at       timestamptz not null default now()
);

alter table badges enable row level security;

create policy "badges_select_authenticated"
  on badges for select
  using (auth.uid() is not null);

create policy "badges_admin_all"
  on badges for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- badges_earned
-- ─────────────────────────────────────────────
create table if not exists badges_earned (
  id         uuid primary key default gen_random_uuid(),
  badge_id   text not null references badges(id),
  user_id    uuid not null references profiles(id),
  awarded_at timestamptz not null default now(),
  is_active  boolean not null default true,
  unique(user_id, badge_id)
);

alter table badges_earned enable row level security;

create policy "badges_earned_select_authenticated"
  on badges_earned for select
  using (auth.uid() is not null);

create policy "badges_earned_admin_all"
  on badges_earned for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- sandbox_runs
-- ─────────────────────────────────────────────
create table if not exists sandbox_runs (
  id                   uuid primary key default gen_random_uuid(),
  workflow_id          uuid not null references workflows(id),
  workflow_version_id  uuid references workflow_versions(id),
  user_id              uuid not null references profiles(id),
  status               text not null default 'pending'
                       check (status in ('pending', 'running', 'complete', 'failed', 'cancelled')),
  mock_payload         jsonb not null,
  predicted_progression jsonb,
  result               jsonb,
  execution_time_ms    int,
  error                text,
  expires_at           timestamptz not null default now() + interval '24 hours',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz
);

alter table sandbox_runs enable row level security;

create policy "sandbox_runs_select_own"
  on sandbox_runs for select
  using (user_id = auth.uid());

create policy "sandbox_runs_insert_own"
  on sandbox_runs for insert
  with check (user_id = auth.uid());

create policy "sandbox_runs_admin_all"
  on sandbox_runs for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- sandbox_artifacts
-- ─────────────────────────────────────────────
create table if not exists sandbox_artifacts (
  id             uuid primary key default gen_random_uuid(),
  sandbox_run_id uuid not null references sandbox_runs(id) on delete cascade,
  artifact_type  text not null,
  content        jsonb,
  file_path      text,
  storage_key    text,
  created_at     timestamptz not null default now()
);

alter table sandbox_artifacts enable row level security;

create policy "sandbox_artifacts_select_own"
  on sandbox_artifacts for select
  using (
    sandbox_run_id in (
      select id from sandbox_runs where user_id = auth.uid()
    )
  );

create policy "sandbox_artifacts_admin_all"
  on sandbox_artifacts for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- team_activity
-- ─────────────────────────────────────────────
create table if not exists team_activity (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('poll', 'shoutout', 'event', 'game_session')),
  author_id      uuid not null references profiles(id),
  content        jsonb not null,
  status         text not null default 'active'
                 check (status in ('active', 'closed', 'deleted')),
  reaction_count jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  deleted_by     uuid references profiles(id)
);

alter table team_activity enable row level security;

create policy "team_activity_select_authenticated"
  on team_activity for select
  using (auth.uid() is not null);

create policy "team_activity_insert_authenticated"
  on team_activity for insert
  with check (auth.uid() is not null);

create policy "team_activity_update_own"
  on team_activity for update
  using (author_id = auth.uid());

create policy "team_activity_admin_all"
  on team_activity for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- team_activity_responses
-- ─────────────────────────────────────────────
create table if not exists team_activity_responses (
  id               uuid primary key default gen_random_uuid(),
  team_activity_id uuid not null references team_activity(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  response         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(team_activity_id, user_id)
);

alter table team_activity_responses enable row level security;

create policy "team_activity_responses_select_authenticated"
  on team_activity_responses for select
  using (auth.uid() is not null);

create policy "team_activity_responses_insert_own"
  on team_activity_responses for insert
  with check (user_id = auth.uid());

create policy "team_activity_responses_update_own"
  on team_activity_responses for update
  using (user_id = auth.uid());

create policy "team_activity_responses_admin_all"
  on team_activity_responses for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- team_activity_reactions
-- ─────────────────────────────────────────────
create table if not exists team_activity_reactions (
  id               uuid primary key default gen_random_uuid(),
  team_activity_id uuid not null references team_activity(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  emoji            text not null,
  created_at       timestamptz not null default now(),
  unique(team_activity_id, user_id, emoji)
);

alter table team_activity_reactions enable row level security;

create policy "team_activity_reactions_select_authenticated"
  on team_activity_reactions for select
  using (auth.uid() is not null);

create policy "team_activity_reactions_insert_own"
  on team_activity_reactions for insert
  with check (user_id = auth.uid());

create policy "team_activity_reactions_delete_own"
  on team_activity_reactions for delete
  using (user_id = auth.uid());

create policy "team_activity_reactions_admin_all"
  on team_activity_reactions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
