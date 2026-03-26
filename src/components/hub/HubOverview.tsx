'use client'

import { Zap } from 'lucide-react'
import { HubLiveSync } from '@/components/hub/HubLiveSync'
import { HubTaskQueue } from '@/components/hub/HubTaskQueue'
import { HubMyQueue } from '@/components/hub/HubTaskQueue'
import { TodaySummary } from '@/components/hub/TodaySummary'
import { ApprovalQueueSection } from '@/components/hub/ApprovalQueueSection'
import { RecentActivity } from '@/components/hub/RecentActivity'
import { SystemStatus } from '@/components/hub/SystemStatus'
import { QuoteLayer } from '@/components/hub/QuoteLayer'
import { QuickActions } from '@/components/hub/QuickActions'
import { HubHeader } from '@/components/hub/HubHeader'
import { HubPageSkeleton } from '@/components/hub/states/SkeletonLoader'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'
import type { HubTask } from '@/components/hub/types'
import type {
  ApprovalQueueSection as ApprovalSection,
  ApprovalSlaState,
} from '@/features/approvals/approval-queue'

/* ------------------------------------------------------------------ */
/*  Legacy props (kept for backward compat with RSC page)              */
/* ------------------------------------------------------------------ */

export interface WorkflowRunSummary {
  id: string
  workflowId: string
  status: string
  triggerType: string
  createdAt: string
  completedAt: string | null
}

export interface HubOverviewProps {
  userId: string
  userName: string
  tasks: HubTask[]
  approvalCounts: Record<ApprovalSlaState | 'total', number>
  approvalSections: ApprovalSection[]
  recentRuns: WorkflowRunSummary[]
}

/* ------------------------------------------------------------------ */
/*  Context-driven Hub layout                                          */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-[11px] tabular-nums"
          style={{
            background: 'rgba(17,19,23,0.5)',
            color: 'var(--on-surface-variant)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

function HubBody() {
  const { tasks, isLoading } = useHubRealtime()

  if (isLoading) {
    return <HubPageSkeleton />
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 px-4 py-8">
      {/* Today's Summary */}
      <TodaySummary />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: My Queue */}
        <section>
          <SectionHeader icon={<Zap size={14} />} label="My Queue" count={tasks.length} />
          <div className="mt-3">
            <HubMyQueue />
          </div>
        </section>

        {/* Right column: Approval Queue + Recent Activity */}
        <div className="space-y-6">
          <ApprovalQueueSection />
          <RecentActivity />
        </div>
      </div>

      {/* System Status — full width */}
      <SystemStatus />

      {/* Quote Layer */}
      <QuoteLayer />
    </div>
  )
}

/**
 * Context-driven Hub overview.
 * Used when HubRealtimeProvider wraps the page.
 */
export function HubOverviewConnected() {
  return (
    <div className="min-h-screen">
      <HubHeader />
      <HubBody />
    </div>
  )
}

/**
 * Legacy prop-driven overview (RSC compatibility).
 * Used by the existing page.tsx until migration is complete.
 */
export function HubOverview({
  userName,
  tasks,
}: HubOverviewProps) {
  const greeting = getGreeting()

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 px-4 py-8">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--primary)' }}
          >
            Hub / Overview
          </div>
          <h1
            className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.05em]"
            style={{ color: 'var(--on-surface)' }}
          >
            {greeting}, {userName}
          </h1>
        </div>
        <HubLiveSync />
      </div>

      {/* Legacy task queue */}
      <section>
        <SectionHeader icon={<Zap size={14} />} label="My Queue" count={tasks.length} />
        <div className="mt-3">
          <HubTaskQueue tasks={tasks} />
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
