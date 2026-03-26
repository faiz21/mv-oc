'use client'

import { ShieldCheck } from 'lucide-react'
import { PanelField } from '@/components/workflows/panels/PanelContainer'
import type { WorkflowGateType, WorkflowNodeData } from '@/features/workflows/editor-model'
import { APPROVAL_REQUIRED_GATES } from '@/features/workflows/editor-model'

interface ApprovalGatePanelProps {
  data: WorkflowNodeData
  approvalLocked: boolean
  onChange: (patch: Partial<WorkflowNodeData>) => void
}

export function ApprovalGatePanel({ data, approvalLocked, onChange }: ApprovalGatePanelProps) {
  const gateType = data.gateType ?? 'general'
  const isProtected = APPROVAL_REQUIRED_GATES.includes(gateType)

  return (
    <>
      <PanelField label="Gate type">
        <select
          value={gateType}
          onChange={(e) => onChange({ gateType: e.target.value as WorkflowGateType })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="general">General</option>
          <option value="document">Document</option>
          <option value="outbound-message">Outbound message</option>
          <option value="publish">Publish</option>
        </select>
      </PanelField>

      <PanelField label="Approver role">
        <select
          value={data.approverRole ?? 'operator'}
          onChange={(e) => onChange({ approverRole: e.target.value as 'operator' | 'admin' })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
      </PanelField>

      <PanelField label="SLA deadline (hours)">
        <input
          type="number"
          value={data.slaHours ?? 24}
          onChange={(e) => onChange({ slaHours: Number(e.target.value) || 24 })}
          min={1}
          max={720}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      <PanelField label="Escalation target" hint="User or role to escalate to if SLA is missed.">
        <input
          value={data.escalationTarget ?? ''}
          onChange={(e) => onChange({ escalationTarget: e.target.value })}
          placeholder="e.g. admin or user ID"
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      {/* Protection notice */}
      {isProtected && (
        <div
          className="mt-5 flex items-start gap-3 rounded-[18px] px-4 py-4"
          style={{ background: 'rgba(255,193,7,0.08)' }}
        >
          <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--tertiary)' }} />
          <div>
            <div className="text-[13px] font-medium" style={{ color: 'var(--tertiary)' }}>
              Required for workflows with outbound messages or documents
            </div>
            <div className="mt-1 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              This approval gate cannot be removed because the workflow produces outbound
              messages or documents. The approval enforcement is non-negotiable.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
