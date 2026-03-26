'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import type { ChangelogEntry } from '@/features/feedback-hub/feedback-data'

interface ChangelogSectionProps {
  entries: ChangelogEntry[]
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  idea: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)' },
  problem: { bg: 'rgba(248,113,113,0.12)', text: 'var(--status-failed)' },
  request: { bg: 'rgba(96,165,250,0.10)', text: '#60A5FA' },
  general: { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)' },
}

function getCategoryStyle(category: string | null) {
  if (!category) return { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)' }
  return CATEGORY_COLORS[category.toLowerCase()] ?? { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)' }
}

export function ChangelogSection({ entries }: ChangelogSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // Unique categories for filter
  const categories = Array.from(new Set(entries.map(e => e.category).filter(Boolean))) as string[]

  const filtered = entries.filter(entry => {
    if (categoryFilter && entry.category !== categoryFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return entry.title.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q)
    }
    return true
  })

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <BookOpen size={32} style={{ color: 'var(--on-surface-variant)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>No changelog entries yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2 flex-1 rounded-[14px] px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search size={14} style={{ color: 'var(--on-surface-variant)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search changelog..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--on-surface)' }}
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter(null)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: !categoryFilter ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
                color: !categoryFilter ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              All
            </button>
            {categories.map(cat => {
              const style = getCategoryStyle(cat)
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium capitalize"
                  style={{
                    background: categoryFilter === cat ? style.bg : 'rgba(255,255,255,0.04)',
                    color: categoryFilter === cat ? style.text : 'var(--on-surface-variant)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          No entries match your search
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const expanded = expandedId === entry.id
            const catStyle = getCategoryStyle(entry.category)

            return (
              <div
                key={entry.id}
                className="rounded-[18px] overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.category && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                          style={{ background: catStyle.bg, color: catStyle.text }}
                        >
                          {entry.category}
                        </span>
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                        {entry.title}
                      </span>
                    </div>

                    {!expanded && (
                      <p className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>
                        {entry.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {entry.publishedAt ? formatDate(entry.publishedAt) : 'Unpublished'}
                      </span>
                      {entry.relatedFeedback && entry.relatedFeedback.length > 0 && (
                        <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                          · {entry.relatedFeedback.length} linked feedback item{entry.relatedFeedback.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {expanded ? (
                    <ChevronDown size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0, marginTop: 4 }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </button>

                {expanded && (
                  <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="pt-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
                      {entry.description}
                    </p>
                    {entry.relatedFeedback && entry.relatedFeedback.length > 0 && (
                      <p className="mt-3 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                        This entry addresses {entry.relatedFeedback.length} feedback item{entry.relatedFeedback.length !== 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
