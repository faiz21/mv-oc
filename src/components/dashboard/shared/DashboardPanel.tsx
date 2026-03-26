'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardPanelProps {
  title: string
  count?: number
  isLive?: boolean
  isStale?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DashboardPanel({
  title,
  count,
  isLive,
  isStale,
  onRefresh,
  refreshing = false,
  collapsible = false,
  defaultCollapsed = false,
  actions,
  children,
  className,
}: DashboardPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div
      className={cn('rounded-2xl', className)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex-shrink-0 rounded-lg p-0.5 transition-colors hover:bg-white/5"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {collapsed ? (
                <ChevronDown size={14} style={{ color: 'var(--on-surface-variant)' }} />
              ) : (
                <ChevronUp size={14} style={{ color: 'var(--on-surface-variant)' }} />
              )}
            </button>
          )}

          <h2
            className="truncate text-[13px] font-semibold"
            style={{ color: 'var(--on-surface)' }}
          >
            {title}
            {count !== undefined && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  background: 'rgba(255,193,116,0.16)',
                  color: 'var(--primary)',
                }}
              >
                {count}
              </span>
            )}
          </h2>

          {/* Live / Stale indicator */}
          {isLive !== undefined && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={
                isStale
                  ? {
                      background: 'rgba(239,68,68,0.12)',
                      color: '#fca5a5',
                    }
                  : {
                      background: 'rgba(34,197,94,0.12)',
                      color: '#86efac',
                    }
              }
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/5 disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw
                size={14}
                className={refreshing ? 'animate-spin' : ''}
                style={{ color: 'var(--on-surface-variant)' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-5">{children}</div>
      )}
    </div>
  )
}
