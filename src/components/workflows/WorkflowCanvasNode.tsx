'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Bot, Flag, GitBranch, GitMerge, Play, ShieldCheck, Webhook } from 'lucide-react'
import type { WorkflowNodeData, WorkflowNodeType } from '@/features/workflows/editor-model'

const accentByType: Record<WorkflowNodeType, string> = {
  start: 'var(--status-active)',
  agent_task: 'var(--primary)',
  approval_gate: 'var(--tertiary)',
  end: 'var(--secondary)',
  parallel_branch: '#8b5cf6',
  wait_join: '#6366f1',
  webhook_trigger: '#f59e0b',
}

function nodeIcon(type: string) {
  switch (type) {
    case 'start':
      return <Play size={16} />
    case 'agent_task':
      return <Bot size={16} />
    case 'approval_gate':
      return <ShieldCheck size={16} />
    case 'end':
      return <Flag size={16} />
    case 'parallel_branch':
      return <GitBranch size={16} />
    case 'wait_join':
      return <GitMerge size={16} />
    case 'webhook_trigger':
      return <Webhook size={16} />
    default:
      return <Bot size={16} />
  }
}

function nodeSubtitle(type: string, data: WorkflowNodeData): string {
  switch (type) {
    case 'agent_task':
      return data.agentId || 'Agent unassigned'
    case 'approval_gate':
      return data.gateType || 'General review'
    case 'end':
      return data.outputType || 'Internal result'
    case 'start':
      return data.triggerType || 'Manual start'
    case 'parallel_branch':
      return `${data.branchCount ?? 2} branches — ${data.completionStrategy ?? 'all'}`
    case 'wait_join':
      return data.errorStrategy ? `Strategy: ${data.errorStrategy}` : 'Wait for branches'
    case 'webhook_trigger':
      return data.authMethod ? `Auth: ${data.authMethod}` : 'No auth'
    default:
      return ''
  }
}

export function WorkflowCanvasNode({ type, data, selected }: NodeProps) {
  const nodeType = (type ?? 'agent_task') as WorkflowNodeType
  const accent = accentByType[nodeType] ?? 'var(--primary)'
  const typedData = data as unknown as WorkflowNodeData
  const icon = nodeIcon(nodeType)

  // Determine handle configuration based on node type
  const showTargetHandle = nodeType !== 'start'
  const showSourceHandle = nodeType !== 'end'

  // Parallel branch: 1 input, multiple outputs
  // Wait/join: multiple inputs, 1 output
  const isParallel = nodeType === 'parallel_branch'
  const isWaitJoin = nodeType === 'wait_join'
  const branchCount = typedData.branchCount ?? 2

  return (
    <div
      className="min-w-[220px] rounded-[20px] px-4 py-4"
      style={{
        background: selected ? 'var(--surface-container-high)' : 'var(--surface-container)',
        boxShadow: selected
          ? `0 0 0 1px color-mix(in srgb, ${accent} 40%, transparent), 0 24px 48px rgba(0, 0, 0, 0.28)`
          : '0 14px 34px rgba(0, 0, 0, 0.18)',
      }}
    >
      {/* Target handles */}
      {showTargetHandle && !isWaitJoin && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-0"
          style={{ background: accent }}
        />
      )}
      {isWaitJoin &&
        Array.from({ length: branchCount }, (_, i) => (
          <Handle
            key={`target-${i}`}
            type="target"
            position={Position.Left}
            id={`target-${i}`}
            className="!h-3 !w-3 !border-0"
            style={{
              background: accent,
              top: `${((i + 1) / (branchCount + 1)) * 100}%`,
            }}
          />
        ))}

      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', color: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
            {nodeType.replace(/_/g, ' ')}
          </div>
          <div className="mt-1 truncate text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            {typedData.label}
          </div>
          <div className="mt-1 text-[12px]" style={{ color: 'var(--secondary)' }}>
            {nodeSubtitle(nodeType, typedData)}
          </div>
        </div>
      </div>

      {/* Source handles */}
      {showSourceHandle && !isParallel && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-0"
          style={{ background: accent }}
        />
      )}
      {isParallel &&
        Array.from({ length: branchCount }, (_, i) => (
          <Handle
            key={`source-${i}`}
            type="source"
            position={Position.Right}
            id={`source-${i}`}
            className="!h-3 !w-3 !border-0"
            style={{
              background: accent,
              top: `${((i + 1) / (branchCount + 1)) * 100}%`,
            }}
          />
        ))}
    </div>
  )
}
