'use client'

import type { Tables } from '@/types'

interface UserActivityTabProps {
  entries: Tables<'audit_log'>[]
  userName: string | null
}

export function UserActivityTab({ entries, userName }: UserActivityTabProps) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-2xl px-5 py-10 text-center text-[13px]"
        style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
      >
        No activity recorded for {userName ?? 'this user'}.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'var(--surface-container-low)' }}
        >
          <div
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                {entry.event}
              </span>
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              {entry.entity_type}
              {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ''}
            </div>
            {entry.data && Object.keys(entry.data as object).length > 0 && (
              <div
                className="mt-1 truncate text-[11px]"
                style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}
              >
                {JSON.stringify(entry.data).slice(0, 120)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
