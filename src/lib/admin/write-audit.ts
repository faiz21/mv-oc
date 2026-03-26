import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

interface AuditEntry {
  actorId: string
  entityType: string
  entityId: string
  event: string
  data?: { [key: string]: Json | undefined }
}

export async function writeAudit(
  adminClient: SupabaseClient<Database>,
  entry: AuditEntry,
) {
  await adminClient.from('audit_log').insert({
    actor_type: 'human',
    actor_ref: entry.actorId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    event: entry.event,
    data: entry.data ?? {},
  })
}
