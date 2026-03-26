'use client'

import { useState } from 'react'
import type { Tables } from '@/types'

type DailyEntry = Tables<'daily_entries'>

interface GratitudeArchiveProps {
  initialEntries: DailyEntry[]
}

export function GratitudeArchive({ initialEntries }: GratitudeArchiveProps) {
  const [search, setSearch] = useState('')

  const filtered = initialEntries.filter((e) => {
    const content = e.content as { text?: string }
    const text = content.text ?? ''
    return text.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search gratitude entries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-[18px] px-4 py-3 text-[13px] outline-none"
        style={{
          background: 'var(--surface-container)',
          color: 'var(--on-surface)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: '48px',
        }}
      />

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {initialEntries.length === 0
              ? 'No gratitude entries yet. Start your journey today.'
              : 'No entries match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const content = entry.content as { text?: string; recipients?: string[] }
            return (
              <div
                key={entry.id}
                className="rounded-[20px] p-4"
                style={{ background: 'var(--surface-container)' }}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {entry.date}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      background: entry.is_public
                        ? 'rgba(110,231,183,0.1)'
                        : 'rgba(255,255,255,0.06)',
                      color: entry.is_public ? 'var(--status-active)' : 'var(--on-surface-variant)',
                    }}
                  >
                    {entry.is_public ? 'Shared' : 'Private'}
                  </span>
                </div>
                <p className="text-[13px] leading-6" style={{ color: 'var(--on-surface)' }}>
                  {content.text}
                </p>
                {content.recipients && content.recipients.length > 0 && (
                  <p className="mt-2 text-[12px]" style={{ color: 'var(--primary)' }}>
                    Shoutout: {content.recipients.join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
