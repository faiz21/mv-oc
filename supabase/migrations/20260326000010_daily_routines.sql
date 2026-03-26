-- Migration 20260326000010: Daily Routines
-- Tables: daily_entries, daily_entry_task_links, daily_routines_config, daily_routines_exclusions

-- ─────────────────────────────────────────────
-- daily_entries
-- ─────────────────────────────────────────────
create table if not exists daily_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  team_id       uuid references teams(id),
  department_id uuid references departments(id),
  date          date not null,
  type          text not null check (type in ('standup', 'check_in', 'gratitude')),
  content       jsonb not null,
  is_public     boolean not null default false,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, date, type)
);

alter table daily_entries enable row level security;

create policy "daily_entries_select_own"
  on daily_entries for select
  using (user_id = auth.uid());

create policy "daily_entries_insert_own"
  on daily_entries for insert
  with check (user_id = auth.uid());

create policy "daily_entries_update_own"
  on daily_entries for update
  using (user_id = auth.uid());

create policy "daily_entries_director_select_dept"
  on daily_entries for select
  using (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "daily_entries_admin_all"
  on daily_entries for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- daily_entry_task_links
-- ─────────────────────────────────────────────
create table if not exists daily_entry_task_links (
  id             uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references daily_entries(id) on delete cascade,
  task_id        uuid not null references tasks(id) on delete cascade,
  signal         text check (signal in ('green', 'yellow', 'red')),
  comment        text
);

alter table daily_entry_task_links enable row level security;

create policy "daily_entry_task_links_select_own"
  on daily_entry_task_links for select
  using (
    daily_entry_id in (
      select id from daily_entries where user_id = auth.uid()
    )
  );

create policy "daily_entry_task_links_insert_own"
  on daily_entry_task_links for insert
  with check (
    daily_entry_id in (
      select id from daily_entries where user_id = auth.uid()
    )
  );

create policy "daily_entry_task_links_admin_all"
  on daily_entry_task_links for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- daily_routines_config
-- ─────────────────────────────────────────────
create table if not exists daily_routines_config (
  id                     uuid primary key default gen_random_uuid(),
  team_id                uuid references teams(id),
  standup_start_hour     int not null default 8,
  standup_end_hour       int not null default 18,
  check_in_start_hour    int not null default 8,
  check_in_end_hour      int not null default 18,
  digest_time_hour       int not null default 17,
  digest_time_minute     int not null default 0,
  digest_channel_discord text,
  digest_channel_teams   text,
  digest_enabled         boolean not null default true,
  reminders_enabled      boolean not null default false,
  reminder_time_hour     int,
  reminder_time_minute   int,
  timezone               text not null default 'UTC',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique(team_id)
);

alter table daily_routines_config enable row level security;

create policy "daily_routines_config_select_authenticated"
  on daily_routines_config for select
  using (auth.uid() is not null);

create policy "daily_routines_config_admin_all"
  on daily_routines_config for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- daily_routines_exclusions
-- ─────────────────────────────────────────────
create table if not exists daily_routines_exclusions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  standup_disabled    boolean not null default false,
  check_in_disabled   boolean not null default false,
  gratitude_disabled  boolean not null default false,
  quiet_period_start  date,
  quiet_period_end    date,
  reason              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(user_id)
);

alter table daily_routines_exclusions enable row level security;

create policy "daily_routines_exclusions_select_own"
  on daily_routines_exclusions for select
  using (user_id = auth.uid());

create policy "daily_routines_exclusions_insert_own"
  on daily_routines_exclusions for insert
  with check (user_id = auth.uid());

create policy "daily_routines_exclusions_update_own"
  on daily_routines_exclusions for update
  using (user_id = auth.uid());

create policy "daily_routines_exclusions_admin_all"
  on daily_routines_exclusions for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
