'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { FeedbackItem, FeedbackCategory, FeedbackStatus } from '@/features/feedback-hub/feedback-data'

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

interface MyFeedbackSectionProps {
  items: FeedbackItem[]
}

export function MyFeedbackSection({ items }: MyFeedbackSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          You haven't submitted any feedback yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const expanded = expandedId === item.id
        const cat = CATEGORY_BADGE[item.category]
        const stat = STATUS_BADGE[item.status]

        return (
          <div
            key={item.id}
            className="rounded-[18px] overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            {/* Row header */}
            <button
              onClick={() => setExpandedId(expanded ? null : item.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-3"
            >
              <span
                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: cat.bg, color: cat.text }}
              >
                {cat.label}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--on-surface)' }}>
                  {item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: stat.bg, color: stat.text }}
                  >
                    {stat.label}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                    {formatDate(item.createdAt)}
                  </span>
                  {item.updatedAt !== item.createdAt && (
                    <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                      · Updated {formatDate(item.updatedAt)}
                    </span>
                  )}
                </div>
              </div>

              {expanded ? (
                <ChevronDown size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} />
              )}
            </button>

            {/* Expanded content */}
            {expanded && (
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="pt-4">
                  <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                    Your Feedback
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
                    {item.content}
                  </p>
                </div>

                {item.response && (
                  <div
                    className="rounded-[14px] p-4"
                    style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.10)' }}
                  >
                    <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--status-active)' }}>
                      Leadership Response
                      {item.responseAt ? ` · ${formatDate(item.responseAt)}` : ''}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
                      {item.response}
                    </p>
                  </div>
                )}

                {item.closedReason && (
                  <div
                    className="rounded-[14px] p-4"
                    style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}
                  >
                    <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                      Closure Note{item.closedAt ? ` · ${formatDate(item.closedAt)}` : ''}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--on-surface)' }}>{item.closedReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
