'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { StatusBadge } from '@/components/dashboard/shared/StatusBadge'
import { RoleGate } from '@/components/dashboard/shared/RoleGate'
import { getSystemHealth } from '@/features/dashboard/data'
import type { SystemHealthData } from '@/features/dashboard/data'
import type { Tables } from '@/types'
import { Database, Radio, Layers, Calendar } from 'lucide-react'

interface SystemHealthPanelProps {
  initialData: SystemHealthData
  departmentId: string
}

function humanSchedule(job: Tables<'automation_jobs'>): string {
  if (job.schedule_expression) return job.schedule_expression
  if (job.schedule_type === 'manual') return 'Manual'
  return job.schedule_type
}

function nextRunLabel(nextRunAt: string | null): string {
  if (!nextRunAt) return '—'
  const diff = Date.parse(nextRunAt) - Date.now()
  if (diff < 0) return 'overdue'
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `in ${days}d`
  if (hours > 0) return `in ${hours}h`
  return `in ${mins}m`
}

export function SystemHealthPanel({
  initialData,
  departmentId,
}: SystemHealthPanelProps) {
  const [data, setData] = useState<SystemHealthData>(initialData)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const refetch = useCallback(async () => {
    setRefreshing(true)
    try {
      const supabase = createClient()
      const fresh = await getSystemHealth(supabase, departmentId)
      setData(fresh)
      showToast('Health check complete')
    } finally {
      setRefreshing(false)
    }
  }, [departmentId])

  const { gateway, taskQueue, automationJobs } = data
  const queueAlert = taskQueue.pending > taskQueue.alertThreshold
  const queueWarn = taskQueue.queued > 10

  return (
    <>
      <DashboardPanel
        title="System Health"
        onRefresh={refetch}
        refreshing={refreshing}
      >
        <div className="space-y-5">
          {/* Gateway */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Radio size={13} style={{ color: 'var(--on-surface-variant)' }} />
              <h3
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Gateway
              </h3>
            </div>
            {gateway ? (
              <div className="flex flex-wrap items-center gap-3 text-[13px]">
                <StatusBadge
                  status={
                    gateway.status === 'healthy'
                      ? 'active'
                      : gateway.status === 'degraded'
                        ? 'warning'
                        : 'failed'
                  }
                  label={gateway.status}
                />
                {gateway.latencyMs !== null && (
                  <span style={{ color: 'var(--on-surface-variant)' }}>
                    {gateway.latencyMs}ms
                  </span>
                )}
                <span style={{ color: 'var(--on-surface-variant)' }}>
                  Checked {formatRelativeTime(gateway.checkedAt)}
                </span>
              </div>
            ) : (
              <span
                className="text-[13px]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                No gateway data
              </span>
            )}
          </section>

          {/* Database */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Database size={13} style={{ color: 'var(--on-surface-variant)' }} />
              <h3
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Database
              </h3>
            </div>
            <StatusBadge status="active" label="Connected" />
          </section>

          {/* Task Queue */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Layers size={13} style={{ color: 'var(--on-surface-variant)' }} />
              <h3
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Task Queue
              </h3>
            </div>
            <div className="flex flex-wrap gap-4 text-[13px]">
              {[
                {
                  label: 'Pending',
                  value: taskQueue.pending,
                  alert: queueAlert,
                },
                {
                  label: 'Queued',
                  value: taskQueue.queued,
                  alert: queueWarn,
                },
                {
                  label: 'Running',
                  value: taskQueue.running,
                  alert: false,
                },
                {
                  label: 'Failed 24h',
                  value: taskQueue.failed24h,
                  alert: taskQueue.failed24h > 0,
                },
              ].map(({ label, value, alert }) => (
                <div key={label} className="text-center">
                  <div
                    className="font-display text-[20px] font-semibold leading-none"
                    style={{
                      color: alert ? '#fca5a5' : 'var(--on-surface)',
                    }}
                  >
                    {value}
                  </div>
                  <div
                    className="mt-0.5 text-[11px]"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
            {queueAlert && (
              <div
                className="mt-2 rounded-xl px-3 py-2 text-[12px]"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  color: '#fca5a5',
                }}
              >
                Queue depth exceeds alert threshold ({taskQueue.alertThreshold})
              </div>
            )}
          </section>

          {/* Automation Jobs */}
          {automationJobs.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Calendar size={13} style={{ color: 'var(--on-surface-variant)' }} />
                <h3
                  className="text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  Scheduled Jobs
                </h3>
              </div>
              <div className="space-y-1.5">
                {automationJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[12px]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="min-w-0">
                      <span
                        className="truncate font-medium"
                        style={{ color: 'var(--on-surface)' }}
                      >
                        {job.name}
                      </span>
                      <span
                        className="ml-2"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {humanSchedule(job)}
                      </span>
                    </div>
                    <span
                      className="shrink-0"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      {nextRunLabel(job.next_run_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DashboardPanel>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-[13px] font-medium shadow-lg"
          style={{
            background: 'var(--surface-container)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--on-surface)',
          }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </>
  )
}
