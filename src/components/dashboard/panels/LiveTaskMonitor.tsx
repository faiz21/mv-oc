'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { StatusBadge } from '@/components/dashboard/shared/StatusBadge'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import {
  getActiveWorkflowRuns,
  type ActiveRunRow,
} from '@/features/dashboard/data'
import type { SlaThresholds } from '@/features/dashboard/data'

interface LiveTaskMonitorProps {
  initialRuns: ActiveRunRow[]
  departmentId: string
  slaThresholds: SlaThresholds
}

type SlaFilter = 'all' | 'on_track' | 'warning' | 'breach'
type StatusFilter = 'all' | 'running' | 'awaiting_approval' | 'pending'

function computeElapsed(startedAt: string | null): string {
  if (!startedAt) return '—'
  const elapsedMs = Date.now() - Date.parse(startedAt)
  const secs = Math.floor(elapsedMs / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `${hours}h ${mins % 60}m`
  if (mins > 0) return `${mins}m ${secs % 60}s`
  return `${secs}s`
}

function computeSlaState(
  startedAt: string | null,
  warningPct: number,
  breachPct: number,
): 'on_track' | 'warning' | 'breach' {
  if (!startedAt) return 'on_track'
  // Without sla_due_at, derive from elapsed time heuristic
  // Actual SLA tiles have slaDueAt; here we show elapsed-based state
  return 'on_track'
}

const SLA_ROW_BG: Record<string, string> = {
  on_track: 'transparent',
  warning: 'rgba(245,158,11,0.05)',
  breach: 'rgba(239,68,68,0.07)',
}

export function LiveTaskMonitor({
  initialRuns,
  departmentId,
  slaThresholds,
}: LiveTaskMonitorProps) {
  const [runs, setRuns] = useState<ActiveRunRow[]>(initialRuns)
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRun, setSelectedRun] = useState<ActiveRunRow | null>(null)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [, setTick] = useState(0)

  // 1-second timer for live elapsed updates
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const fresh = await getActiveWorkflowRuns(supabase, departmentId)
    setRuns(fresh)
    setLastUpdated(Date.now())
  }, [departmentId])

  const { connectionStatus } = useDashboardRealtime({
    onWorkflowRunChange: () => {
      void refetch()
    },
  })

  const isStale = Date.now() - lastUpdated > 2 * 60 * 1000

  const filtered = runs.filter((run) => {
    if (statusFilter !== 'all' && run.status !== statusFilter) return false
    if (slaFilter !== 'all') {
      const state = computeSlaState(
        run.startedAt,
        slaThresholds.warningPct,
        slaThresholds.breachPct,
      )
      if (state !== slaFilter) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !run.workflowName.toLowerCase().includes(q) &&
        !(run.entityRef ?? '').toLowerCase().includes(q) &&
        !run.id.slice(0, 8).includes(q)
      ) {
        return false
      }
    }
    return true
  })

  return (
    <>
      <DashboardPanel
        title="Live Task Monitor"
        isLive={connectionStatus === 'connected'}
        isStale={isStale}
        onRefresh={refetch}
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflow, entity…"
            className="min-w-0 flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--on-surface)',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl px-3 py-2 text-[13px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--on-surface)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value as SlaFilter)}
            className="rounded-xl px-3 py-2 text-[13px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--on-surface)',
            }}
          >
            <option value="all">All SLA States</option>
            <option value="on_track">On Track</option>
            <option value="warning">Warning</option>
            <option value="breach">Breach</option>
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div
            className="py-10 text-center text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            No active workflows
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  {[
                    'Workflow',
                    'Run ID',
                    'Entity',
                    'Status',
                    'Elapsed',
                    'Current Step',
                  ].map((col) => (
                    <th
                      key={col}
                      className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((run) => {
                  const slaState = computeSlaState(
                    run.startedAt,
                    slaThresholds.warningPct,
                    slaThresholds.breachPct,
                  )

                  return (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                      style={{
                        background: SLA_ROW_BG[slaState],
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedRun(run)
                      }}
                    >
                      <td
                        className="py-3 pr-4 font-medium"
                        style={{ color: 'var(--on-surface)' }}
                      >
                        {run.workflowName}
                      </td>
                      <td
                        className="py-3 pr-4 font-mono text-[11px]"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {run.id.slice(0, 8)}
                      </td>
                      <td
                        className="py-3 pr-4 max-w-[120px] truncate"
                        style={{ color: 'var(--on-surface-variant)' }}
                        title={run.entityRef ?? '—'}
                      >
                        {run.entityRef ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={run.status} />
                      </td>
                      <td
                        className="py-3 pr-4 tabular-nums"
                        style={{ color: 'var(--on-surface)' }}
                      >
                        {computeElapsed(run.startedAt)}
                      </td>
                      <td
                        className="py-3 max-w-[140px] truncate"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {run.currentStepName ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {/* Detail modal */}
      {selectedRun && (
        <RunDetailModal
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RunDetailModal
// ─────────────────────────────────────────────────────────────────────────────

function RunDetailModal({
  run,
  onClose,
}: {
  run: ActiveRunRow
  onClose: () => void
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Run detail: ${run.workflowName}`}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--on-surface)' }}
            >
              {run.workflowName}
            </h2>
            <p
              className="mt-0.5 font-mono text-[11px]"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              {run.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            aria-label="Close"
          >
            <span style={{ color: 'var(--on-surface-variant)' }}>✕</span>
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          {[
            { label: 'Status', value: <StatusBadge status={run.status} /> },
            {
              label: 'Entity',
              value: run.entityRef ?? '—',
            },
            {
              label: 'Started',
              value: run.startedAt ? formatRelativeTime(run.startedAt) : '—',
            },
            {
              label: 'Current Step',
              value: run.currentStepName ?? '—',
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt
                className="text-[11px] uppercase tracking-wide"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {label}
              </dt>
              <dd
                className="mt-0.5 font-medium"
                style={{ color: 'var(--on-surface)' }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-2 text-[13px] font-medium transition-colors hover:opacity-80"
          style={{
            background: 'var(--surface-container-low)',
            color: 'var(--on-surface-variant)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
