'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import {
  createDefaultWorkflowDocument,
  createEditorEdge,
  createEditorNode,
  defaultNodeData,
  type WorkflowEditorDocument,
  type WorkflowNodeType,
} from '@/features/workflows/editor-model'
import { generateAIDraft, type AIDraftResponse } from '@/features/workflows/api'

interface AIDraftModalProps {
  open: boolean
  onClose: () => void
  onApply: (document: WorkflowEditorDocument) => void
}

export function AIDraftModal({ open, onClose, onApply }: AIDraftModalProps) {
  const [requirement, setRequirement] = useState('')
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState<AIDraftResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleGenerate() {
    if (!requirement.trim()) return
    setGenerating(true)
    setError(null)
    setDraft(null)

    const result = await generateAIDraft(requirement)
    if (result.ok) {
      setDraft(result.data)
    } else {
      setError(result.errors.join(', '))
    }
    setGenerating(false)
  }

  function handleApplyDraft() {
    if (!draft) return

    const doc = draftToDocument(draft)
    onApply(doc)
  }

  function handleSkip() {
    onApply(createDefaultWorkflowDocument())
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] p-6"
        style={{ background: 'var(--surface-container)' }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <h2 id="ai-draft-title" className="font-display text-[20px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--on-surface)' }}>
              Create Workflow
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed" style={{ color: 'var(--secondary)' }}>
          Describe what your workflow should do. The AI will generate a draft structure
          you can refine on the canvas.
        </p>

        {/* Requirement input */}
        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder='e.g. "When a Discord message contains urgent, triage it and send a notification"'
          className="mb-4 min-h-[120px] w-full rounded-[18px] px-4 py-3 outline-none"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        />

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-[18px] px-4 py-3 text-[13px]" style={{ background: 'rgba(248,113,113,0.14)', color: '#ef4444' }}>
            {error}. You can still create manually.
          </div>
        )}

        {/* Draft preview */}
        {draft && (
          <div className="mb-4 rounded-[18px] px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
              Generated draft
            </div>
            <div className="mt-2 text-[15px] font-semibold" style={{ color: 'var(--on-surface)' }}>
              {draft.workflowName}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--secondary)' }}>
              {draft.description}
            </div>
            <div className="mt-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              {draft.steps.length} step{draft.steps.length !== 1 ? 's' : ''} generated:
            </div>
            <div className="mt-2 space-y-1">
              {draft.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--on-surface)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{i + 1}.</span>
                  <span>{step.name}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] uppercase" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}>
                    {step.type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!draft ? (
            <button
              onClick={handleGenerate}
              disabled={generating || !requirement.trim()}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                color: 'var(--on-primary-container)',
              }}
            >
              <Sparkles size={15} />
              {generating ? 'Generating...' : 'Generate Draft'}
            </button>
          ) : (
            <button
              onClick={handleApplyDraft}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                color: 'var(--on-primary-container)',
              }}
            >
              Apply to Canvas
            </button>
          )}

          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
          >
            Create Manually
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Convert an AI draft response into a WorkflowEditorDocument with
 * properly positioned nodes and edges.
 */
function draftToDocument(draft: AIDraftResponse): WorkflowEditorDocument {
  const nodeSpacingX = 280
  const startY = 120

  // Build nodes: start + draft steps + end
  const nodes = [
    createEditorNode('start-node', 'start', { x: 48, y: startY }, { label: 'Start', triggerType: 'manual' }),
  ]

  for (let i = 0; i < draft.steps.length; i++) {
    const step = draft.steps[i]
    const nodeType = mapStepType(step.type)
    const nodeId = `step-${i}-${Date.now()}`
    const x = 48 + (i + 1) * nodeSpacingX
    const data = {
      ...defaultNodeData(nodeType),
      label: step.name,
      ...step.config,
    }
    nodes.push(createEditorNode(nodeId, nodeType, { x, y: startY }, data))
  }

  nodes.push(
    createEditorNode('end-node', 'end', { x: 48 + (draft.steps.length + 1) * nodeSpacingX, y: startY }, { label: 'End', outputType: 'internal' }),
  )

  // Build edges connecting all nodes in sequence
  const edges = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push(createEditorEdge(`edge-${i}`, nodes[i].id, nodes[i + 1].id))
  }

  return {
    settings: {
      name: draft.workflowName,
      key: draft.workflowName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'ai-draft',
      description: draft.description,
      primaryAgentId: null,
      requiresApproval: false,
      requiresApprovalReason: '',
      status: 'draft',
      triggerType: (draft.triggerType as 'manual' | 'webhook' | 'cron' | 'channel-message') || 'manual',
    },
    nodes,
    edges,
  }
}

function mapStepType(type: string): WorkflowNodeType {
  const map: Record<string, WorkflowNodeType> = {
    'agent-task': 'agent_task',
    'agent_task': 'agent_task',
    'approval-gate': 'approval_gate',
    'approval_gate': 'approval_gate',
    'parallel-branch': 'parallel_branch',
    'parallel_branch': 'parallel_branch',
    'wait-join': 'wait_join',
    'wait_join': 'wait_join',
    'webhook-trigger': 'webhook_trigger',
    'webhook_trigger': 'webhook_trigger',
  }
  return map[type] ?? 'agent_task'
}
