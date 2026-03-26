'use client'

import { PanelField } from '@/components/workflows/panels/PanelContainer'
import type { ErrorStrategy, WorkflowNodeData } from '@/features/workflows/editor-model'

interface WaitJoinPanelProps {
  data: WorkflowNodeData
  onChange: (patch: Partial<WorkflowNodeData>) => void
}

export function WaitJoinPanel({ data, onChange }: WaitJoinPanelProps) {
  const incomingBranchIds = data.incomingBranchIds ?? []

  return (
    <>
      <PanelField label="Incoming branches" hint="Shows which parallel branches feed into this join.">
        {incomingBranchIds.length === 0 ? (
          <div
            className="rounded-[18px] px-4 py-3 text-[13px]"
            style={{ background: 'var(--surface-container)', color: 'var(--secondary)' }}
          >
            No branches connected yet. Connect edges from parallel branches to this node.
          </div>
        ) : (
          <div className="space-y-1">
            {incomingBranchIds.map((id) => (
              <div
                key={id}
                className="rounded-[14px] px-3 py-2 text-[13px]"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              >
                {id}
              </div>
            ))}
          </div>
        )}
      </PanelField>

      <PanelField label="Timeout for straggler branches (seconds)">
        <input
          type="number"
          value={data.timeoutSeconds ?? 3600}
          onChange={(e) => onChange({ timeoutSeconds: Number(e.target.value) || 3600 })}
          min={0}
          max={86400}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      <PanelField label="Error strategy" hint="What happens if a branch fails before joining.">
        <select
          value={data.errorStrategy ?? 'fail'}
          onChange={(e) => onChange({ errorStrategy: e.target.value as ErrorStrategy })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="fail">Fail workflow</option>
          <option value="skip">Skip failed branch</option>
          <option value="retry">Retry failed branch</option>
        </select>
      </PanelField>
    </>
  )
}
