-- ============================================================
-- Seed: agent_definitions
-- Source: agency-agents (github.com/msitarzewski/agency-agents)
-- Filtered: tech-stack aligned agents for MV Operation Hub
-- Stack: React/Next.js · Node.js · Supabase/PostgreSQL · Redis
--        Kafka · InfluxDB · Node-RED · Figma · Jira · GitHub
--        CODA.io · Miro · OpenClaw · Claude · GPT · Canva
-- Generated: 2026-03-26
-- Total: 35 rows (6 division parents + 29 specialist sub-agents)
-- Table: agent_definitions
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: DIVISION PARENT AGENTS (agent_type = 'agent')
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 1. Engineering Division
(
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'engineering-division',
  'Engineering Division',
  'Top-level engineering division overseeing all software development, infrastructure, architecture, and technical operations for MV Operation Hub.',
  'agent',
  NULL,
  'published',
  'Coordinates all engineering sub-agents across frontend, backend, data, DevOps, security, and AI engineering. Acts as the engineering governance layer and escalation point for technical decisions.',
  '["team-coordination", "technical-governance", "architecture-review", "resource-allocation", "escalation-handling"]'::jsonb,
  '["agent_dispatch", "audit_log", "workflow_runner"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 500, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
),

-- 2. Design Division
(
  'c5c47afb-593e-4166-9f5e-09fd39ce069e',
  'design-division',
  'Design Division',
  'Top-level design division overseeing UI/UX design, brand, visual storytelling, and accessibility for MV Operation Hub.',
  'agent',
  NULL,
  'published',
  'Coordinates all design sub-agents across UI, UX architecture, research, and visual prompt engineering. Ensures design consistency and brand alignment across Figma, Canva, and frontend deliverables.',
  '["design-governance", "figma-coordination", "brand-alignment", "accessibility-standards", "design-system-ownership"]'::jsonb,
  '["agent_dispatch", "figma_access", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
),

-- 3. Testing Division
(
  '8df70372-3d8d-49e1-985f-919dda031fed',
  'testing-division',
  'Testing Division',
  'Top-level testing division overseeing API testing, performance benchmarking, and accessibility auditing for MV Operation Hub.',
  'agent',
  NULL,
  'published',
  'Coordinates all QA and testing sub-agents. Owns test coverage standards, API contract validation, performance baselines, and accessibility compliance across the stack.',
  '["qa-governance", "test-strategy", "coverage-standards", "performance-baselines", "accessibility-compliance"]'::jsonb,
  '["agent_dispatch", "audit_log", "test_runner"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
),

-- 4. Project Management Division
(
  '2695a7c2-9a22-4f8c-900f-ff6f840b53fa',
  'project-management-division',
  'Project Management Division',
  'Top-level project management division overseeing sprint coordination, Jira workflow governance, and cross-team delivery for MV Operation Hub.',
  'agent',
  NULL,
  'published',
  'Coordinates project management sub-agents across Jira, sprint planning, and studio operations. Ensures delivery cadence, stakeholder communication, and cross-tool coordination via CODA.io, Miro, and Slack.',
  '["sprint-governance", "jira-oversight", "delivery-coordination", "stakeholder-reporting", "risk-management"]'::jsonb,
  '["agent_dispatch", "jira_access", "slack_access", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
),

-- 5. Product Division
(
  '2d4e1cae-bef0-420e-a97d-56edfcefb54e',
  'product-division',
  'Product Division',
  'Top-level product division overseeing sprint prioritization, feedback synthesis, and product discovery for MV Operation Hub.',
  'agent',
  NULL,
  'published',
  'Coordinates product sub-agents for backlog prioritization and feedback synthesis. Bridges user insights from Fireflies, Slack, and research into actionable product decisions.',
  '["product-governance", "backlog-strategy", "feedback-routing", "discovery-coordination", "roadmap-alignment"]'::jsonb,
  '["agent_dispatch", "audit_log", "fireflies_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
),

-- 6. Specialized Division
(
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'specialized-division',
  'Specialized Division',
  'Top-level specialized division overseeing MCP building, workflow architecture, agent orchestration, document generation, and data consolidation.',
  'agent',
  NULL,
  'published',
  'Coordinates specialist sub-agents for OpenClaw/MCP integration, multi-agent orchestration, Node-RED/Kafka workflow design, and CODA.io document generation. Acts as the integration and automation governance layer.',
  '["mcp-governance", "orchestration-strategy", "workflow-architecture", "integration-oversight", "automation-governance"]'::jsonb,
  '["agent_dispatch", "mcp_registry", "openclaw_access", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 500, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(),
  now(),
  now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 2: ENGINEERING SUB-AGENTS (12 agents)
-- Parent: engineering-division (7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 7. Frontend Developer
(
  '492c7239-cb4f-4111-bd0e-cc57c71879bf',
  'eng-frontend-developer',
  'Frontend Developer',
  'Expert frontend developer specializing in React, Next.js, and TypeScript. Builds responsive, accessible, and performant web applications with pixel-perfect design implementation.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Builds modern React/Next.js components with TypeScript, enforces Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1), implements WCAG 2.1 AA accessibility, and integrates Supabase APIs from the frontend layer.',
  '["react", "nextjs", "typescript", "tailwindcss", "responsive-design", "wcag-2.1-aa", "core-web-vitals", "state-management", "supabase-client", "figma-to-code"]'::jsonb,
  '["code_writer", "web_search", "file_reader", "browser_preview", "figma_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 8. Backend Architect
(
  '83c46732-323c-4652-9570-d767327ab655',
  'eng-backend-architect',
  'Backend Architect',
  'Expert Node.js backend architect specializing in REST and GraphQL API design, Supabase Edge Functions, and scalable service architecture.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Designs and implements Node.js backends, REST/GraphQL APIs, and Supabase Edge Functions. Defines service boundaries, API contracts, authentication patterns, and ensures backend reliability and maintainability.',
  '["nodejs", "rest-api", "graphql", "supabase-edge-functions", "api-design", "authentication", "rate-limiting", "error-handling", "openapi-spec"]'::jsonb,
  '["code_writer", "web_search", "file_reader", "supabase_access", "api_tester"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 9. Database Optimizer
(
  '8e9abe0a-dc78-4f4d-9bb8-e57cc1daef63',
  'eng-database-optimizer',
  'Database Optimizer',
  'Database specialist focused on PostgreSQL (Supabase), Redis caching, and InfluxDB time-series optimization. Designs schemas, writes performant queries, and tunes indexes.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Owns database health across PostgreSQL/Supabase, Redis, and InfluxDB. Writes and reviews migrations, designs indexes, audits slow queries, configures RLS policies, and defines caching strategies for API performance.',
  '["postgresql", "supabase-rls", "redis-caching", "influxdb", "query-optimization", "index-design", "schema-design", "migration-authoring", "connection-pooling"]'::jsonb,
  '["code_writer", "supabase_access", "database_query", "file_reader"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 10. Data Engineer
(
  'e504e33e-fc58-451f-8ee3-fa5a724c2d6f',
  'eng-data-engineer',
  'Data Engineer',
  'Data pipeline specialist working with Kafka, Redis, InfluxDB, and Supabase. Designs, builds, and monitors real-time and batch data flows across the MV stack.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Builds and maintains data pipelines using Kafka (event streaming), Redis (caching/pub-sub), InfluxDB (time-series metrics), and Supabase (relational persistence). Designs data contracts, monitors pipeline health, and ensures data quality across the stack.',
  '["kafka", "redis", "influxdb", "supabase", "event-streaming", "data-pipelines", "data-contracts", "pipeline-monitoring", "batch-processing", "real-time-ingestion"]'::jsonb,
  '["code_writer", "database_query", "supabase_access", "file_reader", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 11. DevOps Automator
(
  'df6dda9d-1148-488c-86ba-3ed8ee8d37c9',
  'eng-devops-automator',
  'DevOps Automator',
  'DevOps specialist automating CI/CD pipelines, deployment workflows, and infrastructure management for the MV stack on GitHub Actions.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Designs and maintains GitHub Actions pipelines, deployment automation, environment configuration, secrets management, and infrastructure-as-code. Ensures safe, repeatable deployments for Next.js frontend and Supabase Edge Functions.',
  '["github-actions", "ci-cd", "deployment-automation", "docker", "environment-management", "secrets-management", "infrastructure-as-code", "rollback-strategy", "monitoring-setup"]'::jsonb,
  '["code_writer", "github_access", "file_reader", "web_search", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 12. Git Workflow Master
(
  '0e231ac8-ed89-4c08-b486-a1f586d9a90d',
  'eng-git-workflow-master',
  'Git Workflow Master',
  'Git and GitHub workflow specialist managing branching strategies, PR conventions, code review standards, and release tagging for the MV engineering team.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Defines and enforces Git branching strategy (trunk-based or Gitflow), PR review conventions, commit message standards, merge policies, and release tagging. Coaches team on clean version control practices.',
  '["git", "github", "branching-strategy", "pr-conventions", "commit-standards", "merge-policies", "release-tagging", "code-review-workflow", "conflict-resolution"]'::jsonb,
  '["code_writer", "github_access", "file_reader", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 13. Code Reviewer
(
  '2d529518-9ca7-4f4a-8296-0a0ee15d73cc',
  'eng-code-reviewer',
  'Code Reviewer',
  'Full-stack code reviewer ensuring quality, correctness, and maintainability across React, Node.js, and Supabase codebases. Provides structured, actionable feedback.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Reviews pull requests and code diffs across the full stack. Checks for correctness, security vulnerabilities, performance anti-patterns, test coverage gaps, and adherence to MV engineering conventions. Provides clear, constructive feedback.',
  '["code-review", "static-analysis", "security-review", "performance-review", "test-coverage", "react", "nodejs", "typescript", "supabase", "convention-enforcement"]'::jsonb,
  '["code_writer", "file_reader", "github_access", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 14. Senior Developer
(
  'f8ad09f1-ce08-4639-9c06-0859d0c5efcb',
  'eng-senior-developer',
  'Senior Developer',
  'Experienced full-stack developer providing technical leadership, complex feature implementation, and mentorship across React, Node.js, and Supabase.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Leads complex feature development spanning frontend (React/Next.js), backend (Node.js/Supabase), and integrations. Provides technical mentorship, resolves ambiguous engineering problems, and ensures implementation quality across the stack.',
  '["react", "nextjs", "nodejs", "supabase", "typescript", "full-stack-development", "technical-leadership", "mentorship", "complex-feature-delivery", "architecture-implementation"]'::jsonb,
  '["code_writer", "file_reader", "github_access", "supabase_access", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 15. Software Architect
(
  '026a0b10-f116-434f-abb2-efdfd3bd0390',
  'eng-software-architect',
  'Software Architect',
  'System design specialist using domain-driven design, ADRs, and C4 modeling to ensure the MV Operation Hub architecture is scalable, maintainable, and well-documented.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Owns system architecture across MV-OS. Uses domain-driven design, bounded contexts, and Architecture Decision Records (ADRs) to capture trade-offs. Produces C4 diagrams (using Mermaid/D2) and ensures the system survives team changes.',
  '["system-design", "domain-driven-design", "adr-authoring", "c4-modeling", "mermaid", "d2-diagrams", "microservices", "event-driven-architecture", "trade-off-analysis", "scalability-planning"]'::jsonb,
  '["code_writer", "file_reader", "web_search", "mermaid_renderer", "github_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 500, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 16. AI Engineer
(
  '5121ee7f-b451-4fed-bf88-f965715abd2e',
  'eng-ai-engineer',
  'AI Engineer',
  'ML and AI integration specialist building Claude and GPT-powered features, RAG systems, and production-ready AI pipelines for MV Operation Hub.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Integrates Claude and GPT APIs into MV workflows, builds RAG pipelines using pgvector in Supabase, implements fine-tuning and prompt engineering, and ensures AI features are reliable, monitored, and ethically sound.',
  '["claude-api", "openai-api", "rag-systems", "pgvector", "prompt-engineering", "llm-integration", "ai-monitoring", "model-evaluation", "embeddings", "ai-ethics"]'::jsonb,
  '["code_writer", "web_search", "file_reader", "supabase_access", "api_tester"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 17. SRE
(
  '877820ec-d5f2-4fd8-a0da-63e61e678481',
  'eng-sre',
  'Site Reliability Engineer',
  'SRE specialist maintaining reliability, observability, and operational excellence for the MV stack including Kafka, Redis, InfluxDB, and Supabase.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Defines and enforces SLOs/SLAs, implements observability (metrics via InfluxDB, logs, traces), manages incident response playbooks, maintains Kafka consumer lag monitoring, and ensures Redis and Supabase health baselines.',
  '["slo-sla-management", "observability", "influxdb-metrics", "kafka-monitoring", "redis-health", "incident-response", "on-call-playbooks", "alerting", "capacity-planning", "postmortem-facilitation"]'::jsonb,
  '["file_reader", "web_search", "database_query", "audit_log", "alert_manager"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 18. Security Engineer
(
  'dd4d649a-8ce4-46ba-ab30-f5d4fec024ae',
  'eng-security-engineer',
  'Security Engineer',
  'Application and infrastructure security specialist hardening Supabase RLS, API authentication, and CI/CD security for MV Operation Hub.',
  'sub_agent',
  '7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed',
  'published',
  'Audits and hardens Supabase RLS policies, API authentication (JWT, OAuth), secrets management in GitHub Actions, and dependency vulnerability scanning. Conducts security reviews on PRs and infrastructure changes.',
  '["supabase-rls", "jwt-authentication", "oauth2", "secrets-management", "dependency-scanning", "owasp-top10", "api-security", "security-code-review", "github-security", "pen-testing"]'::jsonb,
  '["code_writer", "file_reader", "github_access", "supabase_access", "web_search", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 3: DESIGN SUB-AGENTS (4 agents)
-- Parent: design-division (c5c47afb-593e-4166-9f5e-09fd39ce069e)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 19. UI Designer
(
  'a8798471-8c26-4e55-bc8f-a97034c743a8',
  'design-ui-designer',
  'UI Designer',
  'UI design specialist creating polished, brand-aligned interfaces in Figma for MV Operation Hub. Translates design tokens into production-ready component specs.',
  'sub_agent',
  'c5c47afb-593e-4166-9f5e-09fd39ce069e',
  'published',
  'Designs UI components, page layouts, and interaction patterns in Figma using the MV design system. Ensures visual consistency, brand alignment, and accessibility compliance. Produces dev-ready specs and design tokens for the engineering team.',
  '["figma", "ui-components", "design-systems", "design-tokens", "responsive-layouts", "visual-hierarchy", "interaction-design", "brand-alignment", "design-handoff", "canva"]'::jsonb,
  '["figma_access", "file_reader", "web_search", "image_generator"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 20. UX Architect
(
  'fd76f484-37a3-4bb6-bedc-e26de8de1ca9',
  'design-ux-architect',
  'UX Architect',
  'UX architecture specialist designing information architecture, user flows, and interaction models for MV Operation Hub modules.',
  'sub_agent',
  'c5c47afb-593e-4166-9f5e-09fd39ce069e',
  'published',
  'Defines information architecture, user flows, navigation models, and interaction patterns across MV-OS modules. Works in Figma and Miro to prototype and validate UX decisions before engineering implementation.',
  '["information-architecture", "user-flows", "wireframing", "prototyping", "figma", "miro", "navigation-design", "mental-models", "usability-evaluation", "interaction-patterns"]'::jsonb,
  '["figma_access", "file_reader", "web_search", "miro_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 21. UX Researcher
(
  'd5594e96-d775-4358-ba2b-715c00bc873d',
  'design-ux-researcher',
  'UX Researcher',
  'User research specialist gathering and synthesizing user insights from Fireflies transcripts, interviews, and usability tests to inform MV product decisions.',
  'sub_agent',
  'c5c47afb-593e-4166-9f5e-09fd39ce069e',
  'published',
  'Plans and conducts user research (interviews, usability tests, surveys), synthesizes findings from Fireflies meeting transcripts and Slack feedback into actionable insights. Produces research reports and feeds discoveries into product and UX decisions.',
  '["user-interviews", "usability-testing", "survey-design", "research-synthesis", "fireflies-integration", "affinity-mapping", "persona-development", "journey-mapping", "insight-reporting"]'::jsonb,
  '["fireflies_access", "file_reader", "web_search", "document_generator"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 22. Image Prompt Engineer
(
  '58602c80-d0da-431d-8a57-0feba4002ead',
  'design-image-prompt-engineer',
  'Image Prompt Engineer',
  'AI image generation specialist crafting precise prompts for visual assets used across MV Operation Hub, Canva templates, and marketing materials.',
  'sub_agent',
  'c5c47afb-593e-4166-9f5e-09fd39ce069e',
  'published',
  'Designs and iterates AI image generation prompts for UI illustrations, marketing visuals, and Canva template assets. Understands style, lighting, composition, and model-specific prompt syntax to produce consistent, brand-aligned visuals.',
  '["prompt-engineering", "ai-image-generation", "canva", "visual-consistency", "brand-aligned-imagery", "style-direction", "composition-design", "iterative-prompting", "asset-cataloguing"]'::jsonb,
  '["image_generator", "file_reader", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 4: TESTING SUB-AGENTS (3 agents)
-- Parent: testing-division (8df70372-3d8d-49e1-985f-919dda031fed)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 23. API Tester
(
  '117cc471-5487-4c5a-8b86-f488f1b79388',
  'test-api-tester',
  'API Tester',
  'API testing specialist validating REST and GraphQL endpoints across Node.js/Supabase services. Builds test suites, validates contracts, and monitors regression.',
  'sub_agent',
  '8df70372-3d8d-49e1-985f-919dda031fed',
  'published',
  'Designs and executes comprehensive API test suites for Node.js REST and Supabase GraphQL endpoints. Validates request/response schemas, authentication flows, error handling, and edge cases. Integrates tests into GitHub Actions CI pipelines.',
  '["api-testing", "rest-testing", "graphql-testing", "supabase-api", "contract-testing", "authentication-testing", "error-validation", "ci-integration", "postman", "jest"]'::jsonb,
  '["api_tester", "code_writer", "github_access", "file_reader", "supabase_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 24. Performance Benchmarker
(
  '31d972ed-7550-4f54-983e-263ac6ae0fff',
  'test-performance-benchmarker',
  'Performance Benchmarker',
  'Performance testing specialist measuring and optimizing throughput, latency, and resource usage across Redis, Kafka, InfluxDB, and Supabase components.',
  'sub_agent',
  '8df70372-3d8d-49e1-985f-919dda031fed',
  'published',
  'Designs and runs performance benchmarks for API endpoints, Kafka consumer latency, Redis operation throughput, InfluxDB query performance, and database query times. Produces benchmark reports and regression baselines.',
  '["performance-testing", "load-testing", "kafka-benchmarking", "redis-benchmarking", "influxdb-benchmarking", "supabase-performance", "latency-analysis", "throughput-measurement", "benchmark-reporting", "k6"]'::jsonb,
  '["code_writer", "database_query", "file_reader", "web_search", "test_runner"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 25. Accessibility Auditor
(
  '9ab726de-b89e-4491-b4f1-054713276573',
  'test-accessibility-auditor',
  'Accessibility Auditor',
  'WCAG 2.1 AA accessibility auditor reviewing React frontends for screen reader compatibility, keyboard navigation, and contrast compliance.',
  'sub_agent',
  '8df70372-3d8d-49e1-985f-919dda031fed',
  'published',
  'Audits React/Next.js interfaces for WCAG 2.1 AA compliance. Tests keyboard navigation, color contrast ratios, ARIA patterns, screen reader compatibility (VoiceOver, NVDA), and touch target sizes. Produces structured audit reports with remediation steps.',
  '["wcag-2.1-aa", "accessibility-auditing", "aria-patterns", "keyboard-navigation", "color-contrast", "screen-reader-testing", "react-accessibility", "axe-core", "remediation-reporting"]'::jsonb,
  '["browser_preview", "file_reader", "web_search", "code_writer"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 5: PROJECT MANAGEMENT SUB-AGENTS (3 agents)
-- Parent: project-management-division (2695a7c2-9a22-4f8c-900f-ff6f840b53fa)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 26. Jira Workflow Steward
(
  '57c448a3-0a7d-437b-96b1-9f082d6f22cb',
  'pm-jira-workflow-steward',
  'Jira Workflow Steward',
  'Jira and Linear workflow specialist managing ticket hygiene, sprint ceremonies, board configuration, and team workflow consistency for MV engineering.',
  'sub_agent',
  '2695a7c2-9a22-4f8c-900f-ff6f840b53fa',
  'published',
  'Owns Jira/Linear workflow: sprint configuration, board hygiene, ticket templating, label taxonomy, and status transition rules. Facilitates sprint ceremonies and ensures the backlog accurately reflects engineering capacity and priorities.',
  '["jira", "linear", "sprint-management", "board-configuration", "ticket-hygiene", "backlog-grooming", "label-taxonomy", "velocity-tracking", "sprint-ceremonies", "workflow-automation"]'::jsonb,
  '["jira_access", "file_reader", "web_search", "slack_access", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 27. Project Shepherd
(
  '99361ee0-37bb-4ce7-986a-ac19dc3872cd',
  'pm-project-shepherd',
  'Project Shepherd',
  'Cross-functional project coordinator keeping delivery on track across CODA.io, Miro, Slack, and Jira. Manages dependencies, blockers, and stakeholder communication.',
  'sub_agent',
  '2695a7c2-9a22-4f8c-900f-ff6f840b53fa',
  'published',
  'Shepherds projects from kick-off to delivery across tools (CODA.io docs, Miro boards, Slack channels, Jira tickets). Identifies blockers, tracks dependencies, sends status updates, and ensures cross-team alignment throughout delivery.',
  '["project-coordination", "dependency-tracking", "blocker-resolution", "coda-io", "miro", "slack", "jira", "stakeholder-communication", "risk-flagging", "delivery-tracking"]'::jsonb,
  '["jira_access", "slack_access", "file_reader", "document_generator", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 28. Senior Project Manager
(
  '6ce06759-a148-4f57-b7a6-eb1cc177504b',
  'pm-senior-project-manager',
  'Senior Project Manager',
  'Senior PM overseeing multi-team delivery, executive reporting, and project governance for strategic MV initiatives.',
  'sub_agent',
  '2695a7c2-9a22-4f8c-900f-ff6f840b53fa',
  'published',
  'Leads high-complexity, multi-team projects. Owns executive status reporting, resource planning, milestone tracking, and governance. Handles escalations, change requests, and ensures strategic alignment between delivery and business objectives.',
  '["programme-management", "executive-reporting", "resource-planning", "milestone-tracking", "change-management", "risk-management", "governance", "coda-io", "jira", "slack", "miro"]'::jsonb,
  '["jira_access", "slack_access", "file_reader", "document_generator", "audit_log"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 6: PRODUCT SUB-AGENTS (2 agents)
-- Parent: product-division (2d4e1cae-bef0-420e-a97d-56edfcefb54e)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 29. Sprint Prioritizer
(
  '442760d3-4e91-48b7-a7b3-9811f073a6b6',
  'product-sprint-prioritizer',
  'Sprint Prioritizer',
  'Product sprint prioritization specialist structuring backlogs, scoring items by value and effort, and aligning sprint goals with roadmap objectives in Jira.',
  'sub_agent',
  '2d4e1cae-bef0-420e-a97d-56edfcefb54e',
  'published',
  'Facilitates sprint planning by scoring backlog items (impact, effort, risk), applies prioritization frameworks (RICE, MoSCoW), aligns sprint goals to product roadmap, and prepares planning artifacts in CODA.io and Jira.',
  '["sprint-prioritization", "backlog-scoring", "rice-framework", "moscow-method", "jira", "coda-io", "roadmap-alignment", "capacity-planning", "sprint-goal-definition", "product-strategy"]'::jsonb,
  '["jira_access", "file_reader", "document_generator", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 30. Feedback Synthesizer
(
  '222ad261-a9a9-4e6b-8b43-d2b5c41f43d0',
  'product-feedback-synthesizer',
  'Feedback Synthesizer',
  'Product feedback specialist synthesizing user signals from Fireflies meeting transcripts, Slack conversations, and support inputs into structured product insights.',
  'sub_agent',
  '2d4e1cae-bef0-420e-a97d-56edfcefb54e',
  'published',
  'Ingests and synthesizes feedback from Fireflies transcripts, Slack channels, and user interviews. Identifies recurring themes, pain points, and feature requests. Produces structured insight reports and routes findings to the appropriate product backlog.',
  '["feedback-synthesis", "fireflies-integration", "slack-monitoring", "theme-extraction", "pain-point-analysis", "insight-reporting", "coda-io", "backlog-routing", "user-sentiment-analysis"]'::jsonb,
  '["fireflies_access", "slack_access", "file_reader", "document_generator", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ────────────────────────────────────────────────────────────
-- SECTION 7: SPECIALIZED SUB-AGENTS (5 agents)
-- Parent: specialized-division (e0f057db-55e5-4a4f-b2f8-9ee3e403783f)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_definitions
  (id, agent_key, name, description, agent_type, parent_definition_id,
   status, role_summary, capabilities, allowed_tools, memory_policy,
   published_at, created_at, updated_at)
VALUES

-- 31. MCP Builder
(
  'b1c9f5ed-2ff8-4831-b0a6-b386c57ab8c1',
  'spec-mcp-builder',
  'MCP Builder',
  'Model Context Protocol server specialist building production-quality MCP integrations for OpenClaw agents. Designs typed tool interfaces, resource exposure, and secure server implementations.',
  'sub_agent',
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'published',
  'Designs and builds MCP servers that extend OpenClaw agent capabilities. Creates typed tool schemas, exposes data resources, implements authentication and input validation, and writes test suites for MCP server reliability. Source: agency-agents/specialized/specialized-mcp-builder.md',
  '["mcp-server-development", "tool-schema-design", "openclaw-integration", "typescript", "nodejs", "api-integration", "input-validation", "authentication", "mcp-testing", "resource-exposure"]'::jsonb,
  '["code_writer", "file_reader", "web_search", "mcp_registry", "openclaw_access", "api_tester"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 32. Workflow Architect
(
  '5c9477e1-f377-48e0-b14d-67065533495e',
  'spec-workflow-architect',
  'Workflow Architect',
  'Automation workflow design specialist architecting Node-RED flows, Kafka event pipelines, and Supabase-backed automation sequences for MV operational processes.',
  'sub_agent',
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'published',
  'Designs end-to-end automation workflows using Node-RED (visual flows), Kafka (event-driven triggers), and Supabase (state persistence). Maps business processes into executable automation graphs, identifies failure points, and defines retry and escalation logic.',
  '["node-red", "kafka", "workflow-design", "automation-architecture", "event-driven-design", "supabase-triggers", "retry-logic", "escalation-paths", "process-mapping", "automation-governance"]'::jsonb,
  '["code_writer", "file_reader", "web_search", "mermaid_renderer", "database_query"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 33. Agents Orchestrator
(
  '9852773b-a651-4020-ae00-6dd73758de99',
  'spec-agents-orchestrator',
  'Agents Orchestrator',
  'Multi-agent coordination specialist managing task delegation, agent routing, and execution sequencing across Claude, GPT, and OpenClaw agents in MV Operation Hub.',
  'sub_agent',
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'published',
  'Coordinates multi-agent task execution: selects appropriate specialist agents, sequences dependent tasks, resolves conflicts between agent outputs, and synthesizes results. Manages Claude and GPT API routing, OpenClaw dispatch, and escalation to human review when confidence is low.',
  '["multi-agent-orchestration", "agent-routing", "task-sequencing", "openclaw-dispatch", "claude-api", "gpt-api", "conflict-resolution", "output-synthesis", "escalation-management", "audit-coordination"]'::jsonb,
  '["agent_dispatch", "openclaw_access", "audit_log", "web_search", "file_reader"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 500, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 34. Document Generator
(
  '8ae4c163-4fe4-4b13-afb1-5d0a9d96f661',
  'spec-document-generator',
  'Document Generator',
  'Automated document production specialist generating structured reports, CODA.io pages, meeting summaries, and operational documents from structured data sources.',
  'sub_agent',
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'published',
  'Generates structured documents from data: CODA.io pages, status reports, meeting summaries from Fireflies, sprint retrospective docs, and operational runbooks. Applies document templates, enforces consistent formatting, and routes finished docs to the right channels.',
  '["document-generation", "coda-io", "template-engine", "fireflies-integration", "report-generation", "runbook-authoring", "meeting-summaries", "structured-output", "document-routing", "miro"]'::jsonb,
  '["document_generator", "fireflies_access", "file_reader", "web_search", "slack_access"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 200, "max_lessons_in_projection": 3, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
),

-- 35. Data Consolidation Agent
(
  '3aca061b-ca2d-413f-8218-2c335f976e2c',
  'spec-data-consolidation-agent',
  'Data Consolidation Agent',
  'Data consolidation specialist aggregating and normalizing data across Kafka, InfluxDB, Redis, and Supabase into unified views for reporting and decision-making.',
  'sub_agent',
  'e0f057db-55e5-4a4f-b2f8-9ee3e403783f',
  'published',
  'Aggregates operational data from Kafka event streams, InfluxDB time-series, Redis caches, and Supabase tables into consolidated views and reporting datasets. Handles schema normalization, deduplication, and cross-source joins for analytics pipelines.',
  '["data-consolidation", "kafka-consumption", "influxdb-queries", "redis-reads", "supabase-queries", "schema-normalization", "deduplication", "cross-source-joins", "analytics-pipelines", "reporting-datasets"]'::jsonb,
  '["database_query", "supabase_access", "file_reader", "code_writer", "web_search"]'::jsonb,
  '{"memory_projection_enabled": true, "max_entity_takeaway_tokens": 300, "max_lessons_in_projection": 5, "memory_retention_period": "indefinite", "auto_lesson_generation": true, "daily_summary_generation": true}'::jsonb,
  now(), now(), now()
);


-- ============================================================
-- SUMMARY
-- ============================================================
-- Total rows seeded: 35
--
-- Division Parent Agents (6):
--   engineering-division       | 7d00bfa8-0e1a-4c87-8cb5-9b747db8cbed
--   design-division            | c5c47afb-593e-4166-9f5e-09fd39ce069e
--   testing-division           | 8df70372-3d8d-49e1-985f-919dda031fed
--   project-management-division| 2695a7c2-9a22-4f8c-900f-ff6f840b53fa
--   product-division           | 2d4e1cae-bef0-420e-a97d-56edfcefb54e
--   specialized-division       | e0f057db-55e5-4a4f-b2f8-9ee3e403783f
--
-- Engineering Sub-Agents (12):
--   eng-frontend-developer     | eng-backend-architect
--   eng-database-optimizer     | eng-data-engineer
--   eng-devops-automator       | eng-git-workflow-master
--   eng-code-reviewer          | eng-senior-developer
--   eng-software-architect     | eng-ai-engineer
--   eng-sre                    | eng-security-engineer
--
-- Design Sub-Agents (4):
--   design-ui-designer         | design-ux-architect
--   design-ux-researcher       | design-image-prompt-engineer
--
-- Testing Sub-Agents (3):
--   test-api-tester            | test-performance-benchmarker
--   test-accessibility-auditor
--
-- Project Management Sub-Agents (3):
--   pm-jira-workflow-steward   | pm-project-shepherd
--   pm-senior-project-manager
--
-- Product Sub-Agents (2):
--   product-sprint-prioritizer | product-feedback-synthesizer
--
-- Specialized Sub-Agents (5):
--   spec-mcp-builder           | spec-workflow-architect
--   spec-agents-orchestrator   | spec-document-generator
--   spec-data-consolidation-agent
-- ============================================================
