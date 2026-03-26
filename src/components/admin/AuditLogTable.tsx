'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types'

interface AuditLogTableProps {
  entries: Tables<'audit_log'>[]
  total: number
  page: number
  pageSize: number
  entityTypeFilter?: string
}

const ENTITY_TYPES = [
  '',
  'profile',
  'agent_definition',
  'board_column',
  'department',
  'task',
  'audit_log',
  'environment',
  'diagnostics',
]

export function AuditLogTable({
  entries,
  total,
  page,
  pageSize,
  entityTypeFilter,
}: AuditLogTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (params.entityType) sp.set('entityType', params.entityType)
    if (params.page) sp.set('page', params.page)
    startTransition(() => {
      router.push(`/admin/audit-log?${sp.toString()}`)
    })
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (entityTypeFilter) params.set('entityType', entityTypeFilter)
      const res = await fetch(`/api/admin/audit-log/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters & Export */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={entityTypeFilter ?? ''}
          onChange={(e) => navigate({ entityType: e.target.value, page: '1' })}
          className="min-h-9 rounded-full px-3 text-[13px] outline-none"
          style={{
            background: 'var(--surface-container)',
            color: 'var(--on-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <option value="">All types</option>
          {ENTITY_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={exportCsv}
          disabled={exporting}
          className="ml-auto rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--surface-container)',
            color: 'var(--on-surface)',
          }}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]" style={{ color: 'var(--on-surface)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Time
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Event
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Entity
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Actor
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-medium">{entry.event}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--on-surface-variant)',
                        }}
                      >
                        {entry.entity_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {entry.actor_ref?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {entry.data ? JSON.stringify(entry.data).slice(0, 80) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          <span>
            {total} total entries · Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate({ entityType: entityTypeFilter ?? '', page: String(page - 1) })}
              className="rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30"
              style={{ background: 'var(--surface-container)' }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => navigate({ entityType: entityTypeFilter ?? '', page: String(page + 1) })}
              className="rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30"
              style={{ background: 'var(--surface-container)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
