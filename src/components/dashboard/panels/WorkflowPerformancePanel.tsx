'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { getWorkflowPerformance } from '@/features/dashboard/data'
import type { WorkflowPerformanceItem } from '@/features/dashboard/data'

type Period = '24h' | '7d' | '30d'
type MetricKey = 'taskCount' | 'successRate' | 'avgExecutionMs'

interface WorkflowPerformancePanelProps {
  initialData: WorkflowPerformanceItem[]
  departmentId: string
}

const METRIC_LABELS: Record<MetricKey, string> = {
  taskCount: 'Task Count',
  successRate: 'Success Rate',
  avgExecutionMs: 'Avg Execution Time',
}

const PERIOD_LABELS: Record<Period, string> = {
  '24h': '24h',
  '7d': '7 days',
  '30d': '30 days',
}

function formatMetric(key: MetricKey, value: number | null): string {
  if (value === null) return '—'
  if (key === 'successRate') return `${value.toFixed(1)}%`
  if (key === 'avgExecutionMs') {
    const secs = value / 1000
    if (secs >= 60) return `${(secs / 60).toFixed(1)}m`
    return `${secs.toFixed(1)}s`
  }
  return value.toString()
}

function getBarWidth(
  items: WorkflowPerformanceItem[],
  current: WorkflowPerformanceItem,
  key: MetricKey,
): number {
  const max = Math.max(
    ...items.map((i) => {
      const v = i[key]
      return typeof v === 'number' ? v : 0
    }),
    1,
  )
  const val = current[key]
  if (typeof val !== 'number' || val === null) return 0
  return (val / max) * 100
}

export function WorkflowPerformancePanel({
  initialData,
  departmentId,
}: WorkflowPerformancePanelProps) {
  const [data, setData] = useState<WorkflowPerformanceItem[]>(initialData)
  const [period, setPeriod] = useState<Period>('24h')
  const [metric, setMetric] = useState<MetricKey>('taskCount')
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(
    async (newPeriod: Period = period) => {
      setLoading(true)
      try {
        const supabase = createClient()
        const fresh = await getWorkflowPerformance(supabase, departmentId, newPeriod)
        setData(fresh)
      } finally {
        setLoading(false)
      }
    },
    [departmentId, period],
  )

  async function handlePeriodChange(newPeriod: Period) {
    setPeriod(newPeriod)
    await refetch(newPeriod)
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[metric]
    const bv = b[metric]
    if (av === null) return 1
    if (bv === null) return -1
    return (bv as number) - (av as number)
  })

  return (
    <DashboardPanel
      title="Workflow Performance"
      onRefresh={() => refetch(period)}
      refreshing={loading}
    >
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Metric tabs */}
        <div
          className="flex gap-1 rounded-full p-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          role="tablist"
        >
          {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={metric === key}
              onClick={() => setMetric(key)}
              className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
              style={
                metric === key
                  ? { background: 'rgba(255,193,116,0.16)', color: 'var(--primary)' }
                  : { color: 'var(--on-surface-variant)' }
              }
            >
              {METRIC_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div
          className="flex gap-1 rounded-full p-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {(['24h', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodChange(p)}
              className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
              style={
                period === p
                  ? { background: 'rgba(255,193,116,0.16)', color: 'var(--primary)' }
                  : { color: 'var(--on-surface-variant)' }
              }
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {sorted.length === 0 ? (
        <div
          className="py-10 text-center text-[13px]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          No workflow data for this period
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => {
            const barWidth = getBarWidth(sorted, item, metric)
            const value = item[metric]
            const displayValue = formatMetric(
              metric,
              typeof value === 'number' ? value : null,
            )

            return (
              <div key={item.workflowId}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className="truncate text-[13px] font-medium"
                    style={{ color: 'var(--on-surface)' }}
                    title={item.workflowName}
                  >
                    {item.workflowName}
                  </span>
                  <span
                    className="shrink-0 tabular-nums text-[13px] font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    {displayValue}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background:
                        metric === 'successRate' && item.successRate < 50
                          ? 'rgba(239,68,68,0.7)'
                          : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardPanel>
  )
}
