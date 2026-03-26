import type { SupabaseClient } from '@supabase/supabase-js'

export interface SystemStatusItem {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  meta?: string
  lastCheck?: string
}

export interface IncidentItem {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'mitigated' | 'resolved'
  source?: string
  createdAt: string
  resolvedAt?: string
}

export interface WarRoomOverview {
  systemStatus: SystemStatusItem[]
  activeIncidents: IncidentItem[]
  failedTasks: Array<{
    id: string
    title: string | null
    status: string
    error: string | null
    updatedAt: string
  }>
  unreachableAgents: Array<{
    id: string
    name: string
    status: string
    lastSeen: string | null
  }>
  queueDepth: number
  openIncidentCount: number
}

export async function buildWarRoomOverview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<WarRoomOverview> {
  const [
    gatewayResult,
    agentsResult,
    failedTasksResult,
    queueDepthResult,
    incidentsResult,
  ] = await Promise.all([
    supabase
      .from('gateway_health_checks')
      .select('status, latency_ms, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agents')
      .select('id, name, status, last_seen')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('tasks')
      .select('id, title, status, error, updated_at')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('task_queue')
      .select('id', { count: 'exact', head: true })
      .is('claimed_by', null),
    // incidents table from migration 0008 uses: status in
    // ('open','acknowledged','investigating','resolved','suppressed')
    // and has source_ref instead of source, opened_at instead of created_at
    supabase
      .from('incidents')
      .select('id, title, severity, status, incident_type, source_ref, opened_at, resolved_at')
      .in('status', ['open', 'investigating', 'acknowledged'])
      .order('opened_at', { ascending: false })
      .limit(20),
  ])

  const agents = agentsResult.data ?? []
  const unreachableAgents = agents
    .filter((a: { status: string }) => a.status === 'unreachable' || a.status === 'stale')
    .map((a: { id: string; name: string; status: string; last_seen: string | null }) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      lastSeen: a.last_seen,
    }))

  const systemStatus: SystemStatusItem[] = [
    {
      name: 'OpenClaw Gateway',
      status: normalizeStatus(gatewayResult.data?.status),
      meta: gatewayResult.data?.latency_ms ? `${gatewayResult.data.latency_ms}ms` : undefined,
      lastCheck: gatewayResult.data?.checked_at,
    },
    {
      name: 'Database',
      status: 'healthy', // if we got this far, db is up
      meta: 'Connection OK',
    },
    {
      name: 'Agent Fleet',
      status: unreachableAgents.length > 0 ? 'degraded' : 'healthy',
      meta: `${agents.length} agents, ${unreachableAgents.length} unreachable`,
    },
  ]

  return {
    systemStatus,
    activeIncidents: (incidentsResult.data ?? []).map((inc: {
      id: string
      title: string
      severity: string
      status: string
      incident_type: string | null
      source_ref: string | null
      opened_at: string
      resolved_at: string | null
    }) => ({
      id: inc.id,
      title: inc.title,
      severity: inc.severity as IncidentItem['severity'],
      // map 'acknowledged' -> 'investigating' so our type stays clean
      status: (inc.status === 'acknowledged' ? 'investigating' : inc.status) as IncidentItem['status'],
      source: inc.source_ref ?? inc.incident_type ?? undefined,
      createdAt: inc.opened_at,
      resolvedAt: inc.resolved_at ?? undefined,
    })),
    failedTasks: (failedTasksResult.data ?? []).map((t: {
      id: string
      title: string | null
      status: string
      error: string | null
      updated_at: string
    }) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      error: t.error,
      updatedAt: t.updated_at,
    })),
    unreachableAgents,
    queueDepth: queueDepthResult.count ?? 0,
    openIncidentCount: (incidentsResult.data ?? []).length,
  }
}

function normalizeStatus(status: unknown): 'healthy' | 'degraded' | 'down' | 'unknown' {
  if (status === 'healthy') return 'healthy'
  if (status === 'degraded') return 'degraded'
  if (status === 'down') return 'down'
  return 'unknown'
}
