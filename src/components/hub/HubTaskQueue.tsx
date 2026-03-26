'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowUpRight, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'
import { TaskDetailModal } from '@/components/hub/TaskDetailModal'
import type { HubTask } from '@/components/hub/types'
import type { Tables } from '@/types'

/* ------------------------------------------------------------------ */
/*  Legacy prop-driven interface (kept for backward compatibility)     */
/* ------------------------------------------------------------------ */

interface HubTaskQueueProps {
  /** If provided, uses prop-driven mode (backward compat with RSC page) */
  tasks?: HubTask[]
}

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
]

type SortOrder = 'newest' | 'oldest' | 'priority'

function getTaskTone(status: string) {
  if (status === 'failed' || status === 'rejected') return 'var(--status-failed)'
  if (status === 'running' || status === 'queued') return 'var(--tertiary)'
  if (status === 'complete' || status === 'completed' || status === 'approved')
    return 'var(--status-active)'
  return 'var(--primary)'
}

/* ------------------------------------------------------------------ */
/*  Inner list (used by both prop-driven and context-driven modes)     */
/* ------------------------------------------------------------------ */

function TaskList({ tasks }: { tasks: Tables<'tasks'>[] }) {
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [page, setPage] = useState(0)

  // Filter
  const filtered = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'newest') return b.updated_at.localeCompare(a.updated_at)
    if (sortOrder === 'oldest') return a.updated_at.localeCompare(b.updated_at)
    // priority: sort by status severity then date
    const statusOrder = ['failed', 'running', 'queued', 'awaiting_approval', 'pending', 'complete', 'completed']
    const aIdx = statusOrder.indexOf(a.status)
    const bIdx = statusOrder.indexOf(b.status)
    if (aIdx !== bIdx) return aIdx - bIdx
    return b.updated_at.localeCompare(a.updated_at)
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleFilterChange(status: string) {
    setStatusFilter(status)
    setPage(0)
  }

  function handleSortChange(sort: SortOrder) {
    setSortOrder(sort)
    setPage(0)
  }

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-[28px] px-5 py-10 text-center"
        style={{ background: 'rgba(17,19,23,0.5)' }}
      >
        <div
          className="font-display text-[24px] font-semibold tracking-[-0.04em]"
          style={{ color: 'var(--on-surface)' }}
        >
          Nothing in your queue
        </div>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--secondary)' }}>
          You have no assigned tasks right now.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Filters & sort controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-xl px-3 py-1.5 text-[12px] outline-none"
          style={{
            background: 'rgba(17,19,23,0.5)',
            color: 'var(--on-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['newest', 'oldest', 'priority'] as SortOrder[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSortChange(opt)}
              className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors"
              style={{
                background: sortOrder === opt ? 'rgba(255,255,255,0.1)' : 'rgba(17,19,23,0.5)',
                color: sortOrder === opt ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        <span
          className="ml-auto text-[11px] tabular-nums"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {pageItems.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-6 text-center text-[13px]"
            style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--secondary)' }}
          >
            No tasks match this filter
          </div>
        ) : (
          pageItems.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTask(task)}
              className="group relative flex w-full items-start gap-4 rounded-[24px] px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
              style={{ background: 'rgba(17,19,23,0.5)' }}
            >
              <span
                className="absolute bottom-3 left-0 top-3 w-[1.5px] rounded-full"
                style={{ background: getTaskTone(task.status) }}
              />
              <div
                className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-[11px] font-semibold uppercase"
                style={{
                  background: `color-mix(in srgb, ${getTaskTone(task.status)} 14%, transparent)`,
                  color: getTaskTone(task.status),
                }}
              >
                {task.type.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="truncate font-display text-[17px] font-semibold tracking-[-0.03em]"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {task.type.replace(/_/g, ' ')}
                    </div>
                    {task.source_ref && (
                      <div
                        className="mt-1 flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-[0.14em]"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        <span className="truncate">{task.source_ref}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      background: `color-mix(in srgb, ${getTaskTone(task.status)} 14%, transparent)`,
                      color: getTaskTone(task.status),
                    }}
                  >
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div
                  className="mt-3 flex flex-wrap items-center gap-3 text-[12px]"
                  style={{ color: 'var(--secondary)' }}
                >
                  <span>Updated {formatRelativeTime(task.updated_at)}</span>
                  {task.error && (
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: 'var(--status-failed)' }}
                    >
                      <AlertTriangle size={12} />
                      Needs attention
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="mt-1 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: 'var(--primary)' }}
              />
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
            style={{ background: 'rgba(17,19,23,0.5)' }}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} style={{ color: 'var(--on-surface)' }} />
          </button>
          <span className="text-[12px] tabular-nums" style={{ color: 'var(--on-surface-variant)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
            style={{ background: 'rgba(17,19,23,0.5)' }}
            aria-label="Next page"
          >
            <ChevronRight size={16} style={{ color: 'var(--on-surface)' }} />
          </button>
        </div>
      )}

      {/* Task detail modal */}
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Context-driven version (default export used in new Hub page)       */
/* ------------------------------------------------------------------ */

export function HubMyQueue() {
  const { tasks, errors, refreshTasks } = useHubRealtime()

  if (errors.tasks) {
    return (
      <div
        className="rounded-2xl px-5 py-6 text-center text-[13px]"
        style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--status-failed)' }}
      >
        Failed to load tasks.{' '}
        <button type="button" onClick={refreshTasks} className="underline">
          Retry
        </button>
      </div>
    )
  }

  return <TaskList tasks={tasks} />
}

/* ------------------------------------------------------------------ */
/*  Legacy prop-driven component (backward compat)                     */
/* ------------------------------------------------------------------ */

export function HubTaskQueue({ tasks }: HubTaskQueueProps) {
  const [selectedTask, setSelectedTask] = useState<HubTask | null>(null)

  if (!tasks || tasks.length === 0) {
    return (
      <div
        className="rounded-[28px] px-5 py-10 text-center"
        style={{ background: 'rgba(17,19,23,0.5)' }}
      >
        <div
          className="font-display text-[24px] font-semibold tracking-[-0.04em]"
          style={{ color: 'var(--on-surface)' }}
        >
          Nothing in your queue
        </div>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--secondary)' }}>
          You have no assigned tasks right now. Use the dashboard or workflow library if you want to
          inspect broader system activity.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => setSelectedTask(task)}
            className="group relative flex w-full items-start gap-4 rounded-[24px] px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(17,19,23,0.5)' }}
          >
            <span
              className="absolute bottom-3 left-0 top-3 w-[1.5px] rounded-full"
              style={{ background: getTaskTone(task.status) }}
            />
            <div
              className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-[11px] font-semibold uppercase"
              style={{
                background: `color-mix(in srgb, ${getTaskTone(task.status)} 14%, transparent)`,
                color: getTaskTone(task.status),
              }}
            >
              {task.status.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="truncate font-display text-[19px] font-semibold tracking-[-0.03em]"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {task.title}
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-[0.14em]"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <span>{task.type.replace(/_/g, ' ')}</span>
                    <span aria-hidden="true">/</span>
                    <span>{task.sourceRef ?? 'Manual assignment'}</span>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    background: `color-mix(in srgb, ${getTaskTone(task.status)} 14%, transparent)`,
                    color: getTaskTone(task.status),
                  }}
                >
                  {task.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div
                className="mt-4 flex flex-wrap items-center gap-3 text-[13px]"
                style={{ color: 'var(--secondary)' }}
              >
                <span>Updated {formatRelativeTime(task.updatedAt)}</span>
                {task.dueAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={13} />
                    Due {formatRelativeTime(task.dueAt)}
                  </span>
                ) : null}
                {task.error ? (
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: 'var(--status-failed)' }}
                  >
                    <AlertTriangle size={13} />
                    Needs attention
                  </span>
                ) : null}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="mt-1 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--primary)' }}
            />
          </button>
        ))}
      </div>

      {selectedTask ? (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 top-20 overflow-auto rounded-t-[28px] px-5 py-5 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:rounded-none md:rounded-l-[28px] md:px-6 md:py-6"
            style={{ background: 'var(--surface-container-high)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: 'var(--primary)' }}
                >
                  Task detail
                </div>
                <h3
                  className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.05em]"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(17,19,23,0.45)' }}
                aria-label="Close task detail"
              >
                <X size={18} style={{ color: 'var(--on-surface)' }} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailStat
                label="Status"
                value={selectedTask.status.replace(/_/g, ' ')}
                tone={getTaskTone(selectedTask.status)}
              />
              <DetailStat label="Priority" value={`P${selectedTask.priority}`} tone="var(--primary)" />
              <DetailStat
                label="Type"
                value={selectedTask.type.replace(/_/g, ' ')}
                tone="var(--secondary)"
              />
              <DetailStat
                label="Updated"
                value={formatRelativeTime(selectedTask.updatedAt)}
                tone="var(--secondary)"
              />
            </div>

            <div className="mt-6 space-y-4">
              <DetailBlock
                label="Source reference"
                value={selectedTask.sourceRef ?? 'No source reference attached'}
              />
              <DetailBlock
                label="Workflow reference"
                value={selectedTask.workflowId ?? 'Not linked to a workflow record'}
              />
              <DetailBlock
                label="Agent reference"
                value={selectedTask.agentId ?? 'No agent assigned yet'}
              />
              <DetailBlock
                label="Due"
                value={
                  selectedTask.dueAt
                    ? new Date(selectedTask.dueAt).toLocaleString()
                    : 'No due date defined'
                }
              />
              <DetailBlock
                label="Error context"
                value={
                  selectedTask.error ??
                  'No error recorded for this task. The latest result should be visible in downstream workflow or dashboard views.'
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function DetailStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[22px] px-4 py-4" style={{ background: 'rgba(17,19,23,0.42)' }}>
      <div
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </div>
      <div className="mt-2 text-[16px] font-semibold capitalize" style={{ color: tone }}>
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
      <div className="mt-2 text-[14px] leading-7" style={{ color: 'var(--secondary)' }}>
        {value}
      </div>
    </div>
  )
}
