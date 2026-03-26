'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SLATileProps {
  label: string
  startedAt: string | null
  slaDueAt: string | null
  warningPct: number
  breachPct: number
  onClick?: () => void
  className?: string
}

function computeSla(
  startedAt: string | null,
  slaDueAt: string | null,
  now: number,
  warningPct: number,
  breachPct: number,
): {
  pct: number
  state: 'on_track' | 'warning' | 'breach'
  remainingLabel: string
} {
  if (!startedAt || !slaDueAt) {
    return { pct: 0, state: 'on_track', remainingLabel: '—' }
  }

  const startMs = Date.parse(startedAt)
  const dueMs = Date.parse(slaDueAt)
  const total = dueMs - startMs

  if (total <= 0) {
    return { pct: 100, state: 'breach', remainingLabel: 'Overdue' }
  }

  const elapsed = now - startMs
  const pct = Math.min((elapsed / total) * 100, 999)

  const remaining = dueMs - now
  let remainingLabel: string

  if (remaining <= 0) {
    remainingLabel = 'Breached'
  } else {
    const secs = Math.floor(remaining / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)

    if (hours > 0) {
      remainingLabel = `${hours}h ${mins % 60}m left`
    } else if (mins > 0) {
      remainingLabel = `${mins}m ${secs % 60}s left`
    } else {
      remainingLabel = `${secs}s left`
    }
  }

  let state: 'on_track' | 'warning' | 'breach' = 'on_track'
  if (pct >= breachPct) state = 'breach'
  else if (pct >= warningPct) state = 'warning'

  return { pct, state, remainingLabel }
}

const STATE_COLORS = {
  on_track: {
    bar: '#22c55e',
    text: '#86efac',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
  },
  warning: {
    bar: '#f59e0b',
    text: '#fcd34d',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
  },
  breach: {
    bar: '#ef4444',
    text: '#fca5a5',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  },
}

export function SLATile({
  label,
  startedAt,
  slaDueAt,
  warningPct,
  breachPct,
  onClick,
  className,
}: SLATileProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { pct, state, remainingLabel } = computeSla(
    startedAt,
    slaDueAt,
    now,
    warningPct,
    breachPct,
  )

  const colors = STATE_COLORS[state]
  const displayPct = Math.min(pct, 100)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl p-4 text-left transition-opacity hover:opacity-90',
        className,
      )}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="truncate text-[13px] font-medium leading-tight"
          style={{ color: 'var(--on-surface)' }}
          title={label}
        >
          {label}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: colors.bar + '22', color: colors.text }}
        >
          {state === 'on_track' ? 'On Track' : state === 'warning' ? 'Warning' : 'Breach'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${displayPct}%`,
            background: colors.bar,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className="text-[11px]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {pct.toFixed(0)}% consumed
        </span>
        <span
          className="text-[11px] font-medium"
          style={{ color: colors.text }}
        >
          {remainingLabel}
        </span>
      </div>
    </button>
  )
}
