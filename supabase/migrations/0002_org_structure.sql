-- Migration 0002: Org Structure — departments, reporting lines, ownership links

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  parent_department_id uuid references departments(id),
  head_user_id uuid references profiles(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Manager → direct reports (1 manager : many reports)
create table profile_reporting_lines (
  id uuid primary key default gen_random_uuid(),
  manager_user_id uuid not null references profiles(id) on delete cascade,
  report_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(manager_user_id, report_user_id),
  check (manager_user_id <> report_user_id)
);

-- Human ownership of workflows / automations / agents
create table human_ownership_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  owned_type text not null check (
    owned_type in ('workflow', 'agent', 'automation_job', 'department')
  ),
  owned_ref text not null,
  ownership_role text not null default 'owner' check (
    ownership_role in ('owner', 'delegate', 'reviewer')
  ),
  created_at timestamptz not null default now(),
  unique(owner_user_id, owned_type, owned_ref, ownership_role)
);

create index departments_parent_id_idx on departments(parent_department_id);
create index profile_reporting_lines_manager_idx on profile_reporting_lines(manager_user_id);
create index profile_reporting_lines_report_idx on profile_reporting_lines(report_user_id);
create index human_ownership_links_owner_idx on human_ownership_links(owner_user_id);
create index human_ownership_links_owned_idx on human_ownership_links(owned_type, owned_ref);

-- RLS
alter table departments enable row level security;
alter table profile_reporting_lines enable row level security;
alter table human_ownership_links enable row level security;

create policy "Authenticated users can read departments"
  on departments for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read reporting lines"
  on profile_reporting_lines for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read ownership links"
  on human_ownership_links for select using (auth.role() = 'authenticated');

create policy "Admins can manage departments"
  on departments for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can manage reporting lines"
  on profile_reporting_lines for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can manage ownership links"
  on human_ownership_links for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
