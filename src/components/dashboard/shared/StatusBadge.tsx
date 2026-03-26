import { cn } from '@/lib/utils'

type StatusVariant =
  | 'running'
  | 'pending'
  | 'complete'
  | 'failed'
  | 'warning'
  | 'breach'
  | 'on_track'
  | 'active'
  | 'inactive'
  | 'unreachable'
  | 'awaiting_approval'
  | 'paused'
  | 'cancelled'
  | 'default'

interface StatusBadgeProps {
  status: StatusVariant | string
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

const VARIANT_STYLES: Record<
  string,
  { dot: string; text: string; bg: string }
> = {
  running: {
    dot: '#3b82f6',
    text: '#93c5fd',
    bg: 'rgba(59,130,246,0.12)',
  },
  pending: {
    dot: '#6b7280',
    text: '#9ca3af',
    bg: 'rgba(107,114,128,0.12)',
  },
  complete: {
    dot: '#22c55e',
    text: '#86efac',
    bg: 'rgba(34,197,94,0.12)',
  },
  failed: {
    dot: '#ef4444',
    text: '#fca5a5',
    bg: 'rgba(239,68,68,0.12)',
  },
  warning: {
    dot: '#f59e0b',
    text: '#fcd34d',
    bg: 'rgba(245,158,11,0.12)',
  },
  breach: {
    dot: '#ef4444',
    text: '#fca5a5',
    bg: 'rgba(239,68,68,0.16)',
  },
  on_track: {
    dot: '#22c55e',
    text: '#86efac',
    bg: 'rgba(34,197,94,0.10)',
  },
  active: {
    dot: '#22c55e',
    text: '#86efac',
    bg: 'rgba(34,197,94,0.10)',
  },
  inactive: {
    dot: '#6b7280',
    text: '#9ca3af',
    bg: 'rgba(107,114,128,0.10)',
  },
  unreachable: {
    dot: '#ef4444',
    text: '#fca5a5',
    bg: 'rgba(239,68,68,0.12)',
  },
  awaiting_approval: {
    dot: '#f59e0b',
    text: '#fcd34d',
    bg: 'rgba(245,158,11,0.12)',
  },
  paused: {
    dot: '#8b5cf6',
    text: '#c4b5fd',
    bg: 'rgba(139,92,246,0.12)',
  },
  cancelled: {
    dot: '#6b7280',
    text: '#9ca3af',
    bg: 'rgba(107,114,128,0.10)',
  },
  default: {
    dot: '#6b7280',
    text: '#9ca3af',
    bg: 'rgba(107,114,128,0.10)',
  },
}

function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const styles = VARIANT_STYLES[status] ?? VARIANT_STYLES['default']
  const displayLabel = label ?? getStatusLabel(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        className,
      )}
      style={{ background: styles.bg, color: styles.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ background: styles.dot }}
        aria-hidden="true"
      />
      {displayLabel}
    </span>
  )
}
