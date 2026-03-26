export type ApprovalGateType = 'outbound-message' | 'task-result' | 'document' | 'publish' | 'human-input' | 'result-feedback'
export type ApprovalStatus = 'awaiting_review' | 'approved' | 'rejected' | 'expired'
export type ApprovalSlaState = 'breaching' | 'due_soon' | 'pending'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  options?: string[]
}

export interface ApprovalQueueRecord {
  id: string
  gateType: ApprovalGateType
  status: ApprovalStatus
  sourceRef: string
  createdAt: string
  expiresAt: string | null
  content: Record<string, unknown> | null
}

export interface ApprovalQueueFilters {
  gateTypes?: ApprovalGateType[]
  search?: string
}

export interface ApprovalQueueItem {
  id: string
  gateType: ApprovalGateType
  title: string
  summary: string
  workflowName: string
  stepName: string
  entityRef: string
  requesterName: string
  sourceRef: string
  createdAt: string
  expiresAt: string | null
  slaState: ApprovalSlaState
  sortTimestamp: number
  contentRaw: Record<string, unknown>
}

export interface ApprovalQueueSection {
  key: ApprovalSlaState
  label: string
  count: number
  items: ApprovalQueueItem[]
}

export function buildApprovalQueue(
  records: ApprovalQueueRecord[],
  options?: {
    now?: Date
    filters?: ApprovalQueueFilters
  },
): {
  counts: Record<ApprovalSlaState | 'total', number>
  sections: ApprovalQueueSection[]
} {
  const now = options?.now ?? new Date()
  const filters = options?.filters
  const normalizedSearch = filters?.search?.trim().toLowerCase() ?? ''

  const items = records
    .filter((record) => record.status === 'awaiting_review')
    .filter((record) => !filters?.gateTypes?.length || filters.gateTypes.includes(record.gateType))
    .map((record) => buildApprovalQueueItem(record, now))
    .filter((item) => {
      if (!normalizedSearch) return true

      return [
        item.title,
        item.summary,
        item.workflowName,
        item.stepName,
        item.entityRef,
        item.requesterName,
        item.sourceRef,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    })

  const sections: ApprovalQueueSection[] = [
    createSection('breaching', 'Breaching SLA', items),
    createSection('due_soon', 'Due Soon', items),
    createSection('pending', 'Pending', items),
  ]

  return {
    counts: {
      total: items.length,
      breaching: sections[0].count,
      due_soon: sections[1].count,
      pending: sections[2].count,
    },
    sections,
  }
}

export function validateApprovalDecision(decision: 'approved' | 'rejected', notes: string) {
  const errors: string[] = []

  if (decision === 'rejected' && !notes.trim()) {
    errors.push('Rejection requires a note.')
  }

  return errors
}

export function getApprovalSlaState(expiresAt: string | null, now: Date): ApprovalSlaState {
  if (!expiresAt) return 'pending'

  const expiresAtMs = Date.parse(expiresAt)
  if (Number.isNaN(expiresAtMs)) return 'pending'

  const diffMs = expiresAtMs - now.getTime()
  if (diffMs <= 0) return 'breaching'
  if (diffMs <= 4 * 60 * 60 * 1000) return 'due_soon'
  return 'pending'
}

function buildApprovalQueueItem(record: ApprovalQueueRecord, now: Date): ApprovalQueueItem {
  const content = record.content ?? {}

  return {
    id: record.id,
    gateType: record.gateType,
    title:
      readString(content.title) ??
      readString(content.name) ??
      readString(content.summary_title) ??
      record.sourceRef,
    summary:
      readString(content.description) ??
      readString(content.summary) ??
      readString(content.message) ??
      'Review the generated output before the workflow resumes.',
    workflowName:
      readString(content.workflow_name) ??
      readString(content.workflow_label) ??
      'Workflow runtime',
    stepName:
      readString(content.step_name) ??
      readString(content.activity_name) ??
      record.gateType.replace(/-/g, ' '),
    entityRef:
      readString(content.entity_ref) ??
      readString(content.entity_name) ??
      readString(content.project_name) ??
      record.sourceRef,
    requesterName:
      readString(content.requested_by_name) ??
      readString(content.generated_by) ??
      'Workflow runtime',
    sourceRef: record.sourceRef,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    slaState: getApprovalSlaState(record.expiresAt, now),
    sortTimestamp: Date.parse(record.expiresAt ?? record.createdAt),
    contentRaw: content,
  }
}

function createSection(key: ApprovalSlaState, label: string, items: ApprovalQueueItem[]): ApprovalQueueSection {
  const sectionItems = items
    .filter((item) => item.slaState === key)
    .sort((left, right) => left.sortTimestamp - right.sortTimestamp)

  return {
    key,
    label,
    count: sectionItems.length,
    items: sectionItems,
  }
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}
