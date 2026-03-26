import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  tone?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  tone,
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  const trendColor =
    trend === 'up'
      ? 'var(--status-failed)'
      : trend === 'down'
        ? 'var(--status-complete)'
        : 'var(--on-surface-variant)'

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div
      className={cn('rounded-2xl px-5 py-4', className)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: tone ?? 'var(--primary)' }}>{icon}</span>
        )}
      </div>

      <div className="mt-2 flex items-end gap-2">
        <span
          className="font-display text-[28px] font-semibold leading-none tracking-[-0.04em]"
          style={{ color: tone ?? 'var(--on-surface)' }}
        >
          {value}
        </span>

        {trend && trendValue && (
          <span
            className="mb-0.5 text-[12px] font-medium"
            style={{ color: trendColor }}
          >
            {trendArrow} {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}
