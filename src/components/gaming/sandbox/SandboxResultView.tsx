'use client'

import { CheckCircle, XCircle, Clock, Download } from 'lucide-react'

interface SandboxRunStep {
  id: string
  step_name: string
  status: string
  duration_ms?: number
  error_message?: string
}

interface SandboxRun {
  id: string
  status: string
  execution_time_ms: number | null
  error_message?: string
  steps?: SandboxRunStep[]
  [key: string]: unknown
}

interface SandboxResultViewProps {
  run: SandboxRun
}

export function SandboxResultView({ run }: SandboxResultViewProps) {
  function downloadResult() {
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sandbox-run-${run.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const succeeded = run.status === 'complete' || run.status === 'completed'
  const steps = run.steps || []

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: succeeded ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)' }}
      >
        <div className="flex items-center gap-3">
          {succeeded
            ? <CheckCircle size={18} style={{ color: '#4ade80' }} />
            : <XCircle size={18} style={{ color: '#f87171' }} />}
          <span className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            {succeeded ? 'Sandbox run completed' : 'Sandbox run failed'}
          </span>
          {run.execution_time_ms && (
            <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              <Clock size={12} />
              {(run.execution_time_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] uppercase tracking-wider"
            style={{ background: 'rgba(255,193,116,0.1)', color: 'var(--primary)' }}
          >
            Sandbox — No Production Impact
          </span>
          <button
            onClick={downloadResult}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <Download size={12} />
            Download
          </button>
        </div>
      </div>

      {/* Steps timeline */}
      {steps.length > 0 && (
        <div className="px-5 py-4">
          <div className="mb-3 text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Execution Log ({steps.length} steps)
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'var(--surface-container-low)' }}
              >
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: step.status === 'completed' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                    color: step.status === 'completed' ? '#4ade80' : '#f87171',
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                    {step.step_name}
                  </div>
                  {step.duration_ms && (
                    <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {step.duration_ms}ms
                    </div>
                  )}
                  {step.error_message && (
                    <div className="mt-1 text-[12px]" style={{ color: '#f87171' }}>
                      {step.error_message}
                    </div>
                  )}
                </div>
                <div
                  className="rounded-full px-2 py-0.5 text-[10px] uppercase"
                  style={{
                    background: step.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                    color: step.status === 'completed' ? '#4ade80' : '#f87171',
                  }}
                >
                  {step.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {run.error_message && (
        <div className="px-5 pb-4">
          <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
            {run.error_message}
          </div>
        </div>
      )}
    </div>
  )
}
