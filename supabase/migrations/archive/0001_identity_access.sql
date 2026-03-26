-- Migration 0001: Identity & Access — teams, team_members

create table teams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  membership_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(team_id, user_id)
);

create index team_members_team_id_idx on team_members(team_id);
create index team_members_user_id_idx on team_members(user_id);

-- RLS
alter table teams enable row level security;
alter table team_members enable row level security;

create policy "Authenticated users can read teams"
  on teams for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read team_members"
  on team_members for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage teams"
  on teams for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can manage team_members"
  on team_members for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seed: default team (update slug/name before applying)
insert into teams (slug, name) values ('machine-vision', 'Machine Vision Global')
on conflict (slug) do nothing;
