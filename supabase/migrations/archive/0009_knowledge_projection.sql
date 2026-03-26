-- Migration 0009: Knowledge & Projection — memory_documents, memory_facts, context_packets

create table memory_documents (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (
    scope in (
      'global', 'team', 'department', 'project', 'workflow_run',
      'artifact', 'agent', 'wiki_article', 'survey', 'changelog'
    )
  ),
  scope_ref text not null,
  doc_type text not null,
  title text not null,
  markdown_content text not null,
  source_kind text not null check (source_kind in ('system', 'human', 'agent', 'projection')),
  source_ref text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memory_facts (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  scope_ref text not null,
  fact_key text not null,
  fact_value jsonb not null,
  fact_type text not null,
  approved boolean not null default false,
  source_kind text not null,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope, scope_ref, fact_key)
);

create table context_packets (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references workflow_runs(id),
  workflow_run_step_id uuid references workflow_run_steps(id),
  task_id uuid references tasks(id),
  agent_id text references agents(id),
  packet_type text not null check (packet_type in ('production', 'sandbox')),
  context_bundle jsonb not null,
  created_at timestamptz not null default now()
);

create index memory_documents_scope_idx on memory_documents(scope, scope_ref);
create index memory_documents_doc_type_idx on memory_documents(doc_type);
create index memory_facts_scope_idx on memory_facts(scope, scope_ref);
create index context_packets_workflow_run_id_idx on context_packets(workflow_run_id);

-- RLS
alter table memory_documents enable row level security;
alter table memory_facts enable row level security;
alter table context_packets enable row level security;

create policy "Authenticated users can read memory documents" on memory_documents for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read memory facts" on memory_facts for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read context packets" on context_packets for select using (auth.role() = 'authenticated');
create policy "Admins can write memory facts" on memory_facts for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
