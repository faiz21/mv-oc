'use client'

import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'

interface SlaCountdownProps {
  expiresAt: string | null
}

function computeRemaining(expiresAt: string | null): { label: string; tone: string } {
  if (!expiresAt) {
    return { label: 'No deadline', tone: 'var(--on-surface-variant)' }
  }

  const diffMs = Date.parse(expiresAt) - Date.now()

  if (diffMs <= 0) {
    return { label: 'Breaching', tone: 'var(--status-failed)' }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let label: string
  if (hours > 0) {
    label = minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`
  } else if (minutes > 0) {
    label = seconds > 0 ? `${minutes}m ${seconds}s left` : `${minutes}m left`
  } else {
    label = `${seconds}s left`
  }

  const tone =
    diffMs <= 4 * 60 * 60 * 1000
      ? 'var(--status-running)'
      : 'var(--on-surface-variant)'

  return { label, tone }
}

export function SlaCountdown({ expiresAt }: SlaCountdownProps) {
  const [state, setState] = useState(() => computeRemaining(expiresAt))

  useEffect(() => {
    if (!expiresAt) return

    setState(computeRemaining(expiresAt))

    const interval = window.setInterval(() => {
      setState(computeRemaining(expiresAt))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [expiresAt])

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em]"
      style={{ background: `color-mix(in srgb, ${state.tone} 12%, transparent)`, color: state.tone }}
    >
      <Clock3 size={14} />
      {state.label}
    </div>
  )
}
