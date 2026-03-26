'use client'

import { useEffect } from 'react'
import { X, AlertTriangle, Clock3, ArrowUpRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Tables } from '@/types'

type TaskRow = Tables<'tasks'>

interface TaskDetailModalProps {
  task: TaskRow | null
  onClose: () => void
}

function getTaskTone(status: string): string {
  if (status === 'failed' || status === 'rejected') return 'var(--status-failed)'
  if (status === 'running' || status === 'queued') return 'var(--tertiary)'
  if (status === 'complete' || status === 'completed' || status === 'approved')
    return 'var(--status-active)'
  return 'var(--primary)'
}

function StatCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[22px] px-4 py-4" style={{ background: 'rgba(17,19,23,0.42)' }}>
      <div
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[15px] font-semibold capitalize"
        style={{ color: tone ?? 'var(--on-surface)' }}
      >
        {value}
      </div>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] px-4 py-4" style={{ background: 'rgba(17,19,23,0.42)' }}>
      <div
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[13px] leading-7 break-words"
        style={{ color: 'var(--secondary)' }}
      >
        {value}
      </div>
    </div>
  )
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!task) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [task, onClose])

  if (!task) return null

  const tone = getTaskTone(task.status)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Task detail"
    >
      {/* Desktop: side panel from right; Mobile: bottom sheet */}
      <div
        className="absolute inset-x-0 bottom-0 top-20 overflow-auto rounded-t-[28px] px-5 py-5 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:rounded-none md:rounded-l-[28px] md:px-6 md:py-6"
        style={{ background: 'var(--surface-container-high)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--primary)' }}
            >
              Task detail
            </div>
            <h3
              className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-[-0.04em]"
              style={{ color: 'var(--on-surface)' }}
            >
              {task.type.replace(/_/g, ' ')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'rgba(17,19,23,0.45)' }}
            aria-label="Close task detail"
          >
            <X size={18} style={{ color: 'var(--on-surface)' }} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <StatCell
            label="Status"
            value={task.status.replace(/_/g, ' ')}
            tone={tone}
          />
          <StatCell
            label="Type"
            value={task.type.replace(/_/g, ' ')}
            tone="var(--primary)"
          />
          <StatCell
            label="Attempts"
            value={String(task.attempt_count)}
            tone="var(--secondary)"
          />
          <StatCell
            label="Updated"
            value={formatRelativeTime(task.updated_at)}
            tone="var(--secondary)"
          />
        </div>

        {/* Detail blocks */}
        <div className="mt-4 space-y-3">
          {task.assigned_to && (
            <DetailBlock label="Assigned To" value={task.assigned_to} />
          )}
          {task.workflow_id && (
            <DetailBlock label="Workflow" value={task.workflow_id} />
          )}
          {task.workflow_run_id && (
            <DetailBlock label="Workflow Run" value={task.workflow_run_id} />
          )}
          {task.agent_id && (
            <DetailBlock label="Agent" value={task.agent_id} />
          )}
          {task.source_ref && (
            <DetailBlock label="Source Reference" value={task.source_ref} />
          )}
          {task.correlation_id && (
            <DetailBlock label="Correlation ID" value={task.correlation_id} />
          )}
          <DetailBlock
            label="Created"
            value={new Date(task.created_at).toLocaleString()}
          />
          {task.completed_at && (
            <DetailBlock
              label="Completed"
              value={new Date(task.completed_at).toLocaleString()}
            />
          )}
          {task.error && (
            <div
              className="rounded-[22px] px-4 py-4"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <div
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--status-failed)' }}
              >
                <AlertTriangle size={11} />
                Error
              </div>
              <div
                className="mt-2 text-[13px] leading-7 break-words font-mono"
                style={{ color: 'var(--status-failed)' }}
              >
                {task.error}
              </div>
            </div>
          )}
        </div>

        {/* Audit link */}
        <div className="mt-6">
          <a
            href={`/audit-log?task_id=${task.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            View full audit trail
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}
