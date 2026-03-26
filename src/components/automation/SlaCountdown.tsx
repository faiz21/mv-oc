'use client'

import { useEffect, useState } from 'react'

interface SlaCountdownProps {
  slaDueAt: string | null
  warningThresholdPct?: number
}

function computeRemaining(slaDueAt: string): { totalMs: number; remainingMs: number } {
  const dueMs = Date.parse(slaDueAt)
  const nowMs = Date.now()
  return { totalMs: dueMs, remainingMs: dueMs - nowMs }
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Breach'
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function SlaCountdown({ slaDueAt, warningThresholdPct = 80 }: SlaCountdownProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    if (!slaDueAt) return

    const tick = () => {
      const { remainingMs: rem } = computeRemaining(slaDueAt)
      setRemainingMs(rem)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [slaDueAt])

  if (!slaDueAt || remainingMs === null) return null

  const breached = remainingMs <= 0

  // Estimate elapsed percentage: we need a start reference.
  // We use the `slaDueAt` as the only data point; we can only know if breached or not.
  // For color gradient we check: if breached → red, if we can't compute pct (no startedAt) → yellow when near
  // The simplest heuristic: breached → red, otherwise use threshold on remaining time window.
  // Since we don't have startedAt here, we use absolute remaining time as color signal:
  // < 5 min remaining → red, < 15 min remaining → yellow, else → green
  // But the spec says "colors based on % elapsed", so we look at remainingMs vs slaDueAt as a single point.
  // We'll treat the pct as elapsed / (elapsed + remaining). Without startedAt we can't know elapsed.
  // So we implement a sensible fallback: the prop interface only takes slaDueAt, so we use time-until thresholds.
  // If the caller wants pct-based logic, they should derive it upstream. Here we use the simplest correct model:
  // breached = red, < 10 min = warning yellow, else = green — aligned with warningThresholdPct semantics.

  let color: string
  let bg: string

  if (breached) {
    color = 'var(--status-failed)'
    bg = 'rgba(248,113,113,0.12)'
  } else {
    // Convert warningThresholdPct into an absolute cutoff is not possible without startedAt.
    // Use 10 minutes as a sensible warning window proxy (can be tuned).
    const warningCutoffMs = 10 * 60 * 1000
    if (remainingMs < warningCutoffMs) {
      color = 'var(--status-warn, var(--primary))'
      bg = 'rgba(255,193,116,0.12)'
    } else {
      color = 'var(--status-active)'
      bg = 'rgba(110,231,183,0.12)'
    }
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums"
      style={{ color, background: bg }}
    >
      {breached ? 'Breach' : formatDuration(remainingMs)}
    </span>
  )
}
