'use client'

import { PanelField } from '@/components/workflows/panels/PanelContainer'
import {
  MODEL_TIER_LABELS,
  type ModelProvider,
  type ModelTier,
  type ErrorStrategy,
  type WorkflowNodeData,
} from '@/features/workflows/editor-model'

interface AgentTaskPanelProps {
  data: WorkflowNodeData
  agents: Array<{ id: string; name: string; status: string }>
  onChange: (patch: Partial<WorkflowNodeData>) => void
}

export function AgentTaskPanel({ data, agents, onChange }: AgentTaskPanelProps) {
  return (
    <>
      <PanelField label="Assigned agent">
        <select
          value={data.agentId ?? ''}
          onChange={(e) => onChange({ agentId: e.target.value || null })}
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
      </PanelField>

      <PanelField label="Model tier">
        <select
          value={data.modelTier ?? 'regular'}
          onChange={(e) => onChange({ modelTier: e.target.value as ModelTier })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          {(Object.entries(MODEL_TIER_LABELS) as Array<[ModelTier, string]>).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </PanelField>

      <PanelField label="Model provider">
        <select
          value={data.modelProvider ?? 'anthropic'}
          onChange={(e) => onChange({ modelProvider: e.target.value as ModelProvider })}
          className="w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
      </PanelField>

      <PanelField label="Prompt template">
        <textarea
          value={data.promptTemplate ?? ''}
          onChange={(e) => onChange({ promptTemplate: e.target.value })}
          placeholder="Write the instruction for this agent step..."
          className="min-h-[120px] w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      <PanelField label="Input schema (JSON)" hint="Define the expected input shape for this step.">
        <textarea
          value={data.inputSchema ?? ''}
          onChange={(e) => onChange({ inputSchema: e.target.value })}
          placeholder='{ "type": "object", "properties": { ... } }'
          className="min-h-[80px] w-full rounded-[18px] px-4 py-3 font-mono text-[12px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      <PanelField label="Output schema (JSON)" hint="Define the expected output shape from this step.">
        <textarea
          value={data.outputSchema ?? ''}
          onChange={(e) => onChange({ outputSchema: e.target.value })}
          placeholder='{ "type": "object", "properties": { ... } }'
          className="min-h-[80px] w-full rounded-[18px] px-4 py-3 font-mono text-[12px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
      </PanelField>

      {/* Advanced section */}
      <div className="mt-6">
        <div className="mb-3 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
          Advanced
        </div>

        <PanelField label="Timeout (seconds)">
          <input
            type="number"
            value={data.timeoutSeconds ?? 30}
            onChange={(e) => onChange({ timeoutSeconds: Number(e.target.value) || 30 })}
            min={1}
            max={3600}
            className="w-full rounded-[18px] px-4 py-3 outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          />
        </PanelField>

        <PanelField label="Retry count">
          <input
            type="number"
            value={data.retryCount ?? 0}
            onChange={(e) => onChange({ retryCount: Number(e.target.value) || 0 })}
            min={0}
            max={5}
            className="w-full rounded-[18px] px-4 py-3 outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          />
        </PanelField>

        <PanelField label="Error strategy">
          <select
            value={data.errorStrategy ?? 'retry'}
            onChange={(e) => onChange({ errorStrategy: e.target.value as ErrorStrategy })}
            className="w-full rounded-[18px] px-4 py-3 outline-none"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          >
            <option value="retry">Retry</option>
            <option value="skip">Skip</option>
            <option value="fail">Fail workflow</option>
          </select>
        </PanelField>
      </div>
    </>
  )
}
