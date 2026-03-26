-- =============================================================================
-- MV-OC Seed Data
-- Covers: profiles, teams, team_members, departments, agents, agent_groups,
--         agent_group_members, agent_relationships, workflows, workflow_versions,
--         workflow_nodes, workflow_edges, workflow_triggers, workflow_runs,
--         workflow_run_steps, tasks, agent_definitions, skill_definitions,
--         agent_skill_links
-- =============================================================================

-- Note: profiles require real auth.users rows — use fixed UUIDs so the seeder
-- is idempotent. In local dev, insert into auth.users first (done below via
-- service-role bypass). In production, create users via Supabase Auth then
-- run the profile section only.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 0: auth.users (service-role only — skip in prod)
-- ─────────────────────────────────────────────────────────────────────────────
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, aud, role
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@machinevision.com',
    crypt('seed-password-admin', gen_salt('bf')),
    now(),
    '{"full_name": "Alexandra Chen"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'ops@machinevision.com',
    crypt('seed-password-ops', gen_salt('bf')),
    now(),
    '{"full_name": "Marcus Rivera"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'viewer@machinevision.com',
    crypt('seed-password-viewer', gen_salt('bf')),
    now(),
    '{"full_name": "Priya Sharma"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'operator2@machinevision.com',
    crypt('seed-password-op2', gen_salt('bf')),
    now(),
    '{"full_name": "James Okafor"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: profiles
-- ─────────────────────────────────────────────────────────────────────────────
insert into profiles (id, email, full_name, role, status, timezone)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@machinevision.com',   'Alexandra Chen',  'admin',    'active', 'Asia/Singapore'),
  ('00000000-0000-0000-0000-000000000002', 'ops@machinevision.com',     'Marcus Rivera',   'operator', 'active', 'Asia/Singapore'),
  ('00000000-0000-0000-0000-000000000003', 'viewer@machinevision.com',  'Priya Sharma',    'viewer',   'active', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-000000000004', 'operator2@machinevision.com','James Okafor',   'operator', 'active', 'Africa/Lagos')
on conflict (id) do update
  set full_name = excluded.full_name,
      role      = excluded.role,
      status    = excluded.status;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: teams & team_members
-- ─────────────────────────────────────────────────────────────────────────────
insert into teams (id, slug, name, status)
values
  ('10000000-0000-0000-0000-000000000001', 'machine-vision',    'Machine Vision Global',  'active'),
  ('10000000-0000-0000-0000-000000000002', 'engineering',       'Engineering Team',        'active'),
  ('10000000-0000-0000-0000-000000000003', 'operations',        'Operations Team',         'active')
on conflict (slug) do update
  set name   = excluded.name,
      status = excluded.status;

insert into team_members (team_id, user_id, membership_role)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'lead'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'member'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'member'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'lead')
on conflict (team_id, user_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: departments
-- ─────────────────────────────────────────────────────────────────────────────
insert into departments (id, name, slug, description, head_user_id, status)
values
  ('20000000-0000-0000-0000-000000000001', 'Engineering',  'engineering',  'Product engineering and platform', '00000000-0000-0000-0000-000000000002', 'active'),
  ('20000000-0000-0000-0000-000000000002', 'Operations',   'operations',   'Business operations and delivery',  '00000000-0000-0000-0000-000000000004', 'active'),
  ('20000000-0000-0000-0000-000000000003', 'Analytics',    'analytics',    'Data and business intelligence',    '00000000-0000-0000-0000-000000000001', 'active')
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      head_user_id = excluded.head_user_id;

-- Reporting lines: admin manages ops users
insert into profile_reporting_lines (manager_user_id, report_user_id)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
on conflict (manager_user_id, report_user_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: agents (runtime registry)
-- ─────────────────────────────────────────────────────────────────────────────
insert into agents (id, name, description, openclaw_endpoint, status, capabilities)
values
  (
    'agent-orchestrator',
    'Orchestrator',
    'Top-level workflow orchestrator that routes tasks to sub-agents',
    'https://agents.machinevision.internal/orchestrator',
    'active',
    '["workflow_routing", "task_delegation", "approval_gating"]'::jsonb
  ),
  (
    'agent-data-ingest',
    'Data Ingestor',
    'Handles ingestion and normalisation of external data feeds',
    'https://agents.machinevision.internal/data-ingest',
    'active',
    '["csv_parse", "api_fetch", "data_normalize", "schema_validate"]'::jsonb
  ),
  (
    'agent-report-gen',
    'Report Generator',
    'Generates structured reports from processed datasets',
    'https://agents.machinevision.internal/report-gen',
    'active',
    '["report_markdown", "report_pdf", "chart_data"]'::jsonb
  ),
  (
    'agent-approval-bot',
    'Approval Bot',
    'Sends approval requests and collects human sign-offs',
    'https://agents.machinevision.internal/approval-bot',
    'active',
    '["send_slack_approval", "send_email_approval", "record_decision"]'::jsonb
  ),
  (
    'agent-notifier',
    'Notifier',
    'Dispatches notifications via Slack, email, and webhooks',
    'https://agents.machinevision.internal/notifier',
    'active',
    '["slack_message", "email_send", "webhook_post"]'::jsonb
  )
on conflict (id) do update
  set name         = excluded.name,
      description  = excluded.description,
      status       = excluded.status,
      capabilities = excluded.capabilities;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: agent groups & memberships
-- ─────────────────────────────────────────────────────────────────────────────
insert into agent_groups (id, group_key, name, description, status)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'core-pipeline',
    'Core Pipeline Group',
    'Agents responsible for the primary data processing pipeline',
    'active'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'human-in-loop',
    'Human-in-the-Loop Group',
    'Agents that coordinate human approvals and notifications',
    'active'
  )
on conflict (group_key) do update
  set name        = excluded.name,
      description = excluded.description;

insert into agent_group_members (agent_group_id, agent_id, membership_role)
values
  ('30000000-0000-0000-0000-000000000001', 'agent-orchestrator', 'coordinator'),
  ('30000000-0000-0000-0000-000000000001', 'agent-data-ingest',  'member'),
  ('30000000-0000-0000-0000-000000000001', 'agent-report-gen',   'member'),
  ('30000000-0000-0000-0000-000000000002', 'agent-approval-bot', 'coordinator'),
  ('30000000-0000-0000-0000-000000000002', 'agent-notifier',     'member')
on conflict (agent_group_id, agent_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: agent relationships
-- ─────────────────────────────────────────────────────────────────────────────
insert into agent_relationships (parent_agent_id, child_agent_id, relationship_type, sort_order)
values
  ('agent-orchestrator', 'agent-data-ingest',  'coordinates', 1),
  ('agent-orchestrator', 'agent-report-gen',   'coordinates', 2),
  ('agent-orchestrator', 'agent-approval-bot', 'coordinates', 3),
  ('agent-orchestrator', 'agent-notifier',     'coordinates', 4)
on conflict (parent_agent_id, child_agent_id, relationship_type) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: workflows, versions, nodes, edges, triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Workflow 1: Daily Report Pipeline
do $$
declare
  v_wf_id    uuid := '40000000-0000-0000-0000-000000000001';
  v_ver_id   uuid := '41000000-0000-0000-0000-000000000001';
begin

  insert into workflows (id, key, name, description, status, primary_agent_id, requires_approval, created_by)
  values (
    v_wf_id,
    'daily-report-pipeline',
    'Daily Report Pipeline',
    'Ingests data feeds, generates a daily summary report, and notifies stakeholders',
    'active',
    'agent-orchestrator',
    false,
    '00000000-0000-0000-0000-000000000002'
  )
  on conflict (key) do update set
    name        = excluded.name,
    description = excluded.description,
    status      = excluded.status;

  insert into workflow_versions (id, workflow_id, version_number, status_snapshot, name_snapshot, primary_agent_id, requires_approval, change_summary, saved_by)
  values (
    v_ver_id,
    v_wf_id,
    1,
    'active',
    'Daily Report Pipeline',
    'agent-orchestrator',
    false,
    'Initial version',
    '00000000-0000-0000-0000-000000000002'
  )
  on conflict (workflow_id, version_number) do nothing;

  -- Nodes
  insert into workflow_nodes (workflow_version_id, node_key, node_type, label, position_x, position_y, config)
  values
    (v_ver_id, 'start',      'start',        'Start',           100,  100, '{}'::jsonb),
    (v_ver_id, 'ingest',     'agent_task',   'Ingest Data',     300,  100, '{"agent_id": "agent-data-ingest", "timeout_seconds": 120}'::jsonb),
    (v_ver_id, 'gen-report', 'agent_task',   'Generate Report', 500,  100, '{"agent_id": "agent-report-gen",  "timeout_seconds": 60}'::jsonb),
    (v_ver_id, 'notify',     'agent_task',   'Send Notify',     700,  100, '{"agent_id": "agent-notifier",    "channel": "slack"}'::jsonb),
    (v_ver_id, 'end',        'end',          'End',             900,  100, '{}'::jsonb)
  on conflict (workflow_version_id, node_key) do nothing;

  -- Edges
  insert into workflow_edges (workflow_version_id, edge_key, source_node_key, target_node_key, condition_type)
  values
    (v_ver_id, 'e1', 'start',      'ingest',     'always'),
    (v_ver_id, 'e2', 'ingest',     'gen-report', 'success'),
    (v_ver_id, 'e3', 'gen-report', 'notify',     'success'),
    (v_ver_id, 'e4', 'notify',     'end',        'always')
  on conflict (workflow_version_id, edge_key) do nothing;

  -- Trigger: runs at 7am SGT daily
  insert into workflow_triggers (workflow_version_id, trigger_key, trigger_type, config, active)
  values (
    v_ver_id,
    'cron-daily',
    'cron',
    '{"cron": "0 23 * * *", "timezone": "UTC", "label": "Daily at 7am SGT"}'::jsonb,
    true
  )
  on conflict (workflow_version_id, trigger_key) do nothing;

  -- Set active version
  update workflows set active_version_id = v_ver_id where id = v_wf_id;

end $$;


-- Workflow 2: Data Approval Flow
do $$
declare
  v_wf_id   uuid := '40000000-0000-0000-0000-000000000002';
  v_ver_id  uuid := '41000000-0000-0000-0000-000000000002';
begin

  insert into workflows (id, key, name, description, status, primary_agent_id, requires_approval, requires_approval_reason, created_by)
  values (
    v_wf_id,
    'data-approval-flow',
    'Data Approval Flow',
    'Runs data ingestion then gates on a human approval before publishing',
    'active',
    'agent-orchestrator',
    true,
    'Data publication requires compliance sign-off',
    '00000000-0000-0000-0000-000000000001'
  )
  on conflict (key) do update set
    name        = excluded.name,
    description = excluded.description;

  insert into workflow_versions (id, workflow_id, version_number, status_snapshot, name_snapshot, primary_agent_id, requires_approval, requires_approval_reason, change_summary, saved_by)
  values (
    v_ver_id,
    v_wf_id,
    1,
    'active',
    'Data Approval Flow',
    'agent-orchestrator',
    true,
    'Data publication requires compliance sign-off',
    'Initial version',
    '00000000-0000-0000-0000-000000000001'
  )
  on conflict (workflow_id, version_number) do nothing;

  insert into workflow_nodes (workflow_version_id, node_key, node_type, label, position_x, position_y, config)
  values
    (v_ver_id, 'start',    'start',          'Start',           100,  200, '{}'::jsonb),
    (v_ver_id, 'ingest',   'agent_task',     'Ingest Data',     300,  200, '{"agent_id": "agent-data-ingest"}'::jsonb),
    (v_ver_id, 'approval', 'approval_gate',  'Compliance Gate', 500,  200, '{"approver_role": "admin", "timeout_hours": 24}'::jsonb),
    (v_ver_id, 'publish',  'agent_task',     'Publish Data',    700,  200, '{"agent_id": "agent-notifier"}'::jsonb),
    (v_ver_id, 'end',      'end',            'End',             900,  200, '{}'::jsonb)
  on conflict (workflow_version_id, node_key) do nothing;

  insert into workflow_edges (workflow_version_id, edge_key, source_node_key, target_node_key, condition_type)
  values
    (v_ver_id, 'e1', 'start',    'ingest',   'always'),
    (v_ver_id, 'e2', 'ingest',   'approval', 'success'),
    (v_ver_id, 'e3', 'approval', 'publish',  'approval'),
    (v_ver_id, 'e4', 'publish',  'end',      'always')
  on conflict (workflow_version_id, edge_key) do nothing;

  insert into workflow_triggers (workflow_version_id, trigger_key, trigger_type, config, active)
  values (
    v_ver_id,
    'manual-trigger',
    'manual',
    '{"label": "Run manually from dashboard"}'::jsonb,
    true
  )
  on conflict (workflow_version_id, trigger_key) do nothing;

  update workflows set active_version_id = v_ver_id where id = v_wf_id;

end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: workflow runs & run steps (sample historical data)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_run_id   uuid := '50000000-0000-0000-0000-000000000001';
  v_step1_id uuid := '51000000-0000-0000-0000-000000000001';
  v_step2_id uuid := '51000000-0000-0000-0000-000000000002';
  v_step3_id uuid := '51000000-0000-0000-0000-000000000003';
  v_node1_id uuid;
  v_node2_id uuid;
  v_node3_id uuid;
begin
  -- Fetch node IDs for the daily report workflow v1
  select id into v_node1_id from workflow_nodes
    where workflow_version_id = '41000000-0000-0000-0000-000000000001' and node_key = 'ingest';
  select id into v_node2_id from workflow_nodes
    where workflow_version_id = '41000000-0000-0000-0000-000000000001' and node_key = 'gen-report';
  select id into v_node3_id from workflow_nodes
    where workflow_version_id = '41000000-0000-0000-0000-000000000001' and node_key = 'notify';

  insert into workflow_runs (id, workflow_id, workflow_version_id, trigger_type, status, initiated_by, started_at, completed_at)
  values (
    v_run_id,
    '40000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    'cron',
    'complete',
    '00000000-0000-0000-0000-000000000002',
    now() - interval '1 hour',
    now() - interval '10 minutes'
  )
  on conflict (id) do nothing;

  insert into workflow_run_steps (id, workflow_run_id, workflow_node_id, status, executor_type, executor_ref, started_at, completed_at, output_payload)
  values
    (v_step1_id, v_run_id, v_node1_id, 'complete', 'agent', 'agent-data-ingest',
     now() - interval '60 minutes', now() - interval '45 minutes',
     '{"records_ingested": 1420}'::jsonb),
    (v_step2_id, v_run_id, v_node2_id, 'complete', 'agent', 'agent-report-gen',
     now() - interval '44 minutes', now() - interval '30 minutes',
     '{"report_url": "https://reports.machinevision.internal/2026-03-26.pdf"}'::jsonb),
    (v_step3_id, v_run_id, v_node3_id, 'complete', 'agent', 'agent-notifier',
     now() - interval '29 minutes', now() - interval '25 minutes',
     '{"notified_users": 4}'::jsonb)
  on conflict (id) do nothing;

end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9: tasks
-- ─────────────────────────────────────────────────────────────────────────────
insert into tasks (id, workflow_id, type, status, title, source, assigned_to, agent_id, priority, context, payload)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'data_ingest',
    'complete',
    'Ingest daily feed — 2026-03-26',
    'cron',
    null,
    'agent-data-ingest',
    5,
    '{"feed": "sales_daily", "date": "2026-03-26"}'::jsonb,
    '{}'::jsonb
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    'approval_request',
    'awaiting_approval',
    'Approve data publish — compliance check',
    'workflow',
    '00000000-0000-0000-0000-000000000001',
    'agent-approval-bot',
    3,
    '{"dataset": "q1_financials", "initiated_by": "ops@machinevision.com"}'::jsonb,
    '{}'::jsonb
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    null,
    'manual_review',
    'pending',
    'Review anomaly in sensor batch #447',
    'manual',
    '00000000-0000-0000-0000-000000000002',
    null,
    7,
    '{"batch_id": "447", "anomaly_type": "out_of_range", "severity": "high"}'::jsonb,
    '{}'::jsonb
  )
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10: agent_definitions & skill_definitions (agent builder)
-- ─────────────────────────────────────────────────────────────────────────────

-- Skill definitions first (referenced by agent_skill_links)
insert into skill_definitions (id, skill_key, name, description, status, dispatch_mode, instruction_markdown, human_review_required, created_by)
values
  (
    '70000000-0000-0000-0000-000000000001',
    'skill-csv-ingest',
    'CSV Ingest',
    'Reads and validates a CSV file from a URL or local path',
    'published',
    'script_dispatch',
    '## CSV Ingest Skill\nFetch a CSV from `input.source_url`, validate headers against `input.schema`, and return rows as JSON array.',
    false,
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    'skill-markdown-report',
    'Markdown Report Generator',
    'Transforms structured JSON data into a formatted Markdown report',
    'published',
    'script_dispatch',
    '## Markdown Report Skill\nReceive `input.data` (JSON), apply `input.template` (Handlebars), return `output.markdown`.',
    false,
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    'skill-slack-notify',
    'Slack Notifier',
    'Posts a message to a Slack channel via webhook',
    'published',
    'script_dispatch',
    '## Slack Notify Skill\nPost `input.message` to `input.channel` using the configured Slack webhook.',
    false,
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    'skill-approval-request',
    'Approval Request',
    'Sends an approval request to a designated approver and waits for decision',
    'published',
    'model_invocation',
    '## Approval Request Skill\nDispatch approval to `input.approver_id` via `input.channel`. Resolve on decision.',
    true,
    '00000000-0000-0000-0000-000000000001'
  )
on conflict (skill_key) do update
  set name        = excluded.name,
      description = excluded.description,
      status      = excluded.status;


-- Agent definitions
insert into agent_definitions (id, agent_key, name, description, agent_type, status, role_summary, capabilities, allowed_tools, published_agent_id, created_by)
values
  (
    '80000000-0000-0000-0000-000000000001',
    'def-data-ingestor',
    'Data Ingestor Agent',
    'Blueprint for the runtime data ingest agent',
    'agent',
    'published',
    'Fetches, validates, and normalises external data feeds on a schedule or on-demand',
    '["csv_parse", "api_fetch", "data_normalize", "schema_validate"]'::jsonb,
    '["http_get", "csv_reader", "json_validator"]'::jsonb,
    'agent-data-ingest',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '80000000-0000-0000-0000-000000000002',
    'def-report-generator',
    'Report Generator Agent',
    'Blueprint for the runtime report generation agent',
    'agent',
    'published',
    'Transforms processed datasets into human-readable reports in Markdown and PDF',
    '["report_markdown", "report_pdf", "chart_data"]'::jsonb,
    '["markdown_renderer", "pdf_export", "chart_builder"]'::jsonb,
    'agent-report-gen',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '80000000-0000-0000-0000-000000000003',
    'def-approval-bot',
    'Approval Bot Agent',
    'Blueprint for the human-in-the-loop approval agent',
    'agent',
    'published',
    'Coordinates human approval gates within multi-step workflows',
    '["send_slack_approval", "send_email_approval", "record_decision"]'::jsonb,
    '["slack_api", "email_send", "audit_log"]'::jsonb,
    'agent-approval-bot',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '80000000-0000-0000-0000-000000000004',
    'def-notifier',
    'Notifier Agent',
    'Draft definition for an enhanced notifier with retry logic',
    'agent',
    'draft',
    'Dispatches notifications with retry and delivery confirmation',
    '["slack_message", "email_send", "webhook_post", "retry_logic"]'::jsonb,
    '["slack_api", "email_send", "webhook_post"]'::jsonb,
    null,
    '00000000-0000-0000-0000-000000000004'
  )
on conflict (agent_key) do update
  set name        = excluded.name,
      description = excluded.description,
      status      = excluded.status;


-- Agent ↔ Skill links
insert into agent_skill_links (agent_definition_id, skill_definition_id, link_type)
values
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'core'),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'core'),
  ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', 'core'),
  ('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', 'core'),
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', 'optional')
on conflict (agent_definition_id, skill_definition_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 11: human ownership links
-- ─────────────────────────────────────────────────────────────────────────────
insert into human_ownership_links (owner_user_id, owned_type, owned_ref, ownership_role)
values
  ('00000000-0000-0000-0000-000000000002', 'workflow', '40000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000001', 'workflow', '40000000-0000-0000-0000-000000000002', 'owner'),
  ('00000000-0000-0000-0000-000000000001', 'department', '20000000-0000-0000-0000-000000000003', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'agent', 'agent-data-ingest', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'agent', 'agent-report-gen',  'owner')
on conflict on constraint human_ownership_links_owner_user_id_owned_type_owned_ref_ow_key do nothing;
