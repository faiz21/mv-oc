export type DashboardRunStatus = 'pending' | 'running' | 'awaiting_approval' | 'paused' | 'complete' | 'failed' | 'cancelled'
export type DashboardSlaState = 'on_track' | 'warning' | 'breached'

export interface DashboardRunRecord {
  id: string
  workflowId: string
  workflowName: string
  status: DashboardRunStatus
  entityRef: string | null
  startedAt: string | null
  createdAt: string
}

export interface DashboardStepRecord {
  id: string
  workflowRunId: string
  stepName: string
  status: string
  slaDueAt: string | null
  startedAt: string | null
}

export interface DashboardApprovalRecord {
  id: string
  gateType: string
  createdAt: string
  assignedReviewerName: string | null
}

export interface DashboardAgentRecord {
  id: string
  name: string
  status: string
  errorRate24h: number | null
  lastSeen: string | null
}

export interface DashboardAuditRecord {
  id: number
  event: string
  entityType: string
  createdAt: string
}

export interface DashboardSystemHealthRecord {
  queueDepth: number
  gatewayStatus: 'healthy' | 'degraded' | 'down'
  gatewayLatencyMs: number | null
  automationActive: number
}

export function buildDashboardOverview(
  input: {
    runs: DashboardRunRecord[]
    steps: DashboardStepRecord[]
    approvals: DashboardApprovalRecord[]
    agents: DashboardAgentRecord[]
    auditEvents: DashboardAuditRecord[]
    systemHealth: DashboardSystemHealthRecord
  },
  options?: {
    now?: Date
  },
) {
  const now = options?.now ?? new Date()
  const currentSteps = new Map<string, DashboardStepRecord>()

  for (const step of input.steps) {
    const existing = currentSteps.get(step.workflowRunId)
    if (!existing) {
      currentSteps.set(step.workflowRunId, step)
      continue
    }

    const existingTimestamp = Date.parse(existing.startedAt ?? existing.slaDueAt ?? '1970-01-01T00:00:00.000Z')
    const nextTimestamp = Date.parse(step.startedAt ?? step.slaDueAt ?? '1970-01-01T00:00:00.000Z')
    if (nextTimestamp > existingTimestamp) {
      currentSteps.set(step.workflowRunId, step)
    }
  }

  const liveRuns = input.runs
    .map((run) => {
      const currentStep = currentSteps.get(run.id)
      const slaState = resolveSlaState(currentStep?.startedAt ?? null, currentStep?.slaDueAt ?? null, now)

      return {
        runId: run.id,
        workflowId: run.workflowId,
        workflowName: run.workflowName,
        entityRef: run.entityRef,
        status: run.status,
        currentStepName: currentStep?.stepName ?? 'Awaiting start',
        slaState,
        startedAt: run.startedAt,
        createdAt: run.createdAt,
      }
    })
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

  const sla = liveRuns.reduce(
    (accumulator, run) => {
      if (run.slaState === 'warning') accumulator.warning += 1
      if (run.slaState === 'breached') accumulator.breached += 1
      if (run.slaState === 'on_track') accumulator.onTrack += 1
      return accumulator
    },
    { onTrack: 0, warning: 0, breached: 0 },
  )

  return {
    kpis: {
      activeRuns: input.runs.filter((run) => run.status === 'running').length,
      awaitingApproval: input.runs.filter((run) => run.status === 'awaiting_approval').length,
      pendingApprovals: input.approvals.length,
      agentsDegraded: input.agents.filter((agent) => agent.status !== 'active').length,
    },
    liveRuns,
    approvals: input.approvals.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)),
    agents: input.agents.sort((left, right) => left.name.localeCompare(right.name)),
    auditEvents: input.auditEvents.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    sla,
    systemHealth: input.systemHealth,
  }
}

export function resolveSlaState(startedAt: string | null, slaDueAt: string | null, now: Date): DashboardSlaState {
  if (!startedAt || !slaDueAt) return 'on_track'

  const startedAtMs = Date.parse(startedAt)
  const dueAtMs = Date.parse(slaDueAt)

  if (Number.isNaN(startedAtMs) || Number.isNaN(dueAtMs) || dueAtMs <= startedAtMs) {
    return 'on_track'
  }

  const consumed = now.getTime() - startedAtMs
  const window = dueAtMs - startedAtMs
  const percent = (consumed / window) * 100

  if (percent >= 100) return 'breached'
  if (percent >= 80) return 'warning'
  return 'on_track'
}
