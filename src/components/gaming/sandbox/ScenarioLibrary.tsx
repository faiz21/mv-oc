'use client'

import { Play } from 'lucide-react'

const SCENARIOS = [
  {
    name: 'Agent Timeout',
    description: 'Simulate an agent taking > 30 seconds. Tests timeout handling.',
    expectedOutcome: 'Workflow halts with timeout error',
    payload: '{"simulate": "timeout", "delay_ms": 35000}',
  },
  {
    name: 'Malformed Input',
    description: 'Send an invalid payload. Tests error recovery.',
    expectedOutcome: 'Workflow fails gracefully with validation error',
    payload: '{"invalid_field": null, "missing_required": true}',
  },
  {
    name: 'Empty Data Set',
    description: 'Workflow runs with null/empty required fields.',
    expectedOutcome: 'Graceful degradation with empty result',
    payload: '{"items": [], "data": null}',
  },
  {
    name: 'High Volume',
    description: 'Sequential 10 tasks back-to-back. Tests queuing behavior.',
    expectedOutcome: 'All tasks process in sequence',
    payload: '{"batch_size": 10, "mode": "sequential"}',
  },
  {
    name: 'Agent Rejection',
    description: 'Agent explicitly rejects the task.',
    expectedOutcome: 'Workflow routes to rejection handler',
    payload: '{"force_rejection": true, "reason": "out_of_scope"}',
  },
  {
    name: 'Missing Approval',
    description: 'Payload requiring approval gate. Tests approval pause behavior in sandbox.',
    expectedOutcome: 'Workflow pauses at approval gate (no real approval sent)',
    payload: '{"requires_approval": true, "action": "publish_document", "document_id": "doc-sandbox-01"}',
  },
]

interface ScenarioLibraryProps {
  onRunScenario: (scenario: { name: string; payload: string }) => void
}

export function ScenarioLibrary({ onRunScenario }: ScenarioLibraryProps) {
  return (
    <div className="space-y-3">
      <div className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
        Pre-built scenarios for testing edge cases. Select one to auto-populate the workflow runner.
      </div>
      {SCENARIOS.map(scenario => (
        <div
          key={scenario.name}
          className="flex items-start justify-between gap-4 rounded-2xl p-4"
          style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex-1">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
              {scenario.name}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
              {scenario.description}
            </div>
            <div className="mt-1.5 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Expected: <span style={{ color: 'var(--on-surface)' }}>{scenario.expectedOutcome}</span>
            </div>
          </div>
          <button
            onClick={() => onRunScenario({ name: scenario.name, payload: scenario.payload })}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-colors"
            style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
          >
            <Play size={13} />
            Run
          </button>
        </div>
      ))}
    </div>
  )
}
