'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ForceReleaseButton } from './ForceReleaseButton'
import type { Tables } from '@/types'

interface TaskQueueTableProps {
  tasks: Tables<'tasks'>[]
  total: number
  page: number
  pageSize: number
  statusFilter?: string
  isAdmin: boolean
}

const STATUS_TABS = ['', 'pending', 'running', 'blocked', 'failed', 'completed']

const statusColor: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)' },
  running: { bg: 'rgba(147,197,253,0.14)', text: 'rgb(147,197,253)' },
  blocked: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
  failed: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
  completed: { bg: 'rgba(167,243,208,0.14)', text: 'rgb(167,243,208)' },
}

export function TaskQueueTable({
  tasks,
  total,
  page,
  pageSize,
  statusFilter,
  isAdmin,
}: TaskQueueTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const totalPages = Math.ceil(total / pageSize)

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (params.status) sp.set('status', params.status)
    if (params.page) sp.set('page', params.page)
    startTransition(() => {
      router.push(`/admin/queue?${sp.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => navigate({ status: s, page: '1' })}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: (statusFilter ?? '') === s ? 'var(--primary)' : 'var(--surface-container)',
              color: (statusFilter ?? '') === s ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {s || 'All'}
          </button>
        ))}
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
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>ID</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Type</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Status</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Attempts</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Updated</th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const colors = statusColor[task.status] ?? { bg: 'rgba(255,255,255,0.06)', text: 'var(--on-surface-variant)' }
                  const isStuck = task.status === 'running' || task.status === 'blocked'

                  return (
                    <tr
                      key={task.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3 font-mono text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {task.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 font-medium">{task.type}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {task.attempt_count}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {new Date(task.updated_at).toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          {isStuck && (
                            <ForceReleaseButton taskId={task.id} taskType={task.type} />
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          <span>
            {total} tasks · Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate({ status: statusFilter ?? '', page: String(page - 1) })}
              className="rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30"
              style={{ background: 'var(--surface-container)' }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => navigate({ status: statusFilter ?? '', page: String(page + 1) })}
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
