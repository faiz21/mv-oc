-- Migration 20260326000013: Mission Control
-- Tables: mission_control_views, priority_rules, mission_snapshots

-- ─────────────────────────────────────────────
-- mission_control_views
-- ─────────────────────────────────────────────
create table if not exists mission_control_views (
  id         uuid primary key default gen_random_uuid(),
  view_key   text unique not null,
  name       text not null,
  scope_type text not null
             check (scope_type in ('global', 'department', 'team', 'user', 'project')),
  scope_ref  text,
  config     jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table mission_control_views enable row level security;

create policy "mission_control_views_select"
  on mission_control_views for select
  using (
    scope_type = 'global'
    or created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('director', 'admin'))
  );

create policy "mission_control_views_insert_own"
  on mission_control_views for insert
  with check (created_by = auth.uid());

create policy "mission_control_views_update_own"
  on mission_control_views for update
  using (created_by = auth.uid());

create policy "mission_control_views_admin_all"
  on mission_control_views for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- priority_rules
-- ─────────────────────────────────────────────
create table if not exists priority_rules (
  id         uuid primary key default gen_random_uuid(),
  rule_key   text unique not null,
  name       text not null,
  status     text not null default 'active' check (status in ('active', 'inactive')),
  weight     int not null default 1,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table priority_rules enable row level security;

create policy "priority_rules_select_authenticated"
  on priority_rules for select
  using (auth.uid() is not null);

create policy "priority_rules_admin_all"
  on priority_rules for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- mission_snapshots
-- ─────────────────────────────────────────────
create table if not exists mission_snapshots (
  id            uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  summary       jsonb not null,
  created_at    timestamptz not null default now()
);

alter table mission_snapshots enable row level security;

create policy "mission_snapshots_select_authenticated"
  on mission_snapshots for select
  using (auth.uid() is not null);

-- Service role inserts only — no user-facing insert policy
create policy "mission_snapshots_admin_all"
  on mission_snapshots for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
