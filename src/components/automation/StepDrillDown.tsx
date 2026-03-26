'use client'

import { SlaCountdown } from './SlaCountdown'

export interface StepRecord {
  id: string
  stepName: string
  status: string
  startedAt: string | null
  completedAt: string | null
  slaDueAt: string | null
  error: string | null
}

interface StepDrillDownProps {
  runId: string
  runName: string
  steps: StepRecord[]
}

function formatDuration(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt) return null
  const endMs = completedAt ? Date.parse(completedAt) : Date.now()
  const diffMs = endMs - Date.parse(startedAt)
  if (diffMs < 0) return null
  const totalSec = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

interface StatusStyleResult {
  bg: string
  color: string
  pulse: boolean
  label: string
}

function getStatusStyle(status: string): StatusStyleResult {
  switch (status) {
    case 'running':
      return { bg: 'rgba(255,193,116,0.18)', color: 'var(--primary)', pulse: true, label: 'Running' }
    case 'complete':
    case 'completed':
      return { bg: 'rgba(110,231,183,0.18)', color: 'var(--status-active)', pulse: false, label: 'Complete' }
    case 'failed':
      return { bg: 'rgba(248,113,113,0.18)', color: 'var(--status-failed)', pulse: false, label: 'Failed' }
    case 'blocked':
      return { bg: 'rgba(251,146,60,0.18)', color: 'var(--status-warn, #fb923c)', pulse: false, label: 'Blocked' }
    case 'skipped':
      return { bg: 'rgba(148,163,184,0.12)', color: 'var(--secondary)', pulse: false, label: 'Skipped' }
    case 'cancelled':
      return { bg: 'rgba(148,163,184,0.12)', color: 'var(--secondary)', pulse: false, label: 'Cancelled' }
    case 'awaiting_approval':
      return { bg: 'rgba(255,193,116,0.12)', color: 'var(--primary)', pulse: false, label: 'Awaiting Approval' }
    case 'pending':
      return { bg: 'rgba(148,163,184,0.10)', color: 'var(--secondary)', pulse: false, label: 'Pending' }
    case 'ready':
      return { bg: 'rgba(110,231,183,0.10)', color: 'var(--status-active)', pulse: false, label: 'Ready' }
    default:
      return { bg: 'rgba(148,163,184,0.10)', color: 'var(--secondary)', pulse: false, label: status }
  }
}

export function StepDrillDown({ runName, steps }: StepDrillDownProps) {
  if (steps.length === 0) {
    return (
      <div
        className="rounded-[28px] border px-5 py-5"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
      >
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          Steps — {runName}
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--secondary)' }}>
          No steps recorded for this run yet.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-[28px] border px-5 py-5"
      style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
        Steps — {runName}
      </div>
      <div className="mt-4 space-y-2">
        {steps.map((step) => {
          const style = getStatusStyle(step.status)
          const duration = formatDuration(step.startedAt, step.completedAt)
          const isRunning = step.status === 'running'

          return (
            <div
              key={step.id}
              className="rounded-[16px] border px-4 py-3"
              style={{
                borderColor: 'var(--border-default)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]${style.pulse ? ' animate-pulse' : ''}`}
                    style={{ background: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                  {/* Step name */}
                  <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                    {step.stepName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Duration */}
                  {duration && (
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--secondary)' }}>
                      {duration}
                    </span>
                  )}
                  {/* SLA countdown only for running steps */}
                  {isRunning && step.slaDueAt && (
                    <SlaCountdown slaDueAt={step.slaDueAt} />
                  )}
                </div>
              </div>

              {/* Error box */}
              {step.status === 'failed' && step.error && (
                <div
                  className="mt-2 rounded-[12px] border px-3 py-2 text-[12px] font-mono leading-relaxed"
                  style={{
                    borderColor: 'rgba(248,113,113,0.25)',
                    background: 'rgba(248,113,113,0.08)',
                    color: 'var(--status-failed)',
                  }}
                >
                  {step.error}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
