-- Migration 0013: Canonical role alignment

update profiles
set role = 'officer'
where role = 'operator';

update profiles
set role = 'member'
where role = 'viewer';

alter table profiles alter column role set default 'member';

alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check
  check (role in ('admin', 'director', 'officer', 'member'));

drop policy if exists "Operators and admins can write workflows" on workflows;
create policy "Officers directors and admins can write workflows"
  on workflows for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')
  ));

drop policy if exists "Operators and admins can write workflow versions" on workflow_versions;
create policy "Officers directors and admins can write workflow versions"
  on workflow_versions for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')
  ));

drop policy if exists "Operators and admins can write workflow nodes" on workflow_nodes;
create policy "Officers directors and admins can write workflow nodes"
  on workflow_nodes for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')
  ));

drop policy if exists "Operators and admins can write workflow edges" on workflow_edges;
create policy "Officers directors and admins can write workflow edges"
  on workflow_edges for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')
  ));

drop policy if exists "Operators and admins can write workflow triggers" on workflow_triggers;
create policy "Officers directors and admins can write workflow triggers"
  on workflow_triggers for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')
  ));

drop policy if exists "Officers can update lesson confidence" on agent_lessons_learned;
create policy "Officers directors and admins can update lesson confidence" on agent_lessons_learned for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'director', 'officer')));
