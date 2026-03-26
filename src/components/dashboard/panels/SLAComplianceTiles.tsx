'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { SLATile } from '@/components/dashboard/shared/SLATile'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import { getSlaSnapshot } from '@/features/dashboard/data'
import type { SlaSnapshotItem, SlaThresholds } from '@/features/dashboard/data'

interface SLAComplianceTilesProps {
  initialItems: SlaSnapshotItem[]
  slaThresholds: SlaThresholds
  departmentId: string
}

export function SLAComplianceTiles({
  initialItems,
  slaThresholds,
  departmentId,
}: SLAComplianceTilesProps) {
  const [items, setItems] = useState<SlaSnapshotItem[]>(initialItems)

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const fresh = await getSlaSnapshot(supabase, departmentId)
    setItems(fresh)
  }, [departmentId])

  useDashboardRealtime({
    onWorkflowRunChange: () => void refetch(),
    onGovernanceStateChange: () => void refetch(),
  })

  const breachCount = items.filter((i) => i.slaState === 'breach').length
  const warningCount = items.filter((i) => i.slaState === 'warning').length

  return (
    <DashboardPanel
      title="SLA Compliance"
      count={breachCount + warningCount > 0 ? breachCount + warningCount : undefined}
      isLive
      onRefresh={refetch}
    >
      {/* Summary strip */}
      {items.length > 0 && (
        <div className="mb-4 flex gap-4 text-[13px]">
          <span style={{ color: '#86efac' }}>
            {items.filter((i) => i.slaState === 'on_track').length} on track
          </span>
          <span style={{ color: '#fcd34d' }}>
            {warningCount} warning
          </span>
          <span style={{ color: '#fca5a5' }}>
            {breachCount} breach
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="py-10 text-center text-[13px]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          All SLAs on track
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SLATile
              key={item.stepId}
              label={`${item.workflowName}${item.entityRef ? ` · ${item.entityRef}` : ''}`}
              startedAt={item.startedAt}
              slaDueAt={item.slaDueAt}
              warningPct={slaThresholds.warningPct}
              breachPct={slaThresholds.breachPct}
            />
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
