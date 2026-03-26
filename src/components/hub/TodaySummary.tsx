'use client'

import { CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'

interface MetricCardProps {
  label: string
  value: number
  icon: React.ReactNode
  tone: string
}

function MetricCard({ label, value, icon, tone }: MetricCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-5 py-5"
      style={{ background: 'rgba(17,19,23,0.5)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {label}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
        >
          {icon}
        </span>
      </div>
      <div
        className="font-display text-[36px] font-semibold tabular-nums leading-none tracking-[-0.05em]"
        style={{ color: tone }}
      >
        {value}
      </div>
    </div>
  )
}

export function TodaySummary() {
  const { tasks, approvalQueue } = useHubRealtime()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const completedToday = tasks.filter(
    (t) =>
      (t.status === 'complete' || t.status === 'completed') &&
      t.updated_at >= todayISO,
  ).length

  const inProgress = tasks.filter(
    (t) => t.status === 'running' || t.status === 'queued',
  ).length

  const awaitingApproval = approvalQueue.filter((a) => a.status === 'awaiting_review').length

  const failedToday = tasks.filter(
    (t) => t.status === 'failed' && t.updated_at >= todayISO,
  ).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard
        label="Completed Today"
        value={completedToday}
        icon={<CheckCircle2 size={16} />}
        tone="var(--status-active)"
      />
      <MetricCard
        label="In Progress"
        value={inProgress}
        icon={<Clock3 size={16} />}
        tone="var(--status-running)"
      />
      <MetricCard
        label="Awaiting Approval"
        value={awaitingApproval}
        icon={<ShieldAlert size={16} />}
        tone={awaitingApproval > 0 ? '#f97316' : 'var(--on-surface-variant)'}
      />
      <MetricCard
        label="Failed Today"
        value={failedToday}
        icon={<XCircle size={16} />}
        tone={failedToday > 0 ? 'var(--status-failed)' : 'var(--on-surface-variant)'}
      />
    </div>
  )
}
