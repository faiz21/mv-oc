'use client'

import { X } from 'lucide-react'
import type { WorkflowEditorNode, WorkflowNodeData } from '@/features/workflows/editor-model'
import { AgentTaskPanel } from '@/components/workflows/panels/AgentTaskPanel'
import { ApprovalGatePanel } from '@/components/workflows/panels/ApprovalGatePanel'
import { ParallelBranchPanel } from '@/components/workflows/panels/ParallelBranchPanel'
import { WaitJoinPanel } from '@/components/workflows/panels/WaitJoinPanel'
import { WebhookTriggerPanel } from '@/components/workflows/panels/WebhookTriggerPanel'

interface PanelContainerProps {
  node: WorkflowEditorNode | null
  agents: Array<{ id: string; name: string; status: string }>
  approvalLocked: boolean
  onClose: () => void
  onDataChange: (patch: Partial<WorkflowNodeData>) => void
  onDeleteNode: (nodeId: string) => void
}

export function PanelContainer({
  node,
  agents,
  approvalLocked,
  onClose,
  onDataChange,
  onDeleteNode,
}: PanelContainerProps) {
  if (!node) return null

  const nodeType = node.type ?? 'agent_task'

  return (
    <div
      className="fixed inset-y-0 right-0 z-30 w-[380px] overflow-y-auto border-l"
      style={{
        background: 'var(--surface-container-low)',
        borderColor: 'var(--outline-variant)',
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
        style={{
          background: 'var(--surface-container-low)',
          borderColor: 'var(--outline-variant)',
        }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
            {nodeType.replace(/_/g, ' ')}
          </div>
          <div className="mt-1 text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            {node.data.label}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
          style={{ color: 'var(--on-surface-variant)' }}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel content */}
      <div className="px-5 py-5">
        {/* Common label field */}
        <PanelField label="Node label">
          <input
            value={node.data.label}
            onChange={(e) => onDataChange({ label: e.target.value })}
            className="w-full rounded-[18px] px-4 py-3 outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          />
        </PanelField>

        {/* Type-specific panels */}
        {nodeType === 'agent_task' && (
          <AgentTaskPanel data={node.data} agents={agents} onChange={onDataChange} />
        )}
        {nodeType === 'approval_gate' && (
          <ApprovalGatePanel data={node.data} approvalLocked={approvalLocked} onChange={onDataChange} />
        )}
        {nodeType === 'parallel_branch' && (
          <ParallelBranchPanel data={node.data} onChange={onDataChange} />
        )}
        {nodeType === 'wait_join' && (
          <WaitJoinPanel data={node.data} onChange={onDataChange} />
        )}
        {nodeType === 'webhook_trigger' && (
          <WebhookTriggerPanel data={node.data} onChange={onDataChange} />
        )}
        {nodeType === 'start' && (
          <PanelField label="Trigger type">
            <select
              value={node.data.triggerType ?? 'manual'}
              onChange={(e) => onDataChange({ triggerType: e.target.value as WorkflowNodeData['triggerType'] })}
              className="w-full rounded-[18px] px-4 py-3 outline-none"
              style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
            >
              <option value="manual">Manual</option>
              <option value="webhook">Webhook</option>
              <option value="cron">Cron</option>
              <option value="channel-message">Channel message</option>
            </select>
          </PanelField>
        )}
        {nodeType === 'end' && (
          <PanelField label="Output type">
            <select
              value={node.data.outputType ?? 'internal'}
              onChange={(e) => onDataChange({ outputType: e.target.value as WorkflowNodeData['outputType'] })}
              className="w-full rounded-[18px] px-4 py-3 outline-none"
              style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
            >
              <option value="internal">Internal</option>
              <option value="document">Document</option>
              <option value="outbound-message">Outbound message</option>
            </select>
          </PanelField>
        )}

        {/* Delete node button */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <button
            onClick={() => onDeleteNode(node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-medium transition-colors hover:bg-red-500/10"
            style={{ color: '#ef4444' }}
          >
            <X size={14} />
            Delete node
          </button>
        </div>
      </div>
    </div>
  )
}

export function PanelField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="mt-4 block">
      <div className="mb-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </div>
      {children}
      {hint && (
        <div className="mt-1.5 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
          {hint}
        </div>
      )}
    </label>
  )
}
