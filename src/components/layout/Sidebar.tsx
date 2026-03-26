'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BookOpenText,
  Bot,
  CalendarCheck,
  ChevronRight,
  Gamepad2,
  GitBranch,
  Inbox,
  LayoutGrid,
  LogOut,
  MessageSquareDot,
  Radar,
  Settings,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleMeta } from '@/lib/module-meta'
import { canAccessAdminSurface, type StoredRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/client'
import { DepartmentSwitcher } from '@/components/layout/DepartmentSwitcher'

interface SidebarProps {
  userRole?: StoredRole
  userName?: string
  userEmail?: string
  pendingApprovals?: number
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  '/hub':              <LayoutGrid size={17} />,
  '/wiki':             <BookOpenText size={17} />,
  '/admin':            <Settings size={17} />,
  '/workflow-builder': <GitBranch size={17} />,
  '/dashboard':        <SlidersHorizontal size={17} />,
  '/daily-routines':   <CalendarCheck size={17} />,
  '/operations':       <Radar size={17} />,
  '/gaming-session':   <Gamepad2 size={17} />,
  '/feedback-hub':     <MessageSquareDot size={17} />,
  '/agent-builder':    <Bot size={17} />,
  '/mission-control':  <Inbox size={17} />,
}

export function Sidebar({ userRole, userName, userEmail, pendingApprovals = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleModules = moduleMeta.filter(
    (item) => !item.adminOnly || canAccessAdminSurface(userRole),
  )

  // Auto-open the module matching the current path
  const activeModule = visibleModules.find((m) => pathname.startsWith(m.href))
  const [openHref, setOpenHref] = useState<string | null>(activeModule?.href ?? null)

  // Keep open if navigating within the same module
  useEffect(() => {
    const active = visibleModules.find((m) => pathname.startsWith(m.href))
    if (active) setOpenHref(active.href)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleModule(href: string) {
    setOpenHref((prev) => (prev === href ? null : href))
  }

  return (
    <aside
      className="flex h-screen w-[256px] flex-shrink-0 flex-col"
      style={{
        background: 'var(--surface-container-low)',
        boxShadow: 'inset -1px 0 0 rgba(58,61,66,0.18)',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            background: 'rgba(30,98,176,0.14)',
            color: 'var(--mv-blue)',
            boxShadow: 'inset 0 0 0 1px rgba(30,98,176,0.18)',
          }}
        >
          MV
        </div>
        <div className="min-w-0">
          <div
            className="truncate text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--mv-blue)' }}
          >
            Machine Vision
          </div>
          <div className="truncate text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
            Companion OS
          </div>
        </div>
      </div>

      {/* Department Switcher */}
      <div className="px-2 pb-2">
        <DepartmentSwitcher />
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {visibleModules.map((mod) => {
            const isOpen = openHref === mod.href
            const isModuleActive = pathname.startsWith(mod.href)
            const icon = MODULE_ICONS[mod.href] ?? <Settings size={17} />
            const showBadge = mod.href === '/mission-control' && pendingApprovals > 0

            return (
              <div key={mod.href}>
                {/* L1 — Module row */}
                <button
                  onClick={() => toggleModule(mod.href)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{
                    color: isModuleActive ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  }}
                >
                  <span className="flex-shrink-0" style={{ color: isModuleActive ? 'var(--primary)' : 'inherit' }}>
                    {icon}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium">{mod.label}</span>
                  {showBadge && (
                    <span
                      className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: 'rgba(255,193,116,0.18)',
                        color: 'var(--primary)',
                      }}
                    >
                      {pendingApprovals}
                    </span>
                  )}
                  <ChevronRight
                    size={13}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      color: 'var(--on-surface-variant)',
                    }}
                  />
                </button>

                {/* L2 — Page rows */}
                {isOpen && mod.sections && mod.sections.length > 0 && (
                  <div className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l pl-4" style={{ borderColor: 'rgba(58,61,66,0.35)' }}>
                    {mod.sections.map((page) => {
                      const isPageActive =
                        pathname === page.href ||
                        (page.href.includes('#') && pathname === page.href.split('#')[0])

                      return (
                        <Link
                          key={page.href}
                          href={page.href}
                          className={cn(
                            'relative flex min-h-9 items-center rounded-lg px-3 text-[12px] transition-colors',
                            isPageActive ? 'font-medium' : 'hover:bg-white/5',
                          )}
                          style={{
                            color: isPageActive ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                            background: isPageActive ? 'var(--surface-container)' : 'transparent',
                          }}
                        >
                          {isPageActive && (
                            <span
                              className="absolute bottom-1.5 left-0 top-1.5 w-[1.5px] rounded-full"
                              style={{ background: 'var(--primary)' }}
                            />
                          )}
                          {page.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User profile card */}
      <div className="px-3 pb-4 pt-2">
        {(userName || userEmail) && (
          <div
            className="rounded-[18px] px-3 py-3"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
              >
                {(userName ?? userEmail ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                  {userName ?? userEmail}
                </div>
                <div className="truncate text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  {userName ? userEmail : 'Operator Node 01'}
                </div>
              </div>
            </div>
            <div className="mt-2.5 mb-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-colors hover:bg-white/5"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
