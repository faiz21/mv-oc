-- Departments table
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head_user_id uuid references public.profiles(id) on delete set null,
  parent_department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profile reporting lines (human org chart)
create table if not exists public.profile_reporting_lines (
  id uuid primary key default gen_random_uuid(),
  manager_user_id uuid not null references public.profiles(id) on delete cascade,
  report_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(manager_user_id, report_user_id)
);

-- Agent relationships (agent hierarchy)
create table if not exists public.agent_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_agent_id uuid not null references public.agents(id) on delete cascade,
  child_agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(parent_agent_id, child_agent_id)
);

-- Human ownership links (who owns which agent/workflow)
create table if not exists public.human_ownership_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  owned_type text not null check (owned_type in ('agent','workflow')),
  owned_ref uuid not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.departments enable row level security;
alter table public.profile_reporting_lines enable row level security;
alter table public.agent_relationships enable row level security;
alter table public.human_ownership_links enable row level security;

-- Read-only for all authenticated users
create policy "departments_read" on public.departments for select using (auth.role() = 'authenticated');
create policy "profile_reporting_lines_read" on public.profile_reporting_lines for select using (auth.role() = 'authenticated');
create policy "agent_relationships_read" on public.agent_relationships for select using (auth.role() = 'authenticated');
create policy "human_ownership_links_read" on public.human_ownership_links for select using (auth.role() = 'authenticated');

-- Admin write
create policy "departments_admin_write" on public.departments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "agent_relationships_admin_write" on public.agent_relationships for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "human_ownership_links_admin_write" on public.human_ownership_links for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
