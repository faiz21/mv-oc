'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Search, X, Filter } from 'lucide-react'
import type { FeedbackItem, FeedbackCategory, FeedbackStatus } from '@/features/feedback-hub/feedback-data'
import { ANONYMOUS_DISPLAY_NAME } from '@/features/feedback-hub/feedback-data'
import { FeedbackDetail } from './FeedbackDetail'

// ─── Category badge styles ────────────────────────────────────────────────────
const CATEGORY_BADGE: Record<FeedbackCategory, { bg: string; text: string; label: string }> = {
  idea: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)', label: 'Idea' },
  problem: { bg: 'rgba(248,113,113,0.12)', text: 'var(--status-failed)', label: 'Problem' },
  request: { bg: 'rgba(96,165,250,0.10)', text: '#60A5FA', label: 'Request' },
  general: { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)', label: 'General' },
}

const STATUS_BADGE: Record<FeedbackStatus, { bg: string; text: string; label: string }> = {
  received: { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)', label: 'Received' },
  under_review: { bg: 'rgba(96,165,250,0.10)', text: '#60A5FA', label: 'Under Review' },
  responded: { bg: 'rgba(110,231,183,0.10)', text: 'var(--status-active)', label: 'Responded' },
  closed: { bg: 'rgba(148,163,184,0.06)', text: 'var(--secondary)', label: 'Closed' },
}

const CATEGORIES: FeedbackCategory[] = ['idea', 'problem', 'request', 'general']
const STATUSES: FeedbackStatus[] = ['received', 'under_review', 'responded', 'closed']

// ─── Submitter display name ───────────────────────────────────────────────────
// Anonymous rows: userId === null → always show hardcoded ANONYMOUS_DISPLAY_NAME.
// Named rows: show userId (in real app would resolve to profile name; here we
// rely on the page passing pre-resolved names via items prop).
function displayName(item: FeedbackItem): string {
  return item.userId === null ? ANONYMOUS_DISPLAY_NAME : 'Team Member'
}

function isAnonymous(item: FeedbackItem): boolean {
  return item.userId === null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FeedbackInboxProps {
  items: FeedbackItem[]
}

export function FeedbackInbox({ items }: FeedbackInboxProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | null>(null)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const selectedItem = items.find(i => i.id === selectedId) ?? null

  function refresh() {
    startTransition(() => router.refresh())
  }

  // Filter logic (AND)
  const filtered = items.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false
    if (statusFilter && item.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const inContent = item.content.toLowerCase().includes(q)
      // Only search submitter name for named submissions
      const inName = !isAnonymous(item) && displayName(item).toLowerCase().includes(q)
      if (!inContent && !inName) return false
    }
    return true
  })

  // Sort: active first, closed last
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'closed' && b.status !== 'closed') return 1
    if (b.status === 'closed' && a.status !== 'closed') return -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  function clearFilters() {
    setSearch('')
    setCategoryFilter(null)
    setStatusFilter(null)
  }

  const hasFilters = !!search || !!categoryFilter || !!statusFilter

  return (
    <div className="flex h-full gap-0">
      {/* ── List panel ── */}
      <div
        className={`flex flex-col min-w-0 ${selectedItem ? 'hidden lg:flex lg:w-[380px] lg:flex-shrink-0' : 'w-full'}`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Search + filter bar */}
        <div className="flex-shrink-0 px-4 py-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2">
            <div
              className="flex items-center gap-2 flex-1 rounded-[14px] px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search feedback..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--on-surface)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: 'var(--on-surface-variant)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 rounded-[14px] px-3 py-2 text-xs font-medium"
              style={{
                background: showFilters ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
                color: showFilters ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: `1px solid ${showFilters ? 'rgba(255,193,116,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <Filter size={12} />
              Filter
            </button>
          </div>

          {showFilters && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] uppercase tracking-widest w-full" style={{ color: 'var(--on-surface-variant)' }}>Category</span>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: categoryFilter === cat ? CATEGORY_BADGE[cat].bg : 'rgba(255,255,255,0.04)',
                      color: categoryFilter === cat ? CATEGORY_BADGE[cat].text : 'var(--on-surface-variant)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {CATEGORY_BADGE[cat].label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] uppercase tracking-widest w-full" style={{ color: 'var(--on-surface-variant)' }}>Status</span>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: statusFilter === s ? STATUS_BADGE[s].bg : 'rgba(255,255,255,0.04)',
                      color: statusFilter === s ? STATUS_BADGE[s].text : 'var(--on-surface-variant)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {STATUS_BADGE[s].label}
                  </button>
                ))}
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs underline" style={{ color: 'var(--on-surface-variant)' }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex-shrink-0 px-4 py-2">
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            {sorted.length} item{sorted.length !== 1 ? 's' : ''}
            {hasFilters ? ' (filtered)' : ''}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {hasFilters ? 'No feedback matches your filters' : 'No feedback submitted yet'}
              </p>
            </div>
          ) : (
            sorted.map(item => (
              <FeedbackListRow
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedItem ? (
        <div className="flex-1 min-w-0 overflow-y-auto">
          <FeedbackDetail
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onUpdate={refresh}
          />
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Select a feedback item to view details
          </p>
        </div>
      )}
    </div>
  )
}

// ─── List row ─────────────────────────────────────────────────────────────────

function FeedbackListRow({
  item,
  selected,
  onClick,
}: {
  item: FeedbackItem
  selected: boolean
  onClick: () => void
}) {
  const cat = CATEGORY_BADGE[item.category]
  const stat = STATUS_BADGE[item.status]
  const isClosed = item.status === 'closed'
  const name = item.userId === null ? ANONYMOUS_DISPLAY_NAME : 'Team Member'

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 flex items-start gap-3 transition-colors"
      style={{
        background: selected ? 'rgba(255,193,116,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: isClosed ? 0.5 : 1,
      }}
    >
      {/* Category badge */}
      <span
        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5"
        style={{ background: cat.bg, color: cat.text }}
      >
        {cat.label}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate" style={{ color: 'var(--on-surface)' }}>
            {name}
            {item.userId === null && (
              <span className="ml-1 text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
                (Anonymous)
              </span>
            )}
          </span>
          <span className="flex-shrink-0 text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
            {formatDate(item.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed truncate" style={{ color: 'var(--on-surface-variant)' }}>
          {item.content.slice(0, 100)}
        </p>
        <div className="mt-2">
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: stat.bg, color: stat.text }}
          >
            {stat.label}
          </span>
        </div>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0, marginTop: 4 }} />
    </button>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
