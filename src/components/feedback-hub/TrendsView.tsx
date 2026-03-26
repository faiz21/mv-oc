'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingDown, Clock, AlertTriangle } from 'lucide-react'
import type { TrendMetrics, WeeklyVolume, FeedbackCategory } from '@/features/feedback-hub/feedback-data'

interface TrendsViewProps {
  initialMetrics: TrendMetrics
  initialVolume: WeeklyVolume[]
}

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  idea: 'var(--primary)',
  problem: 'var(--status-failed)',
  request: '#60A5FA',
  general: '#94A3B8',
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: 'Idea',
  problem: 'Problem',
  request: 'Request',
  general: 'General',
}

export function TrendsView({ initialMetrics, initialVolume }: TrendsViewProps) {
  const [metrics, setMetrics] = useState<TrendMetrics>(initialMetrics)
  const [volume, setVolume] = useState<WeeklyVolume[]>(initialVolume)
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all')
  const [weeks, setWeeks] = useState<8 | 12 | 24>(8)

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('weeks', String(weeks))
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/feedback/trends?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as { metrics: TrendMetrics; weeklyVolume: WeeklyVolume[] }
        setMetrics(data.metrics)
        setVolume(data.weeklyVolume)
      }
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, weeks])

  useEffect(() => {
    void fetchTrends()
  }, [fetchTrends])

  // Calculate max for chart scaling
  const maxTotal = Math.max(1, ...volume.map(w => w.idea + w.problem + w.request + w.general))
  const categories: FeedbackCategory[] = ['idea', 'problem', 'request', 'general']

  function exportCSV() {
    const header = 'Week,Idea,Problem,Request,General,Total'
    const rows = volume.map(w =>
      `${w.weekStart},${w.idea},${w.problem},${w.request},${w.general},${w.idea + w.problem + w.request + w.general}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-trends-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Response Rate"
          value={`${(metrics.responseRate * 100).toFixed(1)}%`}
          icon={<TrendingDown size={16} />}
          highlight={metrics.responseRate < 0.5}
        />
        <MetricCard
          label="Avg Days to Response"
          value={metrics.avgDaysToResponse != null ? `${metrics.avgDaysToResponse.toFixed(1)} days` : '—'}
          icon={<Clock size={16} />}
        />
        <MetricCard
          label="Avg Days to Close"
          value={metrics.avgDaysToClose != null ? `${metrics.avgDaysToClose.toFixed(1)} days` : '—'}
          icon={<Clock size={16} />}
        />
        <MetricCard
          label="Pending Review"
          value={String(metrics.pendingCount)}
          icon={<AlertTriangle size={16} />}
          highlight={metrics.pendingCount > 5}
          highlightColor="var(--status-failed)"
        />
      </div>

      {/* Chart controls */}
      <div className="flex flex-wrap items-center gap-3">
        <BarChart3 size={16} style={{ color: 'var(--on-surface-variant)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>Volume by Week</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          {/* Category filter */}
          <button
            onClick={() => setCategoryFilter('all')}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: categoryFilter === 'all' ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
              color: categoryFilter === 'all' ? 'var(--primary)' : 'var(--on-surface-variant)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: categoryFilter === cat ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
                color: categoryFilter === cat ? CATEGORY_COLORS[cat] : 'var(--on-surface-variant)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}

          {/* Week range */}
          {([8, 12, 24] as const).map(w => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: weeks === w ? 'rgba(96,165,250,0.10)' : 'rgba(255,255,255,0.04)',
                color: weeks === w ? '#60A5FA' : 'var(--on-surface-variant)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {w}w
            </button>
          ))}

          <button
            onClick={exportCSV}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface-variant)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div
        className="rounded-[18px] p-5 overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Loading...</p>
          </div>
        ) : volume.every(w => w.idea + w.problem + w.request + w.general === 0) ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>No feedback submitted yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 min-w-[400px]" style={{ height: 180 }}>
            {volume.map(week => {
              const total = week.idea + week.problem + week.request + week.general
              const heightPct = (total / maxTotal) * 100
              const label = formatWeekLabel(week.weekStart)
              const weekCounts: Record<FeedbackCategory, number> = {
                idea: week.idea,
                problem: week.problem,
                request: week.request,
                general: week.general,
              }

              return (
                <div
                  key={week.weekStart}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${label}\nIdea: ${week.idea}\nProblem: ${week.problem}\nRequest: ${week.request}\nGeneral: ${week.general}\nTotal: ${total}`}
                >
                  <div className="w-full flex flex-col justify-end rounded-sm overflow-hidden" style={{ height: 150 }}>
                    <div style={{ height: `${heightPct}%` }} className="w-full flex flex-col justify-end">
                      {categories.filter(c => weekCounts[c] > 0).map(cat => (
                        <div
                          key={cat}
                          style={{
                            height: `${(weekCounts[cat] / total) * 100}%`,
                            background: CATEGORY_COLORS[cat],
                            opacity: 0.75,
                            minHeight: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] text-center leading-tight" style={{ color: 'var(--on-surface-variant)' }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: CATEGORY_COLORS[cat], opacity: 0.75 }} />
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{CATEGORY_LABELS[cat]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
  highlightColor = 'var(--primary)',
}: {
  label: string
  value: string
  icon: React.ReactNode
  highlight?: boolean
  highlightColor?: string
}) {
  return (
    <div
      className="rounded-[18px] p-5 space-y-2"
      style={{
        background: highlight ? 'rgba(248,113,113,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${highlight ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-center gap-2" style={{ color: highlight ? highlightColor : 'var(--on-surface-variant)' }}>
        {icon}
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: highlight ? highlightColor : 'var(--on-surface)' }}>
        {value}
      </p>
    </div>
  )
}

function formatWeekLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
