'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart2, CheckCircle, XCircle, Clock, TrendingUp, Download } from 'lucide-react'

type Period = 'week' | 'month' | 'alltime'

interface WorkflowStat {
  workflow_id: string
  name: string
  count: number
}

interface UserStat {
  user_id: string
  name: string
  count: number
}

interface ErrorStat {
  msg: string
  count: number
}

interface AnalyticsData {
  period: string
  total_runs: number
  alltime_runs: number
  success_runs: number
  failed_runs: number
  success_rate: number
  avg_execution_ms: number
  trend: string
  by_workflow: WorkflowStat[]
  by_user: UserStat[]
  top_errors: ErrorStat[]
}

export function SandboxAnalyticsPanel() {
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/gaming/sandbox-analytics?period=${period}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  function exportCsv() {
    if (!data) return
    const rows = [
      ['metric', 'value'],
      ['total_runs', String(data.total_runs)],
      ['alltime_runs', String(data.alltime_runs)],
      ['success_runs', String(data.success_runs)],
      ['failed_runs', String(data.failed_runs)],
      ['success_rate_pct', String(data.success_rate)],
      ['avg_execution_ms', String(data.avg_execution_ms)],
      [],
      ['workflow', 'runs'],
      ...data.by_workflow.map(w => [w.name, String(w.count)]),
      [],
      ['user', 'runs'],
      ...data.by_user.map(u => [u.name, String(u.count)]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sandbox-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'alltime', label: 'All time' },
  ]

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-container-low)' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                background: period === p.key ? 'var(--surface-container)' : 'transparent',
                color: period === p.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCsv}
          disabled={!data}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: 'var(--surface-container-low)' }} />
          ))}
        </div>
      ) : !data ? (
        <div className="py-8 text-center text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
          Failed to load analytics.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BarChart2, label: 'Total runs', value: data.total_runs, sub: `${data.alltime_runs} all-time` },
              { icon: CheckCircle, label: 'Success rate', value: `${data.success_rate}%`, sub: `${data.success_runs} passed` },
              { icon: XCircle, label: 'Failures', value: data.failed_runs, sub: `${100 - data.success_rate}% fail rate` },
              { icon: Clock, label: 'Avg time', value: `${data.avg_execution_ms}ms`, sub: 'per run' },
            ].map(card => (
              <div
                key={card.label}
                className="rounded-2xl p-4 space-y-1"
                style={{ background: 'var(--surface-container-low)' }}
              >
                <div className="flex items-center gap-2">
                  <card.icon size={14} style={{ color: 'var(--primary)' }} />
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                    {card.label}
                  </span>
                </div>
                <div className="text-[22px] font-bold" style={{ color: 'var(--on-surface)' }}>{card.value}</div>
                <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Trend */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px]"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
          >
            <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
            Trend: <span style={{ color: 'var(--on-surface)' }}>{data.trend}</span> vs previous {period}
          </div>

          {/* By workflow */}
          {data.by_workflow.length > 0 && (
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                Runs by Workflow
              </div>
              <div className="space-y-2">
                {data.by_workflow.slice(0, 8).map(wf => {
                  const pct = data.total_runs > 0 ? Math.round((wf.count / data.total_runs) * 100) : 0
                  return (
                    <div key={wf.workflow_id} className="flex items-center gap-3">
                      <div className="w-36 truncate text-[13px]" style={{ color: 'var(--on-surface)' }}>{wf.name}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                      <div className="w-12 text-right text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>{wf.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* By user */}
          {data.by_user.length > 0 && (
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                Runs by User
              </div>
              <div className="space-y-2">
                {data.by_user.slice(0, 8).map(u => {
                  const pct = data.total_runs > 0 ? Math.round((u.count / data.total_runs) * 100) : 0
                  return (
                    <div key={u.user_id} className="flex items-center gap-3">
                      <div className="w-36 truncate text-[13px]" style={{ color: 'var(--on-surface)' }}>{u.name}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)', opacity: 0.7 }} />
                      </div>
                      <div className="w-12 text-right text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>{u.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top errors */}
          {data.top_errors.length > 0 && (
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                Most Common Errors
              </div>
              <div className="space-y-2">
                {data.top_errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--surface-container-low)' }}
                  >
                    <XCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px]" style={{ color: 'var(--on-surface)' }}>{err.msg}</div>
                    </div>
                    <div className="text-[12px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                      ×{err.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.total_runs === 0 && (
            <div className="py-8 text-center text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
              No sandbox runs in this period.
            </div>
          )}
        </>
      )}
    </div>
  )
}
