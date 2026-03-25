import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export function getSlaState(slaDueAt: string | null): 'ok' | 'warning' | 'breach' {
  if (!slaDueAt) return 'ok'
  const now = new Date()
  const due = new Date(slaDueAt)
  const totalMs = due.getTime() - now.getTime()
  const pct = totalMs / (due.getTime() - now.getTime())
  if (totalMs < 0) return 'breach'
  if (pct < 0.2) return 'warning'
  return 'ok'
}

export function getSlaColor(state: 'ok' | 'warning' | 'breach'): string {
  if (state === 'breach') return 'text-red-400'
  if (state === 'warning') return 'text-amber-400'
  return 'text-emerald-400'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}
