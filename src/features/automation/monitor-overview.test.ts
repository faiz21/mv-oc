import { describe, expect, it } from 'vitest'
import { buildAutomationMonitorOverview } from './monitor-overview'

describe('automation monitor overview', () => {
  it('groups active runs, blocked states, heatmap rows, and error patterns', () => {
    const overview = buildAutomationMonitorOverview({
      runs: [
        {
          id: 'run-1',
          workflowId: 'workflow-1',
          workflowName: 'Daily Sync',
          status: 'running',
          entityRef: 'entity-1',
          startedAt: '2026-03-25T09:00:00.000Z',
          createdAt: '2026-03-25T09:00:00.000Z',
          slaDueAt: '2026-03-25T10:00:00.000Z',
          ownerName: 'Alex',
        },
      ],
      steps: [
        {
          id: 'step-1',
          workflowRunId: 'run-1',
          stepName: 'Collect payload',
          status: 'running',
          startedAt: '2026-03-25T09:00:00.000Z',
          completedAt: null,
          slaDueAt: '2026-03-25T09:45:00.000Z',
          executorRef: 'agent-1',
          error: null,
        },
        {
          id: 'step-2',
          workflowRunId: 'run-1',
          stepName: 'Approval gate',
          status: 'awaiting_approval',
          startedAt: '2026-03-25T09:20:00.000Z',
          completedAt: null,
          slaDueAt: '2026-03-25T09:44:00.000Z',
          executorRef: 'agent-1',
          error: null,
        },
      ],
      approvals: [{ workflowRunId: 'run-1', sourceRef: 'approval-1' }],
      agents: [
        { id: 'agent-1', name: 'Planner', status: 'active', errorRate24h: 0.12, stepsToday: 14, errorsToday: 2 },
      ],
      lessons: [
        { id: 'lesson-1', agentId: 'agent-1', lesson: 'Retry on gateway timeout', confidence: 4 },
      ],
      now: new Date('2026-03-25T09:40:00.000Z'),
    })

    expect(overview.liveRuns[0]).toMatchObject({
      runId: 'run-1',
      currentStepName: 'Approval gate',
      blockedOnApproval: true,
      slaState: 'warning',
    })
    expect(overview.kpis).toEqual({
      activeRuns: 1,
      blockedRuns: 1,
      breachedRuns: 0,
      activeAgents: 1,
    })
    expect(overview.agentHeatmap[0]).toMatchObject({
      agentName: 'Planner',
      stepsToday: 14,
      errorsToday: 2,
    })
    expect(overview.errorPatterns[0]).toMatchObject({
      lesson: 'Retry on gateway timeout',
      confidence: 4,
    })
  })
})
