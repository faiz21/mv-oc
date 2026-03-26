'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'
import { ApprovalDecisionForm } from '@/components/approvals/ApprovalDecisionForm'
import { SlaCountdown } from '@/components/mission-control/SlaCountdown'
import { MissionControlLiveSync } from '@/components/mission-control/MissionControlLiveSync'
import type { Tables } from '@/types'
import type { ApprovalQueueSection, ApprovalSlaState } from '@/features/approvals/approval-queue'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = 'action-queue' | 'approvals'

interface MissionControlViewProps {
  actionQueue: Tables<'tasks'>[]
  approvalSections: ApprovalQueueSection[]
  approvalCounts: Record<ApprovalSlaState | 'total', number>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function readPayloadString(payload: unknown, ...keys: string[]): string | null {
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as Record<string, unknown>
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--on-surface-variant)',
  queued: 'var(--on-surface-variant)',
  running: 'var(--status-running)',
  awaiting_approval: 'var(--status-running)',
}

const GATE_TYPE_LABELS: Record<string, string> = {
  'outbound-message': 'Outbound Message',
  'task-result': 'Task Result',
  document: 'Document',
  publish: 'Publish',
  'human-input': 'Human Input',
  'result-feedback': 'Result Feedback',
}

const SLA_SECTION_STYLES: Record<ApprovalSlaState, { dot: string; bg: string }> = {
  breaching: { dot: 'var(--status-failed)', bg: 'rgba(248,113,113,0.06)' },
  due_soon: { dot: 'var(--status-running)', bg: 'rgba(251,191,36,0.06)' },
  pending: { dot: 'var(--on-surface-variant)', bg: 'transparent' },
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - Date.parse(isoString)
  if (diffMs < 0) return 'just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MissionControlView({
  actionQueue,
  approvalSections,
  approvalCounts,
}: MissionControlViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('action-queue')

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <MissionControlLiveSync />

      {/* Header */}
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          Mission Control
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Action queue and pending approvals
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="inline-flex gap-1 rounded-2xl p-1"
        style={{ background: 'var(--surface-container)' }}
      >
        <TabButton
          active={activeTab === 'action-queue'}
          onClick={() => setActiveTab('action-queue')}
          label="Action Queue"
          count={actionQueue.length}
        />
        <TabButton
          active={activeTab === 'approvals'}
          onClick={() => setActiveTab('approvals')}
          label="Approvals"
          count={approvalCounts.total}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'action-queue' ? (
        <ActionQueueTab tasks={actionQueue} />
      ) : (
        <ApprovalsTab sections={approvalSections} counts={approvalCounts} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab button                                                         */
/* ------------------------------------------------------------------ */

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-colors"
      style={{
        background: active ? 'var(--surface-container-high, rgba(255,255,255,0.08))' : 'transparent',
        color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
          style={{
            background: active ? 'var(--primary, rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.06)',
            color: active ? 'var(--on-primary, #c4b5fd)' : 'var(--on-surface-variant)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Action Queue tab                                                   */
/* ------------------------------------------------------------------ */

function ActionQueueTab({ tasks }: { tasks: Tables<'tasks'>[] }) {
  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
      >
        <p className="text-sm">No tasks in the action queue</p>
        <p className="mt-1 text-[13px] opacity-60">
          Tasks requiring attention will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <ActionQueueCard key={task.id} task={task} />
      ))}
    </div>
  )
}

function ActionQueueCard({ task }: { task: Tables<'tasks'>[] extends (infer T)[] ? T : never }) {
  const title =
    readPayloadString(task.payload, 'title', 'name', 'summary_title') ??
    readPayloadString(task.context, 'title', 'name') ??
    task.type.replace(/[_-]/g, ' ')

  const statusColor = STATUS_COLORS[task.status] ?? 'var(--on-surface-variant)'
  const statusLabel = task.status.replace(/_/g, ' ')

  return (
    <div
      className="rounded-2xl px-5 py-4 transition-colors"
      style={{ background: 'var(--surface-container)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title */}
          <p
            className="truncate text-[14px] font-medium leading-snug"
            style={{ color: 'var(--on-surface)' }}
          >
            {title}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {/* Type badge */}
            <span
              className="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {task.type.replace(/[_-]/g, ' ')}
            </span>

            {/* Assignee */}
            {task.assigned_to && (
              <span className="truncate text-[13px]">
                Assigned: {task.assigned_to.slice(0, 8)}...
              </span>
            )}

            {/* Created */}
            <span className="text-[12px] opacity-60">
              {formatRelativeTime(task.created_at)}
            </span>
          </div>
        </div>

        {/* Status pill */}
        <span
          className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-medium capitalize"
          style={{
            background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Approvals tab                                                      */
/* ------------------------------------------------------------------ */

function ApprovalsTab({
  sections,
  counts,
}: {
  sections: ApprovalQueueSection[]
  counts: Record<ApprovalSlaState | 'total', number>
}) {
  if (counts.total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
      >
        <p className="text-sm">No pending approvals</p>
        <p className="mt-1 text-[13px] opacity-60">
          Items awaiting review will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        if (section.count === 0) return null
        const style = SLA_SECTION_STYLES[section.key]

        return (
          <div key={section.key} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-2 px-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: style.dot }}
              />
              <span
                className="text-[13px] font-semibold uppercase tracking-wider"
                style={{ color: style.dot }}
              >
                {section.label}
              </span>
              <span
                className="text-[12px]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                ({section.count})
              </span>
            </div>

            {/* Items */}
            {section.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl px-5 py-4"
                style={{ background: style.bg || 'var(--surface-container)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Source type badge + title */}
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface-variant)' }}
                      >
                        {GATE_TYPE_LABELS[item.gateType] ?? item.gateType}
                      </span>
                    </div>

                    <p
                      className="text-[14px] font-medium leading-snug"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {item.title}
                    </p>

                    {/* Meta */}
                    <div
                      className="flex flex-wrap items-center gap-3 text-[13px]"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      <span>From: {item.requesterName}</span>
                      <span className="text-[12px] opacity-60">
                        Submitted {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* SLA countdown */}
                  <div className="shrink-0">
                    <SlaCountdown expiresAt={item.expiresAt} />
                  </div>
                </div>

                {/* Inline approval actions */}
                <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <ApprovalDecisionForm approvalId={item.id} compact />
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
