'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GitBranch,
  Inbox,
  Activity,
  Settings,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  badge?: number
}

interface SidebarProps {
  userRole?: string
  pendingApprovals?: number
  userName?: string
  userEmail?: string
}

export function Sidebar({ userRole, pendingApprovals = 0, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      label: 'Hub',
      href: '/hub',
      icon: <LayoutGrid size={18} />,
    },
    {
      label: 'Workflows',
      href: '/workflows',
      icon: <GitBranch size={18} />,
    },
    {
      label: 'Inbox',
      href: '/mission-control',
      icon: <Inbox size={18} />,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    {
      label: 'Active Runs',
      href: '/dashboard',
      icon: <Activity size={18} />,
    },
    {
      label: 'Settings',
      href: '/admin',
      icon: <Settings size={18} />,
      adminOnly: true,
    },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  )

  return (
    <aside
      className="flex flex-col h-full w-[160px] flex-shrink-0"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          MV
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            MV-OS
          </div>
          <div className="text-[10px] uppercase tracking-widest leading-tight" style={{ color: 'var(--text-muted)' }}>
            Operations
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors relative group',
                isActive
                  ? 'font-medium'
                  : 'hover:bg-[var(--bg-hover)]'
              )}
              style={
                isActive
                  ? {
                      background: 'var(--nav-active-bg)',
                      color: 'var(--text-primary)',
                      borderLeft: '2px solid var(--nav-active)',
                    }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span style={{ color: isActive ? 'var(--nav-active)' : undefined }}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight
                  size={12}
                  className="ml-auto opacity-40"
                  style={{ color: 'var(--nav-active)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      {(userName || userEmail) && (
        <div
          className="px-3 py-3 flex items-center gap-2.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            {(userName ?? userEmail ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {userName ?? userEmail}
            </div>
            {userName && (
              <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {userEmail}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
