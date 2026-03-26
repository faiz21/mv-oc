import { describe, expect, it } from 'vitest'
import { buildDashboardOverview } from './dashboard-overview'

const NOW = new Date('2026-03-25T10:00:00.000Z')

describe('dashboard overview helpers', () => {
  it('computes workflow and SLA summary counts from live runtime data', () => {
    const overview = buildDashboardOverview(
      {
        runs: [
          {
            id: 'run-1',
            workflowId: 'wf-1',
            workflowName: 'Client Intake',
            status: 'running',
            entityRef: 'CLIENT-1',
            startedAt: '2026-03-25T09:00:00.000Z',
            createdAt: '2026-03-25T09:00:00.000Z',
          },
          {
            id: 'run-2',
            workflowId: 'wf-2',
            workflowName: 'Proposal Review',
            status: 'awaiting_approval',
            entityRef: 'PROP-2',
            startedAt: '2026-03-25T07:00:00.000Z',
            createdAt: '2026-03-25T07:00:00.000Z',
          },
        ],
        steps: [
          {
            id: 'step-1',
            workflowRunId: 'run-1',
            stepName: 'Draft brief',
            status: 'running',
            slaDueAt: '2026-03-25T10:10:00.000Z',
            startedAt: '2026-03-25T09:00:00.000Z',
          },
          {
            id: 'step-2',
            workflowRunId: 'run-2',
            stepName: 'Await review',
            status: 'awaiting_approval',
            slaDueAt: '2026-03-25T09:30:00.000Z',
            startedAt: '2026-03-25T08:00:00.000Z',
          },
        ],
        approvals: [
          { id: 'approval-1', gateType: 'document', createdAt: '2026-03-25T08:15:00.000Z', assignedReviewerName: 'Alex' },
          { id: 'approval-2', gateType: 'task-result', createdAt: '2026-03-25T09:45:00.000Z', assignedReviewerName: 'Sarah' },
        ],
        agents: [
          { id: 'agent-1', name: 'Main Agent', status: 'active', errorRate24h: 0.05, lastSeen: '2026-03-25T09:59:00.000Z' },
          { id: 'agent-2', name: 'Review Agent', status: 'unreachable', errorRate24h: 0.4, lastSeen: '2026-03-25T08:00:00.000Z' },
        ],
        auditEvents: [{ id: 1, event: 'approval:approved', entityType: 'approval_queue', createdAt: '2026-03-25T09:58:00.000Z' }],
        systemHealth: {
          queueDepth: 5,
          gatewayStatus: 'degraded',
          gatewayLatencyMs: 280,
          automationActive: 3,
        },
      },
      { now: NOW },
    )

    expect(overview.kpis.activeRuns).toBe(1)
    expect(overview.kpis.awaitingApproval).toBe(1)
    expect(overview.kpis.pendingApprovals).toBe(2)
    expect(overview.kpis.agentsDegraded).toBe(1)
    expect(overview.sla.warning).toBe(1)
    expect(overview.sla.breached).toBe(1)
    expect(overview.liveRuns[0]).toMatchObject({
      runId: 'run-1',
      workflowName: 'Client Intake',
      currentStepName: 'Draft brief',
      slaState: 'warning',
    })
  })
})
