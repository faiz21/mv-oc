'use client'

import { useState } from 'react'
import { Play, Download } from 'lucide-react'
import { SandboxResultView } from './SandboxResultView'

interface SandboxRun {
  id: string
  status: string
  execution_time_ms: number | null
  [key: string]: unknown
}

interface WorkflowRunnerProps {
  workflows: Array<{ id: string; name: string }>
  initialScenario?: { name: string; payload: string } | null
}

export function WorkflowRunner({ workflows, initialScenario }: WorkflowRunnerProps) {
  const [workflowId, setWorkflowId] = useState('')
  const [payload, setPayload] = useState(initialScenario?.payload || '{\n  "input": "example"\n}')
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [result, setResult] = useState<SandboxRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  function validatePayload(val: string) {
    try { JSON.parse(val); setPayloadError(null) }
    catch { setPayloadError('Invalid JSON') }
  }

  async function handleRun() {
    if (!workflowId) { setError('Please select a workflow'); return }
    try { JSON.parse(payload) } catch { setError('Fix JSON payload first'); return }

    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/gaming/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId, mock_payload: JSON.parse(payload) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Run failed'); return }

      setRunId(data.sandbox_run_id)

      // Poll for result
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const r = await fetch(`/api/gaming/sandbox/runs/${data.sandbox_run_id}`)
        const run: SandboxRun = await r.json()
        if (run.status === 'complete' || run.status === 'completed' || run.status === 'failed') {
          clearInterval(poll)
          setResult(run)
          setRunning(false)
        }
        if (attempts > 30) { clearInterval(poll); setRunning(false) }
      }, 1000)
    } catch (err) {
      setError(String(err))
      setRunning(false)
    }
  }

  // Suppress unused variable warning — runId used for future reference
  void runId

  return (
    <div className="space-y-5">
      {/* Workflow selector */}
      <div>
        <label className="mb-2 block text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          Workflow
        </label>
        <select
          value={workflowId}
          onChange={e => setWorkflowId(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <option value="">Select a workflow...</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* JSON payload editor */}
      <div>
        <label className="mb-2 block text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          Mock Payload (JSON)
        </label>
        <textarea
          value={payload}
          onChange={e => { setPayload(e.target.value); validatePayload(e.target.value) }}
          rows={6}
          className="w-full rounded-xl px-4 py-3 font-mono text-[13px] outline-none resize-y"
          style={{
            background: 'var(--surface-container)',
            color: 'var(--on-surface)',
            border: `1px solid ${payloadError ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.06)'}`,
          }}
          spellCheck={false}
        />
        {payloadError && (
          <div className="mt-1 text-[12px]" style={{ color: '#f87171' }}>{payloadError}</div>
        )}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={running || !workflowId}
        className="flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-medium transition-colors disabled:opacity-50"
        style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
      >
        <Play size={16} />
        {running ? 'Running sandbox...' : 'Run Sandbox'}
      </button>

      {running && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ background: 'var(--surface-container-low)' }}>
          <div className="h-3 w-3 animate-spin rounded-full border-2" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          <span className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            Executing sandbox workflow...
          </span>
        </div>
      )}

      {result && <SandboxResultView run={result} />}
    </div>
  )
}
