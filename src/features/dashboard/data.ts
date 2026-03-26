import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  activeRuns: number
  awaitingApproval: number
  pendingApprovals: number
  oldestApprovalMinutes: number | null
  avgApprovalAgeMinutes: number | null
  activeAgents: number
  unreachableAgents: number
  highErrorAgents: number
  tasksPending24h: number
  tasksRunning24h: number
  tasksFailed24h: number
  slaOnTrack: number
  slaWarning: number
  slaBreach: number
}

export interface SlaSnapshotItem {
  runId: string
  stepId: string
  workflowName: string
  entityRef: string | null
  currentStepName: string
  startedAt: string | null
  slaDueAt: string | null
  pctConsumed: number
  slaState: 'on_track' | 'warning' | 'breach'
  executorType: string
  executorRef: string | null
}

export interface WorkflowPerformanceItem {
  workflowId: string
  workflowName: string
  taskCount: number
  successRate: number
  avgExecutionMs: number | null
}

export interface SlaThresholds {
  warningPct: number
  breachPct: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fetch SLA thresholds from system_state (never hardcode 80/100)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSlaThresholds(
  supabase: SupabaseClient<Database>,
): Promise<SlaThresholds> {
  const { data } = await supabase
    .from('system_state')
    .select('key, value')
    .in('key', ['sla_warning_threshold_pct', 'sla_breach_threshold_pct'])

  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    if (typeof row.value === 'number') {
      map[row.key] = row.value
    }
  }

  return {
    warningPct: map['sla_warning_threshold_pct'] ?? 80,
    breachPct: map['sla_breach_threshold_pct'] ?? 100,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getDashboardSummary
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardSummary(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<DashboardSummary> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    runsResult,
    approvalsResult,
    agentsResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from('workflow_runs')
      .select('status')
      .eq('department_id', departmentId)
      .in('status', ['running', 'awaiting_approval']),
    supabase
      .from('approval_queue')
      .select('created_at')
      .eq('status', 'awaiting_review'),
    supabase
      .from('agents')
      .select('status, error_rate_24h')
      .is('deleted_at', null),
    supabase
      .from('tasks')
      .select('status')
      .eq('department_id', departmentId)
      .gte('created_at', since24h),
  ])

  const runs = runsResult.data ?? []
  const approvals = approvalsResult.data ?? []
  const agents = agentsResult.data ?? []
  const tasks = tasksResult.data ?? []

  const now = Date.now()
  const approvalAges = approvals.map(
    (a) => (now - Date.parse(a.created_at)) / 60000,
  )

  // Resolve agent thresholds from system_state
  const agentErrorThresholdRow = await supabase
    .from('system_state')
    .select('value')
    .eq('key', 'agent_error_rate_alert_threshold_pct')
    .single()

  const agentErrorThreshold =
    typeof agentErrorThresholdRow.data?.value === 'number'
      ? agentErrorThresholdRow.data.value
      : 25

  return {
    activeRuns: runs.filter((r) => r.status === 'running').length,
    awaitingApproval: runs.filter((r) => r.status === 'awaiting_approval').length,
    pendingApprovals: approvals.length,
    oldestApprovalMinutes:
      approvalAges.length > 0 ? Math.max(...approvalAges) : null,
    avgApprovalAgeMinutes:
      approvalAges.length > 0
        ? approvalAges.reduce((a, b) => a + b, 0) / approvalAges.length
        : null,
    activeAgents: agents.filter((a) => a.status === 'active').length,
    unreachableAgents: agents.filter((a) => a.status === 'unreachable').length,
    highErrorAgents: agents.filter(
      (a) =>
        typeof a.error_rate_24h === 'number' &&
        a.error_rate_24h > agentErrorThreshold,
    ).length,
    tasksPending24h: tasks.filter((t) =>
      t.status === 'pending' || t.status === 'queued',
    ).length,
    tasksRunning24h: tasks.filter((t) => t.status === 'running').length,
    tasksFailed24h: tasks.filter((t) => t.status === 'failed').length,
    slaOnTrack: 0,
    slaWarning: 0,
    slaBreach: 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getSlaSnapshot
// ─────────────────────────────────────────────────────────────────────────────

export async function getSlaSnapshot(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<SlaSnapshotItem[]> {
  const thresholds = await getSlaThresholds(supabase)

  // Fetch active workflow_run_steps joined to their runs for department filtering
  const { data: steps } = await supabase
    .from('workflow_run_steps')
    .select(
      'id, workflow_run_id, status, executor_type, executor_ref, started_at, created_at, workflow_runs!inner(department_id, workflow_id, trigger_ref)',
    )
    .in('status', ['running', 'awaiting_approval', 'ready'])
    .eq('workflow_runs.department_id', departmentId)

  if (!steps || steps.length === 0) return []

  // Fetch workflow names
  const workflowIds = [
    ...new Set(
      steps
        .map((s) => {
          const run = s.workflow_runs as unknown as { workflow_id?: string }
          return run?.workflow_id
        })
        .filter(Boolean),
    ),
  ] as string[]

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, name')
    .in('id', workflowIds)

  const workflowMap: Record<string, string> = {}
  for (const wf of workflows ?? []) {
    workflowMap[wf.id] = wf.name
  }

  const now = Date.now()

  return steps
    .map((step) => {
      const run = step.workflow_runs as unknown as {
        workflow_id?: string
        trigger_ref?: string | null
      }
      const workflowName = run?.workflow_id
        ? (workflowMap[run.workflow_id] ?? 'Unknown workflow')
        : 'Unknown workflow'
      const entityRef = run?.trigger_ref ?? null

      // workflow_run_steps doesn't have sla_due_at in the schema — derive from created_at + 1hr default
      // The real SLA comes from governance_state; we use started_at as proxy
      const startedAt = step.started_at ?? step.created_at
      const slaDueAt: string | null = null // No sla_due_at column in workflow_run_steps

      let pctConsumed = 0
      let slaState: 'on_track' | 'warning' | 'breach' = 'on_track'

      if (startedAt && slaDueAt) {
        const startMs = Date.parse(startedAt)
        const dueMs = Date.parse(slaDueAt)
        const elapsed = now - startMs
        const total = dueMs - startMs
        if (total > 0) {
          pctConsumed = Math.min((elapsed / total) * 100, 999)
          if (pctConsumed >= thresholds.breachPct) slaState = 'breach'
          else if (pctConsumed >= thresholds.warningPct) slaState = 'warning'
        }
      }

      return {
        runId: step.workflow_run_id,
        stepId: step.id,
        workflowName,
        entityRef,
        currentStepName: step.status,
        startedAt,
        slaDueAt,
        pctConsumed,
        slaState,
        executorType: step.executor_type,
        executorRef: step.executor_ref ?? null,
      }
    })
    .sort((a, b) => {
      // Sort: breached first, then by pct consumed desc
      const order = { breach: 0, warning: 1, on_track: 2 }
      const diff = order[a.slaState] - order[b.slaState]
      if (diff !== 0) return diff
      return b.pctConsumed - a.pctConsumed
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// getWorkflowPerformance
// ─────────────────────────────────────────────────────────────────────────────

type PeriodKey = '24h' | '7d' | '30d'

export async function getWorkflowPerformance(
  supabase: SupabaseClient<Database>,
  departmentId: string,
  period: PeriodKey = '24h',
): Promise<WorkflowPerformanceItem[]> {
  const msMap: Record<PeriodKey, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }

  const since = new Date(Date.now() - msMap[period]).toISOString()

  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('workflow_id, status, started_at, completed_at')
    .eq('department_id', departmentId)
    .gte('created_at', since)

  if (!runs || runs.length === 0) return []

  const workflowIds = [...new Set(runs.map((r) => r.workflow_id))]

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, name')
    .in('id', workflowIds)

  const workflowMap: Record<string, string> = {}
  for (const wf of workflows ?? []) {
    workflowMap[wf.id] = wf.name
  }

  const grouped: Record<
    string,
    { name: string; total: number; success: number; executionMs: number[] }
  > = {}

  for (const run of runs) {
    if (!grouped[run.workflow_id]) {
      grouped[run.workflow_id] = {
        name: workflowMap[run.workflow_id] ?? 'Unknown',
        total: 0,
        success: 0,
        executionMs: [],
      }
    }

    const g = grouped[run.workflow_id]
    g.total += 1

    if (run.status === 'complete') {
      g.success += 1
      if (run.started_at && run.completed_at) {
        const ms = Date.parse(run.completed_at) - Date.parse(run.started_at)
        if (ms > 0) g.executionMs.push(ms)
      }
    }
  }

  return Object.entries(grouped).map(([workflowId, g]) => ({
    workflowId,
    workflowName: g.name,
    taskCount: g.total,
    successRate: g.total > 0 ? (g.success / g.total) * 100 : 0,
    avgExecutionMs:
      g.executionMs.length > 0
        ? g.executionMs.reduce((a, b) => a + b, 0) / g.executionMs.length
        : null,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// getActiveWorkflowRuns  (for LiveTaskMonitor)
// ─────────────────────────────────────────────────────────────────────────────

export interface ActiveRunRow {
  id: string
  workflowId: string
  workflowName: string
  status: string
  entityRef: string | null
  startedAt: string | null
  createdAt: string
  currentStepName: string | null
  currentStepStatus: string | null
}

export async function getActiveWorkflowRuns(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<ActiveRunRow[]> {
  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('id, workflow_id, status, trigger_ref, started_at, created_at, current_step_run_id')
    .eq('department_id', departmentId)
    .in('status', ['running', 'awaiting_approval', 'pending'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (!runs || runs.length === 0) return []

  const workflowIds = [...new Set(runs.map((r) => r.workflow_id))]
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, name')
    .in('id', workflowIds)

  const wfMap: Record<string, string> = {}
  for (const wf of workflows ?? []) {
    wfMap[wf.id] = wf.name
  }

  // Fetch current steps for runs that have one
  const stepIds = runs
    .map((r) => r.current_step_run_id)
    .filter((id): id is string => id !== null)

  const stepMap: Record<string, Tables<'workflow_run_steps'>> = {}
  if (stepIds.length > 0) {
    const { data: steps } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .in('id', stepIds)

    for (const step of steps ?? []) {
      stepMap[step.id] = step
    }
  }

  return runs.map((run) => {
    const step = run.current_step_run_id
      ? stepMap[run.current_step_run_id]
      : undefined

    return {
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: wfMap[run.workflow_id] ?? 'Unknown',
      status: run.status,
      entityRef: run.trigger_ref ?? null,
      startedAt: run.started_at ?? null,
      createdAt: run.created_at,
      currentStepName: step ? step.status : null,
      currentStepStatus: step ? step.status : null,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getPendingApprovals  (for ApprovalQueuePanel)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingApprovals(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'approval_queue'>[]> {
  const { data } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('status', 'awaiting_review')
    .order('created_at', { ascending: true })

  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// getSystemHealth  (for SystemHealthPanel)
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemHealthData {
  gateway: {
    name: string
    status: string
    latencyMs: number | null
    checkedAt: string
  } | null
  taskQueue: {
    pending: number
    queued: number
    running: number
    failed24h: number
    alertThreshold: number
  }
  automationJobs: Tables<'automation_jobs'>[]
}

export async function getSystemHealth(
  supabase: SupabaseClient<Database>,
  departmentId: string,
): Promise<SystemHealthData> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [gatewayResult, thresholdResult, tasksResult, jobsResult] =
    await Promise.all([
      supabase
        .from('gateway_health_checks')
        .select('gateway_name, status, latency_ms, checked_at')
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('system_state')
        .select('value')
        .eq('key', 'task_queue_alert_threshold')
        .maybeSingle(),
      supabase
        .from('tasks')
        .select('status')
        .eq('department_id', departmentId),
      supabase
        .from('automation_jobs')
        .select('*')
        .order('next_run_at', { ascending: true })
        .limit(5),
    ])

  const gwRow = gatewayResult.data
  const alertThreshold =
    typeof thresholdResult.data?.value === 'number'
      ? thresholdResult.data.value
      : 20

  const tasks = tasksResult.data ?? []

  const failedResult = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', departmentId)
    .eq('status', 'failed')
    .gte('created_at', since24h)

  return {
    gateway: gwRow
      ? {
          name: gwRow.gateway_name,
          status: gwRow.status,
          latencyMs: gwRow.latency_ms ?? null,
          checkedAt: gwRow.checked_at,
        }
      : null,
    taskQueue: {
      pending: tasks.filter((t) => t.status === 'pending').length,
      queued: tasks.filter((t) => t.status === 'queued').length,
      running: tasks.filter((t) => t.status === 'running').length,
      failed24h: failedResult.count ?? 0,
      alertThreshold,
    },
    automationJobs: jobsResult.data ?? [],
  }
}
