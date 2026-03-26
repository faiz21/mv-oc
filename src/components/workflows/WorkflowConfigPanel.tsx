'use client'

import { ShieldCheck } from 'lucide-react'
import {
  requiresWorkflowApproval,
  slugifyWorkflowKey,
  type TriggerType,
  type WorkflowEditorNode,
  type WorkflowSettings,
} from '@/features/workflows/editor-model'

interface WorkflowConfigPanelProps {
  settings: WorkflowSettings
  nodes: WorkflowEditorNode[]
  agents: Array<{ id: string; name: string; status: string }>
  onChange: <K extends keyof WorkflowSettings>(key: K, value: WorkflowSettings[K]) => void
}

export function WorkflowConfigPanel({ settings, nodes, agents, onChange }: WorkflowConfigPanelProps) {
  const approvalLocked = requiresWorkflowApproval(nodes)

  function handleNameChange(name: string) {
    onChange('name', name)
    onChange('key', slugifyWorkflowKey(name))
  }

  return (
    <div className="space-y-5">
      <ConfigField label="Workflow name">
        <input
          value={settings.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </ConfigField>

      <ConfigField label="Workflow key (auto-slugified)">
        <input
          value={settings.key}
          onChange={(e) => onChange('key', e.target.value)}
          className="w-full rounded-[18px] px-4 py-3 font-mono text-[13px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </ConfigField>

      <ConfigField label="Description">
        <textarea
          value={settings.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe what this workflow does..."
          className="min-h-[90px] w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </ConfigField>

      <ConfigField label="Department">
        <input
          value={settings.departmentId ?? 'Locked to your department'}
          disabled
          className="w-full rounded-[18px] px-4 py-3 outline-none opacity-60"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        />
        <div className="mt-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
          Department is set at creation and cannot be changed.
        </div>
      </ConfigField>

      <ConfigField label="Primary agent">
        <select
          value={settings.primaryAgentId ?? ''}
          onChange={(e) => onChange('primaryAgentId', e.target.value || null)}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.status})
            </option>
          ))}
        </select>
      </ConfigField>

      <ConfigField label="Trigger type">
        <select
          value={settings.triggerType ?? 'manual'}
          onChange={(e) => onChange('triggerType', e.target.value as TriggerType)}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="manual">Manual</option>
          <option value="channel-message">Channel message</option>
          <option value="webhook">Webhook</option>
          <option value="cron">Cron (scheduled)</option>
        </select>
      </ConfigField>

      <ConfigField label="Workflow SLA (minutes, optional)">
        <input
          type="number"
          value={settings.workflowSlaMinutes ?? ''}
          onChange={(e) => onChange('workflowSlaMinutes', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="e.g. 120"
          min={1}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </ConfigField>

      {/* Approval gate enforcement */}
      <div className="rounded-[22px] px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <label className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] uppercase tracking-[0.2em]" style={{ color: 'var(--on-surface-variant)' }}>
              Approval enforcement
            </div>
            <div className="mt-2 text-sm" style={{ color: 'var(--secondary)' }}>
              {approvalLocked
                ? 'Locked because the current graph can produce a document or outbound message.'
                : 'Enable this manually when the workflow needs human review before runtime actions.'}
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={approvalLocked ? true : settings.requiresApproval}
              onChange={(e) => onChange('requiresApproval', e.target.checked)}
              disabled={approvalLocked}
              className="h-5 w-5"
            />
            {approvalLocked && (
              <div className="absolute -top-8 right-0 whitespace-nowrap rounded-lg px-2 py-1 text-[10px]" style={{ background: 'var(--surface-container-high)', color: 'var(--tertiary)' }}>
                Required for workflows with outbound messages or documents
              </div>
            )}
          </div>
        </label>

        {approvalLocked && (
          <div className="mt-3 flex items-start gap-2 text-[12px]" style={{ color: 'var(--tertiary)' }}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <span>Cannot skip approval for outbound workflows. This is enforced at the UI and backend level.</span>
          </div>
        )}

        <textarea
          value={settings.requiresApprovalReason}
          onChange={(e) => onChange('requiresApprovalReason', e.target.value)}
          placeholder="Required when approval is enabled. Explain why approval is needed."
          className="mt-4 min-h-[90px] w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </div>
    </div>
  )
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </div>
      {children}
    </label>
  )
}
