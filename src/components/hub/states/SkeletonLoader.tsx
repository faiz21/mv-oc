'use client'

function SkeletonBlock({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className ?? ''}`}
      style={{ background: 'rgba(255,255,255,0.05)', ...style }}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl px-5 py-5" style={{ background: 'rgba(17,19,23,0.5)' }}>
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-9 w-12" />
    </div>
  )
}

export function TodaySummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TaskRowSkeleton() {
  return (
    <div
      className="flex items-start gap-4 rounded-[24px] px-4 py-4"
      style={{ background: 'rgba(17,19,23,0.5)' }}
    >
      <SkeletonBlock className="h-11 w-11 flex-shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function MyQueueSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <TaskRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function ActivityRowSkeleton() {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'rgba(17,19,23,0.5)' }}
    >
      <SkeletonBlock className="h-4 w-4 flex-shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-3 w-2/3" />
        <SkeletonBlock className="h-2.5 w-1/3" />
      </div>
    </div>
  )
}

export function RecentActivitySkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <ActivityRowSkeleton key={i} />
      ))}
    </div>
  )
}

export function SystemStatusSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,19,23,0.5)' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <SkeletonBlock className="h-4 w-4 flex-shrink-0 rounded-full" />
          <SkeletonBlock className="h-3 flex-1" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function HubPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 px-4 py-8 animate-pulse">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-48" />
        </div>
        <SkeletonBlock className="h-7 w-28 rounded-full" />
      </div>
      <TodaySummarySkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <MyQueueSkeleton />
        <div className="space-y-6">
          <SystemStatusSkeleton />
          <RecentActivitySkeleton />
        </div>
      </div>
    </div>
  )
}
