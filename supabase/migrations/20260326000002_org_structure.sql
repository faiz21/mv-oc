-- Migration 20260326000002: Org Structure, Departments, Projects
-- Tables: departments, department_members, profile_reporting_lines, human_ownership_links,
--         projects, board_columns
-- Note: department_members is created before departments policies (it's referenced in them)

-- ─────────────────────────────────────────────
-- departments (table only — policies added after department_members)
-- ─────────────────────────────────────────────
create table if not exists departments (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text unique not null,
  parent_department_id uuid references departments(id),
  description          text,
  created_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- department_members (must exist before departments policies)
-- ─────────────────────────────────────────────
create table if not exists department_members (
  id              uuid primary key default gen_random_uuid(),
  department_id   uuid not null references departments(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  department_role text not null default 'member'
                  check (department_role in ('director', 'officer', 'member')),
  created_at      timestamptz not null default now(),
  unique(department_id, user_id)
);

alter table department_members enable row level security;

create policy "department_members_select_own"
  on department_members for select
  using (user_id = auth.uid());

create policy "department_members_select_dept"
  on department_members for select
  using (
    department_id in (
      select department_id from department_members dm
      where dm.user_id = auth.uid()
    )
  );

create policy "department_members_admin_all"
  on department_members for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- departments RLS (now department_members exists)
-- ─────────────────────────────────────────────
alter table departments enable row level security;

create policy "departments_member_select"
  on departments for select
  using (
    id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "departments_admin_all"
  on departments for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- profile_reporting_lines
-- ─────────────────────────────────────────────
create table if not exists profile_reporting_lines (
  id              uuid primary key default gen_random_uuid(),
  manager_user_id uuid not null references profiles(id) on delete cascade,
  report_user_id  uuid not null references profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(manager_user_id, report_user_id),
  check (manager_user_id <> report_user_id)
);

alter table profile_reporting_lines enable row level security;

create policy "reporting_lines_select_authenticated"
  on profile_reporting_lines for select
  using (auth.uid() is not null);

create policy "reporting_lines_admin_all"
  on profile_reporting_lines for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- human_ownership_links
-- ─────────────────────────────────────────────
create table if not exists human_ownership_links (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  target_type    text not null
                 check (target_type in ('agent', 'workflow', 'department', 'project')),
  target_ref     text not null,
  ownership_type text not null
                 check (ownership_type in ('owner', 'reviewer', 'sponsor')),
  created_at     timestamptz not null default now(),
  unique(user_id, target_type, target_ref, ownership_type)
);

alter table human_ownership_links enable row level security;

create policy "ownership_links_select_own"
  on human_ownership_links for select
  using (user_id = auth.uid());

create policy "ownership_links_admin_all"
  on human_ownership_links for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id),
  name          text not null,
  slug          text not null,
  description   text,
  status        text not null default 'active'
                check (status in ('active', 'on_hold', 'complete', 'archived')),
  owner_id      uuid references profiles(id),
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz,
  archived_at   timestamptz,
  unique(department_id, slug)
);

alter table projects enable row level security;

create policy "projects_member_select"
  on projects for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "projects_director_insert"
  on projects for insert
  with check (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "projects_director_update"
  on projects for update
  using (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "projects_admin_all"
  on projects for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- board_columns
-- ─────────────────────────────────────────────
create table if not exists board_columns (
  id                       uuid primary key default gen_random_uuid(),
  department_id            uuid not null references departments(id) on delete cascade,
  name                     text not null,
  slug                     text not null,
  sort_order               int not null default 0,
  color                    text,
  is_done_state            boolean not null default false,
  allowed_roles            text[] not null default '{"director","officer","member","admin"}',
  auto_advance_on_approval boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique(department_id, slug)
);

alter table board_columns enable row level security;

create policy "board_columns_member_select"
  on board_columns for select
  using (
    department_id in (
      select department_id from department_members where user_id = auth.uid()
    )
  );

create policy "board_columns_director_insert"
  on board_columns for insert
  with check (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "board_columns_director_update"
  on board_columns for update
  using (
    department_id in (
      select department_id from department_members
      where user_id = auth.uid() and department_role = 'director'
    )
  );

create policy "board_columns_admin_all"
  on board_columns for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
