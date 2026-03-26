import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

export interface DiagnosticsResult {
  database: { connected: boolean; latencyMs: number }
  agents: { total: number; active: number; unreachable: number; error: number }
  tasks: { stuck: number; pending: number; running: number; failed: number }
  timestamp: string
}

export async function runDiagnostics(
  adminClient: SupabaseClient<Database>,
): Promise<DiagnosticsResult> {
  const timestamp = new Date().toISOString()

  // Database connectivity
  const dbStart = Date.now()
  let dbConnected = false
  try {
    await adminClient.from('profiles').select('id').limit(1)
    dbConnected = true
  } catch {
    // connection failed
  }
  const dbLatency = Date.now() - dbStart

  // Agent status distribution
  const { data: agents } = await adminClient
    .from('agents')
    .select('status')
    .is('deleted_at', null)

  const agentList = agents ?? []
  const agentStats = {
    total: agentList.length,
    active: agentList.filter((a) => a.status === 'active').length,
    unreachable: agentList.filter((a) => a.status === 'unreachable').length,
    error: agentList.filter((a) => a.status === 'error').length,
  }

  // Task queue status
  const { data: tasks } = await adminClient
    .from('tasks')
    .select('status, updated_at')

  const taskList = tasks ?? []
  const stuckThreshold = Date.now() - 30 * 60 * 1000 // 30 minutes
  const stuckTasks = taskList.filter(
    (t) =>
      t.status === 'running' &&
      new Date(t.updated_at).getTime() < stuckThreshold,
  )

  const taskStats = {
    stuck: stuckTasks.length,
    pending: taskList.filter((t) => t.status === 'pending').length,
    running: taskList.filter((t) => t.status === 'running').length,
    failed: taskList.filter((t) => t.status === 'failed').length,
  }

  return {
    database: { connected: dbConnected, latencyMs: dbLatency },
    agents: agentStats,
    tasks: taskStats,
    timestamp,
  }
}
