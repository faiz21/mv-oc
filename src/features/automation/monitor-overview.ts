import { resolveSlaState, type DashboardSlaState } from '@/features/dashboard/dashboard-overview'

export interface MonitorRunRecord {
  id: string
  workflowId: string
  workflowName: string
  status: string
  entityRef: string | null
  startedAt: string | null
  createdAt: string
  slaDueAt: string | null
  ownerName: string | null
}

export interface MonitorStepRecord {
  id: string
  workflowRunId: string
  stepName: string
  status: string
  startedAt: string | null
  completedAt: string | null
  slaDueAt: string | null
  executorRef: string | null
  error: string | null
}

export interface MonitorApprovalRecord {
  workflowRunId: string | null
  sourceRef: string
}

export interface MonitorAgentRecord {
  id: string
  name: string
  status: string
  errorRate24h: number | null
  stepsToday: number
  errorsToday: number
}

export interface MonitorLessonRecord {
  id: string
  agentId: string | null
  lesson: string
  confidence: number
}

export function buildAutomationMonitorOverview(input: {
  runs: MonitorRunRecord[]
  steps: MonitorStepRecord[]
  approvals: MonitorApprovalRecord[]
  agents: MonitorAgentRecord[]
  lessons: MonitorLessonRecord[]
  now?: Date
}) {
  const now = input.now ?? new Date()
  const stepsByRun = new Map<string, MonitorStepRecord[]>()
  const approvalsByRun = new Set(input.approvals.map((item) => item.workflowRunId).filter(Boolean))

  for (const step of input.steps) {
    const list = stepsByRun.get(step.workflowRunId) ?? []
    list.push(step)
    stepsByRun.set(step.workflowRunId, list)
  }

  const liveRuns = input.runs
    .map((run) => {
      const steps = [...(stepsByRun.get(run.id) ?? [])].sort((left, right) => {
        return Date.parse(right.startedAt ?? right.slaDueAt ?? right.completedAt ?? run.createdAt)
          - Date.parse(left.startedAt ?? left.slaDueAt ?? left.completedAt ?? run.createdAt)
      })
      const currentStep = steps[0]
      const blockedOnApproval = approvalsByRun.has(run.id) || currentStep?.status === 'awaiting_approval'
      const slaState = resolveSlaState(currentStep?.startedAt ?? run.startedAt, currentStep?.slaDueAt ?? run.slaDueAt ?? null, now)

      return {
        runId: run.id,
        workflowName: run.workflowName,
        entityRef: run.entityRef,
        ownerName: run.ownerName,
        status: run.status,
        currentStepName: currentStep?.stepName ?? 'Awaiting start',
        currentStepStatus: currentStep?.status ?? 'pending',
        currentStepError: currentStep?.error ?? null,
        blockedOnApproval,
        slaState,
        slaDueAt: run.slaDueAt,
        startedAt: run.startedAt,
        createdAt: run.createdAt,
        steps,
      }
    })
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

  const breachedRuns = liveRuns.filter((run) => run.slaState === 'breached').length
  const blockedRuns = liveRuns.filter((run) => run.blockedOnApproval).length

  return {
    kpis: {
      activeRuns: liveRuns.length,
      blockedRuns,
      breachedRuns,
      activeAgents: input.agents.filter((agent) => agent.status === 'active').length,
    },
    liveRuns,
    agentHeatmap: [...input.agents].sort((left, right) => right.stepsToday - left.stepsToday).map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      status: agent.status,
      stepsToday: agent.stepsToday,
      errorsToday: agent.errorsToday,
      errorRate24h: agent.errorRate24h ?? 0,
    })),
    errorPatterns: [...input.lessons].sort((left, right) => right.confidence - left.confidence).map((lesson) => ({
      lessonId: lesson.id,
      lesson: lesson.lesson,
      confidence: lesson.confidence,
      agentId: lesson.agentId,
    })),
  }
}

export function monitorStateTone(state: DashboardSlaState) {
  if (state === 'breached') return { background: 'rgba(248,113,113,0.14)', color: 'var(--status-failed)' }
  if (state === 'warning') return { background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }
  return { background: 'rgba(110,231,183,0.14)', color: 'var(--status-active)' }
}
