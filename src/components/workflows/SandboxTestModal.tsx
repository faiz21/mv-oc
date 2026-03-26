'use client'

import { useState } from 'react'
import { FlaskConical, Play, X, Download } from 'lucide-react'
import { runSandboxTest, type SandboxStepResult } from '@/features/workflows/api'

interface SandboxTestModalProps {
  workflowId: string
  open: boolean
  onClose: () => void
}

export function SandboxTestModal({ workflowId, open, onClose }: SandboxTestModalProps) {
  const [payload, setPayload] = useState('{\n  \n}')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<SandboxStepResult[] | null>(null)
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleRun() {
    setRunning(true)
    setError(null)
    setResults(null)
    setFinalStatus(null)

    let parsedPayload: Record<string, unknown> = {}
    try {
      parsedPayload = JSON.parse(payload) as Record<string, unknown>
    } catch {
      setError('Invalid JSON payload.')
      setRunning(false)
      return
    }

    const result = await runSandboxTest(workflowId, parsedPayload)
    if (result.ok) {
      setResults(result.data.predictedProgression)
      setFinalStatus(result.data.finalStatus)
    } else {
      setError(result.errors.join(', '))
    }
    setRunning(false)
  }

  function handleExport() {
    if (!results) return
    const blob = new Blob([JSON.stringify({ predictedProgression: results, finalStatus }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sandbox-${workflowId}-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleClose() {
    setResults(null)
    setFinalStatus(null)
    setError(null)
    onClose()
  }

  const statusColors: Record<string, string> = {
    completed: 'var(--status-active)',
    awaiting_approval: 'var(--tertiary)',
    failed: '#ef4444',
    skipped: 'var(--on-surface-variant)',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sandbox-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-full max-w-xl rounded-[28px] p-6"
        style={{ background: 'var(--surface-container)' }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical size={20} style={{ color: 'var(--primary)' }} />
            <h2 id="sandbox-title" className="font-display text-[20px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--on-surface)' }}>
              Sandbox Test Run
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            aria-label="Close sandbox modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sandbox notice */}
        <div
          className="mb-5 rounded-[18px] px-4 py-3 text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--secondary)' }}
        >
          Sandbox mode -- no production data affected. Results saved to sandbox_runs/sandbox_artifacts only.
        </div>

        {/* Input payload editor */}
        <div className="mb-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
            Input payload (JSON)
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="min-h-[100px] w-full rounded-[18px] px-4 py-3 font-mono text-[12px] outline-none"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-[18px] px-4 py-3 text-[13px]" style={{ background: 'rgba(248,113,113,0.14)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {/* Results timeline */}
        {results && (
          <div className="mb-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
              Execution timeline
            </div>
            <div className="space-y-2">
              {results.map((step, index) => (
                <div
                  key={step.stepId}
                  className="rounded-[18px] px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                        {index + 1}.
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                        {step.stepName}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}
                      >
                        {step.stepType}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: statusColors[step.status] ?? 'var(--on-surface-variant)' }}>
                      {step.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {step.output && Object.keys(step.output).length > 0 && (
                    <div className="mt-2 rounded-[12px] px-3 py-2 font-mono text-[11px]" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                      {JSON.stringify(step.output, null, 2)}
                    </div>
                  )}

                  {step.error && (
                    <div className="mt-2 text-[12px]" style={{ color: '#ef4444' }}>
                      {step.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {finalStatus && (
              <div
                className="mt-3 rounded-[18px] px-4 py-3 text-sm font-medium"
                style={{
                  background: finalStatus === 'completed' ? 'rgba(110,231,183,0.10)' : 'rgba(255,193,7,0.10)',
                  color: finalStatus === 'completed' ? 'var(--status-active)' : 'var(--tertiary)',
                }}
              >
                Final status: {finalStatus.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              color: 'var(--on-primary-container)',
            }}
          >
            <Play size={15} />
            {running ? 'Running...' : results ? 'Run Again' : 'Run Test'}
          </button>

          {results && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
            >
              <Download size={14} />
              Export JSON
            </button>
          )}

          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
