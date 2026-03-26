'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import { getAuditLog, getAuditLogForExport } from '@/lib/data/audit'
import type { Tables } from '@/types'
import { Download, Search } from 'lucide-react'

interface AuditLogViewerProps {
  initialEntries: Tables<'audit_log'>[]
  initialTotal: number
}

const PAGE_SIZE = 50

const EVENT_TYPES = [
  'all',
  'created',
  'approved',
  'rejected',
  'failed',
  'completed',
  'escalated',
  'paused',
]

type DateRange = 'last_hour' | 'last_24h' | 'last_7d' | 'custom'

function getDateRange(range: DateRange): { from: string; to: string } | undefined {
  const now = new Date()
  const to = now.toISOString()

  if (range === 'last_hour') {
    return {
      from: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      to,
    }
  }
  if (range === 'last_24h') {
    return {
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      to,
    }
  }
  if (range === 'last_7d') {
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to,
    }
  }
  return undefined
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function escapeCSV(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function AuditLogViewer({ initialEntries, initialTotal }: AuditLogViewerProps) {
  const [entries, setEntries] = useState<Tables<'audit_log'>[]>(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>('last_24h')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  const fetchEntries = useCallback(
    async (options: { page?: number; search?: string; event?: string; range?: DateRange }) => {
      const pg = options.page ?? page
      const sq = options.search ?? searchQuery
      const ev = options.event ?? eventTypeFilter
      const dr = options.range ?? dateRange

      setLoading(true)
      try {
        const supabase = createClient()
        const range = getDateRange(dr)
        const { entries: fresh, total: freshTotal } = await getAuditLog(supabase, {
          actorRef: sq || undefined,
          entityType: ev !== 'all' ? ev : undefined,
          dateFrom: range?.from,
          dateTo: range?.to,
          limit: PAGE_SIZE,
          offset: pg * PAGE_SIZE,
        })
        setEntries(fresh)
        setTotal(freshTotal)
        setPage(pg)
      } finally {
        setLoading(false)
      }
    },
    [page, searchQuery, eventTypeFilter, dateRange],
  )

  useDashboardRealtime({
    onAuditLogInsert: () => {
      setNewCount((n) => n + 1)
    },
  })

  function handleSearch(query: string) {
    setSearchQuery(query)
    setPage(0)
    void fetchEntries({ page: 0, search: query })
  }

  function handleEventFilter(ev: string) {
    setEventTypeFilter(ev)
    setPage(0)
    void fetchEntries({ page: 0, event: ev })
  }

  function handleDateRange(range: DateRange) {
    setDateRange(range)
    setPage(0)
    void fetchEntries({ page: 0, range })
  }

  function handleLoadNew() {
    setNewCount(0)
    setPage(0)
    void fetchEntries({ page: 0 })
  }

  async function handleExport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const range = getDateRange(dateRange)
      const all = await getAuditLogForExport(supabase, {
        actorRef: searchQuery || undefined,
        entityType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
        dateFrom: range?.from,
        dateTo: range?.to,
      })

      const header = 'task_id,workflow_id,event,actor_type,actor_ref,entity_type,entity_id,data,created_at'
      const rows = all.map((e) =>
        [
          e.task_id ?? '',
          e.workflow_id ?? '',
          e.event,
          e.actor_type,
          e.actor_ref ?? '',
          e.entity_type,
          e.entity_id,
          JSON.stringify(e.data ?? {}),
          e.created_at,
        ]
          .map(String)
          .map(escapeCSV)
          .join(','),
      )

      const csv = [header, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const now = new Date()
      const filename = `audit_log_${now.toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <DashboardPanel
      title="Audit Log"
      onRefresh={() => fetchEntries({})}
      refreshing={loading}
      actions={
        entries.length > 0 ? (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--on-surface-variant)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Download size={12} />
            Export CSV
          </button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--on-surface-variant)' }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search actor, event, entity…"
            className="w-full rounded-xl py-2 pl-8 pr-3 text-[13px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--on-surface)',
            }}
          />
        </div>

        {/* Event type */}
        <select
          value={eventTypeFilter}
          onChange={(e) => handleEventFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-[13px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--on-surface)',
          }}
        >
          {EVENT_TYPES.map((et) => (
            <option key={et} value={et}>
              {et === 'all' ? 'All Events' : et.charAt(0).toUpperCase() + et.slice(1)}
            </option>
          ))}
        </select>

        {/* Date range */}
        <select
          value={dateRange}
          onChange={(e) => handleDateRange(e.target.value as DateRange)}
          className="rounded-xl px-3 py-2 text-[13px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--on-surface)',
          }}
        >
          <option value="last_hour">Last Hour</option>
          <option value="last_24h">Last 24h</option>
          <option value="last_7d">Last 7d</option>
        </select>
      </div>

      {/* New events banner */}
      {newCount > 0 && (
        <button
          type="button"
          onClick={handleLoadNew}
          className="mb-3 w-full rounded-xl py-2 text-[12px] font-medium transition-colors hover:opacity-80"
          style={{
            background: 'rgba(255,193,116,0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(255,193,116,0.2)',
          }}
        >
          {newCount} new event{newCount > 1 ? 's' : ''} — click to load
        </button>
      )}

      {/* Result count */}
      <div
        className="mb-3 text-[12px]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {total.toLocaleString()} events found
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div
          className="py-10 text-center text-[13px]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          No audit events found
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
                {['Event', 'Entity', 'Actor', 'Data', 'Time'].map((col) => (
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
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onClick={() =>
                    setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                  }
                >
                  <td
                    className="py-2 pr-4 font-medium"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {entry.event}
                  </td>
                  <td
                    className="py-2 pr-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {entry.entity_type}
                    <span className="ml-1 font-mono text-[11px]">
                      {entry.entity_id.slice(0, 8)}
                    </span>
                  </td>
                  <td
                    className="py-2 pr-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <span className="capitalize">{entry.actor_type}</span>
                    {entry.actor_ref && (
                      <span className="ml-1 font-mono text-[11px]">
                        {entry.actor_ref.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td
                    className="max-w-[200px] py-2 pr-4"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {expandedId === entry.id ? (
                      <pre
                        className="mt-1 overflow-x-auto rounded-xl p-2 text-[11px]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--on-surface)',
                        }}
                      >
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    ) : (
                      <span className="truncate">
                        {JSON.stringify(entry.data).slice(0, 60)}…
                      </span>
                    )}
                  </td>
                  <td
                    className="py-2 tabular-nums text-[11px]"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {formatTimestamp(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => void fetchEntries({ page: page - 1 })}
            className="rounded-xl px-3 py-1.5 text-[13px] transition-colors disabled:opacity-30 hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            ← Prev
          </button>

          <span
            className="text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => void fetchEntries({ page: page + 1 })}
            className="rounded-xl px-3 py-1.5 text-[13px] transition-colors disabled:opacity-30 hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Next →
          </button>
        </div>
      )}
    </DashboardPanel>
  )
}
