'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Heart, Activity, Settings } from 'lucide-react'
import type { CanonicalRole } from '@/lib/roles'
import { canReviewOperations, isAdmin } from '@/lib/roles'

interface DailyRoutinesNavProps {
  userRole: CanonicalRole
}

export function DailyRoutinesNav({ userRole }: DailyRoutinesNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/daily-routines', label: 'Today', icon: <Calendar size={16} /> },
    { href: '/daily-routines/archive', label: 'Archive', icon: <Heart size={16} /> },
    ...(canReviewOperations(userRole)
      ? [{ href: '/daily-routines/team-health', label: 'Team Health', icon: <Activity size={16} /> }]
      : []),
    ...(isAdmin(userRole)
      ? [{ href: '/daily-routines/admin', label: 'Settings', icon: <Settings size={16} /> }]
      : []),
  ]

  return (
    <nav
      className="hidden w-48 shrink-0 border-r p-4 md:block"
      style={{
        background: 'var(--surface-container-low)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <p
        className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        Daily Routines
      </p>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/daily-routines'
              ? pathname === '/daily-routines'
              : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-container-high)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
