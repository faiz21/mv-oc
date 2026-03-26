'use client'

import { useState } from 'react'

interface DailySummary {
  date: string
  summary: string | null
  step_count: number | null
  error_count: number | null
}

interface LessonLearned {
  id: string
  lesson: string
  confidence: number
  updated_at: string
}

interface AgentMemoryTabsProps {
  summaries: DailySummary[]
  lessons: LessonLearned[]
  agentId: string | null
}

type Tab = "Today's Activity" | 'Lessons Learned' | 'Memory Explorer'

const TABS: Tab[] = ["Today's Activity", 'Lessons Learned', 'Memory Explorer']

function confidenceBadgeStyle(confidence: number): React.CSSProperties {
  if (confidence <= 1) return { background: 'rgba(248,113,113,0.15)', color: 'var(--status-failed)' }
  if (confidence <= 3) return { background: 'rgba(255,193,116,0.15)', color: 'var(--primary)' }
  return { background: 'rgba(110,231,183,0.15)', color: 'var(--status-active)' }
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const style = confidenceBadgeStyle(confidence)
  const stars = '★'.repeat(confidence) + '☆'.repeat(Math.max(0, 5 - confidence))
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.1em]"
      style={style}
    >
      {stars}
    </span>
  )
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function AgentMemoryTabs({ summaries, lessons, agentId }: AgentMemoryTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Today's Activity")
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  async function handleSearch() {
    if (!searchQuery.trim() || !agentId) return
    setSearching(true)
    setSearchResults(null)
    try {
      const res = await fetch(
        `/api/agent-builder/memory-search?agent_id=${encodeURIComponent(agentId)}&q=${encodeURIComponent(searchQuery.trim())}`
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(JSON.stringify(data, null, 2))
      } else {
        setSearchResults('Semantic search coming soon.')
      }
    } catch {
      setSearchResults('Semantic search coming soon.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <section
      className="rounded-[28px] border px-5 py-5"
      style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
        Agent Memory
      </div>

      {/* Tab pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="rounded-full px-4 py-2 text-xs font-semibold tracking-[0.08em] transition-colors"
            style={
              activeTab === tab
                ? { background: 'var(--primary)', color: '#000' }
                : { background: 'transparent', color: 'var(--secondary)', border: '1px solid var(--border-default)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {activeTab === "Today's Activity" && (
          <>
            {summaries.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                No daily summaries yet.
              </p>
            ) : (
              summaries.map((summary) => (
                <div
                  key={summary.date}
                  className="rounded-[18px] px-4 py-4"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {formatDate(summary.date)}
                  </div>
                  <div className="mt-2 text-sm leading-6" style={{ color: 'var(--secondary)' }}>
                    {summary.summary ?? 'No summary generated.'}
                  </div>
                  <div
                    className="mt-3 text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {summary.step_count ?? 0} steps · {summary.error_count ?? 0} errors
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Lessons Learned' && (
          <>
            {lessons.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                No lessons recorded yet.
              </p>
            ) : (
              lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-[18px] px-4 py-4"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="text-sm leading-6" style={{ color: 'var(--on-surface)' }}>
                    {lesson.lesson}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ConfidenceBadge confidence={lesson.confidence} />
                    <span
                      className="text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      {formatDate(lesson.updated_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Memory Explorer' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch() }}
                placeholder="Search agent memory semantically…"
                className="flex-1 rounded-[18px] border px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--on-surface)',
                }}
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={searching || !agentId}
                className="inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold"
                style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>

            {searchResults ? (
              <div
                className="rounded-[18px] px-4 py-4"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <pre className="whitespace-pre-wrap text-xs leading-6" style={{ color: 'var(--secondary)' }}>
                  {searchResults}
                </pre>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                Semantic memory search will appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
