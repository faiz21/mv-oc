-- Migration 20260326000001: Identity & Access
-- Tables: profiles, teams, team_members
-- Trigger: auto-create profile on auth.users insert

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text,
  role           text not null default 'member'
                 check (role in ('director', 'officer', 'member', 'admin')),
  status         text not null default 'active'
                 check (status in ('invited', 'active', 'disabled')),
  timezone       text not null default 'UTC',
  gamification_enabled boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  disabled_at    timestamptz
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_admin_select"
  on profiles for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_admin_update"
  on profiles for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─────────────────────────────────────────────
-- teams
-- ─────────────────────────────────────────────
create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  status     text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table teams enable row level security;

create policy "teams_select_authenticated"
  on teams for select
  using (auth.uid() is not null);

create policy "teams_admin_all"
  on teams for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- team_members
-- ─────────────────────────────────────────────
create table if not exists team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  membership_role text not null default 'member',
  created_at      timestamptz not null default now(),
  unique(team_id, user_id)
);

alter table team_members enable row level security;

create policy "team_members_select_authenticated"
  on team_members for select
  using (auth.uid() is not null);

create policy "team_members_admin_all"
  on team_members for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
