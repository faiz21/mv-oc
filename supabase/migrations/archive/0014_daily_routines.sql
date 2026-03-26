-- Migration 0014: Daily Routines module

-- daily_entries: immutable user submissions for all three rituals
create table if not exists daily_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  type            text not null check (type in ('standup', 'check_in', 'gratitude')),
  content         jsonb not null,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint      daily_entries_unique_per_day unique(user_id, date, type)
);

create index if not exists idx_daily_entries_user_date on daily_entries(user_id, date);
create index if not exists idx_daily_entries_date_type on daily_entries(date, type);
create index if not exists idx_daily_entries_public on daily_entries(is_public, date desc) where is_public = true;

-- daily_routines_config: admin-configured timing and distribution settings
create table if not exists daily_routines_config (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 text not null default 'default',
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
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  unique(org_id)
);

-- daily_routines_exclusions: per-user opt-outs and quiet periods
create table if not exists daily_routines_exclusions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  standup_disabled   boolean default false,
  check_in_disabled  boolean default false,
  gratitude_disabled boolean default false,
  quiet_period_start date,
  quiet_period_end   date,
  reason             text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique(user_id)
);

-- RLS
alter table daily_entries enable row level security;
alter table daily_routines_config enable row level security;
alter table daily_routines_exclusions enable row level security;

-- daily_entries policies
create policy "daily_entries_select_own" on daily_entries
  for select using (auth.uid() = user_id);

create policy "daily_entries_select_officer" on daily_entries
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer'))
  );

create policy "daily_entries_insert_own" on daily_entries
  for insert with check (auth.uid() = user_id);

-- daily_routines_config policies (admin only)
create policy "daily_routines_config_admin" on daily_routines_config
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "daily_routines_config_read" on daily_routines_config
  for select using (true);

-- daily_routines_exclusions policies
create policy "daily_routines_exclusions_own" on daily_routines_exclusions
  for select using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "daily_routines_exclusions_insert" on daily_routines_exclusions
  for insert with check (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "daily_routines_exclusions_update" on daily_routines_exclusions
  for update using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
