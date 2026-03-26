-- Migration 0015: War Room extensions
-- Note: system_state (key/value jsonb), incidents, and gateway_health_checks
-- already exist from migration 0008. This migration adds war-room-specific
-- indexes and policies only. It is fully idempotent.

-- Add a composite index on incidents for war room active-incident queries
-- (status + severity + opened_at) if not already present
create index if not exists idx_incidents_status_severity
  on incidents(status, severity, opened_at desc);

-- Seed war_room_initialized state entry so the UI can confirm the migration ran
insert into system_state (key, value)
values ('war_room_initialized', '{"active": true}'::jsonb)
on conflict (key) do nothing;
