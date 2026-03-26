import { describe, expect, it } from 'vitest'
import { buildApprovalQueue, validateApprovalDecision, type ApprovalQueueRecord } from './approval-queue'

const NOW = new Date('2026-03-25T10:00:00.000Z')

function createRecord(overrides: Partial<ApprovalQueueRecord>): ApprovalQueueRecord {
  return {
    id: 'approval-1',
    gateType: 'document',
    status: 'awaiting_review',
    sourceRef: 'WF-001',
    createdAt: '2026-03-25T08:00:00.000Z',
    expiresAt: '2026-03-25T18:00:00.000Z',
    content: {
      title: 'Quarterly rollout brief',
      description: 'Review the generated executive summary.',
      workflow_name: 'Rollout approvals',
      step_name: 'Review document',
      entity_ref: 'ACME-42',
      requested_by_name: 'Alex',
    },
    ...overrides,
  }
}

describe('approval queue helpers', () => {
  it('groups items by SLA urgency and sorts the most urgent items first', () => {
    const queue = buildApprovalQueue(
      [
        createRecord({
          id: 'breach',
          expiresAt: '2026-03-25T09:30:00.000Z',
          createdAt: '2026-03-25T06:00:00.000Z',
        }),
        createRecord({
          id: 'soon',
          expiresAt: '2026-03-25T11:30:00.000Z',
          createdAt: '2026-03-25T07:00:00.000Z',
        }),
        createRecord({
          id: 'pending',
          expiresAt: '2026-03-25T20:00:00.000Z',
          createdAt: '2026-03-25T08:00:00.000Z',
        }),
      ],
      { now: NOW },
    )

    expect(queue.counts.total).toBe(3)
    expect(queue.sections[0]).toMatchObject({ key: 'breaching', count: 1 })
    expect(queue.sections[0].items[0]?.id).toBe('breach')
    expect(queue.sections[1]).toMatchObject({ key: 'due_soon', count: 1 })
    expect(queue.sections[1].items[0]?.id).toBe('soon')
    expect(queue.sections[2]).toMatchObject({ key: 'pending', count: 1 })
    expect(queue.sections[2].items[0]?.id).toBe('pending')
  })

  it('filters queue items by gate type and text search', () => {
    const queue = buildApprovalQueue(
      [
        createRecord({
          id: 'document-item',
          gateType: 'document',
          content: {
            title: 'Client proposal',
            description: 'Review before sending',
            workflow_name: 'Proposal flow',
            step_name: 'Review proposal',
            entity_ref: 'CLIENT-7',
            requested_by_name: 'Sarah',
          },
        }),
        createRecord({
          id: 'result-item',
          gateType: 'task-result',
          content: {
            title: 'Weekly summary',
            description: 'QA output review',
            workflow_name: 'Reporting flow',
            step_name: 'Check summary',
            entity_ref: 'REPORT-9',
            requested_by_name: 'Marcus',
          },
        }),
      ],
      {
        now: NOW,
        filters: {
          gateTypes: ['document'],
          search: 'proposal',
        },
      },
    )

    expect(queue.counts.total).toBe(1)
    expect(queue.sections.flatMap((section) => section.items).map((item) => item.id)).toEqual(['document-item'])
  })

  it('requires notes on rejection but not on approval', () => {
    expect(validateApprovalDecision('approved', '')).toEqual([])
    expect(validateApprovalDecision('rejected', '  ')).toEqual(['Rejection requires a note.'])
    expect(validateApprovalDecision('rejected', 'Needs stronger evidence.')).toEqual([])
  })
})
