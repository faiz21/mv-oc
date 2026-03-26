import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'
import type { AdminSnapshot } from '@/features/admin/admin-overview'
import { checkAllSecrets } from '@/lib/admin/secret-mask'

export async function buildAdminSnapshot(
  adminClient: SupabaseClient<Database>,
  departmentIds?: string[],
): Promise<AdminSnapshot> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Run all queries in parallel
  const [usersResult, agentsResult, stuckResult, auditResult] = await Promise.all([
    // Active user count
    adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .is('disabled_at', null),

    // Agent stats
    (async () => {
      let query = adminClient
        .from('agents')
        .select('status')
        .is('deleted_at', null)

      if (departmentIds && departmentIds.length > 0) {
        query = query.in('department_id', departmentIds)
      }

      const { data } = await query
      const agents = data ?? []
      return {
        total: agents.length,
        unreachable: agents.filter(
          (a) => a.status === 'unreachable' || a.status === 'error',
        ).length,
      }
    })(),

    // Stuck tasks
    (async () => {
      let query = adminClient
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'running')
        .lt('updated_at', thirtyMinutesAgo)

      if (departmentIds && departmentIds.length > 0) {
        query = query.in('department_id', departmentIds)
      }

      const { count } = await query
      return count ?? 0
    })(),

    // Audit events in 24h
    adminClient
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo),
  ])

  // Env checks (sync, server-only)
  const envChecks = checkAllSecrets()
  const verifiedChecks = envChecks.filter((c) => c.present).length

  return {
    activeUsers: usersResult.count ?? 0,
    registeredAgents: agentsResult.total,
    unreachableAgents: agentsResult.unreachable,
    verifiedEnvChecks: verifiedChecks,
    stuckTasks: stuckResult,
    auditEvents24h: auditResult.count ?? 0,
  }
}
