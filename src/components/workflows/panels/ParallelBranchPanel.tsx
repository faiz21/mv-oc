'use client'

import { Plus, Trash2 } from 'lucide-react'
import { PanelField } from '@/components/workflows/panels/PanelContainer'
import type { ParallelCompletionStrategy, WorkflowNodeData } from '@/features/workflows/editor-model'

interface ParallelBranchPanelProps {
  data: WorkflowNodeData
  onChange: (patch: Partial<WorkflowNodeData>) => void
}

export function ParallelBranchPanel({ data, onChange }: ParallelBranchPanelProps) {
  const branchCount = data.branchCount ?? 2
  const branchLabels = data.branchLabels ?? Array.from({ length: branchCount }, (_, i) => `Branch ${String.fromCharCode(65 + i)}`)
  const completionStrategy = data.completionStrategy ?? 'all'

  function addBranch() {
    const nextCount = branchCount + 1
    const nextLabels = [...branchLabels, `Branch ${String.fromCharCode(64 + nextCount)}`]
    onChange({ branchCount: nextCount, branchLabels: nextLabels })
  }

  function removeBranch(index: number) {
    if (branchCount <= 2) return
    const nextLabels = branchLabels.filter((_, i) => i !== index)
    onChange({ branchCount: branchCount - 1, branchLabels: nextLabels })
  }

  function updateBranchLabel(index: number, label: string) {
    const nextLabels = branchLabels.map((l, i) => (i === index ? label : l))
    onChange({ branchLabels: nextLabels })
  }

  return (
    <>
      <PanelField label="Completion strategy">
        <select
          value={completionStrategy}
          onChange={(e) => onChange({ completionStrategy: e.target.value as ParallelCompletionStrategy })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="all">All (wait for every branch)</option>
          <option value="any">Any (first to complete)</option>
          <option value="threshold">Threshold (N of M)</option>
        </select>
      </PanelField>

      {completionStrategy === 'threshold' && (
        <PanelField label="Completion threshold" hint={`Number of branches that must complete (out of ${branchCount}).`}>
          <input
            type="number"
            value={data.completionThreshold ?? Math.ceil(branchCount / 2)}
            onChange={(e) => onChange({ completionThreshold: Number(e.target.value) || 1 })}
            min={1}
            max={branchCount}
            className="w-full rounded-[18px] px-4 py-3 outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          />
        </PanelField>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
            Branches ({branchCount})
          </div>
          <button
            onClick={addBranch}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--primary)' }}
          >
            <Plus size={12} />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {branchLabels.map((label, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={label}
                onChange={(e) => updateBranchLabel(index, e.target.value)}
                className="flex-1 rounded-[14px] px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
              <button
                onClick={() => removeBranch(index)}
                disabled={branchCount <= 2}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5 disabled:opacity-30"
                style={{ color: 'var(--on-surface-variant)' }}
                aria-label={`Remove ${label}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
