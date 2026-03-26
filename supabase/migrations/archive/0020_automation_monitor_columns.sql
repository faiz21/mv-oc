-- Add missing columns to workflow_runs
alter table public.workflow_runs
  add column if not exists sla_due_at timestamptz,
  add column if not exists current_step_run_id uuid;

-- Add missing columns to workflow_run_steps
alter table public.workflow_run_steps
  add column if not exists sla_due_at timestamptz,
  add column if not exists model_used text,
  add column if not exists token_count int,
  add column if not exists eval_status text check (eval_status in ('pass','fail','skipped', null)),
  add column if not exists retry_count int not null default 0,
  add column if not exists output_payload jsonb,
  add column if not exists context_bundle jsonb;

-- Agent daily summaries (if not already created by agent-builder migration)
create table if not exists public.agent_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  date date not null default current_date,
  step_count int not null default 0,
  error_count int not null default 0,
  summary text,
  key_patterns jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(agent_id, date)
);

-- Agent lessons learned (if not already created)
create table if not exists public.agent_lessons_learned (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  lesson text not null,
  confidence int not null default 3 check (confidence between 1 and 5),
  applies_to text,
  is_incorrect boolean not null default false,
  is_promoted boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS on new tables
alter table public.agent_daily_summaries enable row level security;
alter table public.agent_lessons_learned enable row level security;

-- Policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'agent_daily_summaries' and policyname = 'agent_daily_summaries_read') then
    create policy "agent_daily_summaries_read" on public.agent_daily_summaries for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'agent_lessons_learned' and policyname = 'agent_lessons_learned_read') then
    create policy "agent_lessons_learned_read" on public.agent_lessons_learned for select using (auth.role() = 'authenticated');
  end if;
end $$;
