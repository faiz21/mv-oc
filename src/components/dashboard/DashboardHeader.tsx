'use client'

import { Activity, CheckCircle2, Users, Zap } from 'lucide-react'
import { StatCard } from '@/components/dashboard/shared/StatCard'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import type { DashboardSummary } from '@/features/dashboard/data'

interface DashboardHeaderProps {
  summary: DashboardSummary
  connectionStatus?: string
}

export function DashboardHeader({ summary, connectionStatus }: DashboardHeaderProps) {
  const { connectionStatus: liveStatus } = useDashboardRealtime({})

  const status = connectionStatus ?? liveStatus

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--primary)' }}
          >
            Dashboard / Operations
          </div>
          <h1
            className="mt-1 font-display text-[28px] font-semibold leading-none tracking-[-0.04em]"
            style={{ color: 'var(--on-surface)' }}
          >
            Operations Control Room
          </h1>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                status === 'connected'
                  ? '#22c55e'
                  : status === 'connecting'
                    ? '#f59e0b'
                    : '#ef4444',
            }}
          />
          <span
            className="text-[12px] font-medium capitalize"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Active Runs"
          value={summary.activeRuns}
          tone="var(--status-running)"
          icon={<Activity size={14} />}
        />
        <StatCard
          label="Pending Approvals"
          value={summary.pendingApprovals}
          tone={summary.pendingApprovals > 0 ? 'var(--status-failed)' : 'var(--primary)'}
          icon={<CheckCircle2 size={14} />}
        />
        <StatCard
          label="Active Agents"
          value={summary.activeAgents}
          tone={
            summary.unreachableAgents > 0 ? 'var(--status-failed)' : 'var(--tertiary)'
          }
          icon={<Users size={14} />}
        />
        <StatCard
          label="SLA Warnings"
          value={summary.slaWarning + summary.slaBreach}
          tone={
            summary.slaBreach > 0
              ? 'var(--status-failed)'
              : summary.slaWarning > 0
                ? '#fcd34d'
                : 'var(--on-surface)'
          }
          icon={<Zap size={14} />}
        />
      </div>
    </div>
  )
}
