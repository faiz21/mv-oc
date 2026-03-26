import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

interface AuditLogOptions {
  entityType?: string
  actorRef?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export async function getAuditLog(
  supabase: SupabaseClient<Database>,
  options?: AuditLogOptions,
): Promise<{ entries: Tables<'audit_log'>[]; total: number }> {
  const limit = options?.limit ?? 25
  const offset = options?.offset ?? 0

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType)
  }
  if (options?.actorRef) {
    query = query.eq('actor_ref', options.actorRef)
  }
  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  const { data, count } = await query

  return {
    entries: data ?? [],
    total: count ?? 0,
  }
}

export async function getAuditLogForExport(
  supabase: SupabaseClient<Database>,
  options?: Omit<AuditLogOptions, 'limit' | 'offset'>,
): Promise<Tables<'audit_log'>[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType)
  }
  if (options?.actorRef) {
    query = query.eq('actor_ref', options.actorRef)
  }
  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  const { data } = await query
  return data ?? []
}
