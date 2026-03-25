'use client'

import { Bell, Search } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  title?: string
  pendingApprovals?: number
}

export function TopBar({ title, pendingApprovals = 0 }: TopBarProps) {
  return (
    <header
      className="h-12 flex items-center gap-4 px-5 flex-shrink-0"
      style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Search tasks...</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <Link
          href="/mission-control"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
        >
          <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
          {pendingApprovals > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
        </Link>
      </div>
    </header>
  )
}
