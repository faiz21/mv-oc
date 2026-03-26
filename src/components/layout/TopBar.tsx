'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Search, Settings, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getModuleMeta, moduleMeta } from '@/lib/module-meta'
import { canAccessAdminSurface, getRoleLabel, type StoredRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/client'

interface TopBarProps {
  pendingApprovals?: number
  userRole?: StoredRole
  userName?: string
  userEmail?: string
}

export function TopBar({ pendingApprovals = 0, userRole, userName, userEmail }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeModule = getModuleMeta(pathname)
  const visibleModules = moduleMeta.filter((item) => !item.adminOnly || canAccessAdminSurface(userRole))

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const secondary =
    pathname.startsWith('/mission-control')
      ? `${pendingApprovals} Pending Approvals`
      : activeModule.secondaryText?.toUpperCase()

  return (
    <header
      className="sticky top-0 z-40 flex h-[52px] items-center justify-between px-4 sm:px-6 lg:px-8"
      style={{
        background: 'rgba(26,28,32,0.88)',
        backdropFilter: 'blur(18px)',
        boxShadow: 'inset 0 -1px 0 rgba(58,61,66,0.18)',
      }}
    >
      <div className="flex min-w-0 items-center gap-4 lg:gap-8">
        <Link href="/hub" className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
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
              className="truncate text-[13px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--mv-blue)' }}
            >
              Machine Vision
            </div>
            <div className="truncate text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
              Companion OS
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {visibleModules.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] transition-colors',
                  isActive ? 'font-medium' : '',
                )}
                style={{
                  color: isActive ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  background: isActive ? 'rgba(255,193,116,0.08)' : 'transparent',
                }}
              >
                <span>{item.label}</span>
                {item.href === '/mission-control' && pendingApprovals > 0 ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: 'rgba(255,193,116,0.18)',
                      color: 'var(--primary)',
                    }}
                  >
                    {pendingApprovals}
                  </span>
                ) : null}
                {isActive ? (
                  <span
                    className="absolute inset-x-4 bottom-1 h-[2px] rounded-full"
                    style={{ background: 'var(--primary)' }}
                  />
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div
          className="hidden h-10 min-w-[240px] items-center gap-3 rounded-full px-4 xl:flex"
          style={{ background: 'rgba(17,19,23,0.88)' }}
        >
          <Search size={16} style={{ color: 'var(--on-surface-variant)' }} />
          <span className="truncate text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {activeModule.searchPlaceholder}
          </span>
        </div>

        <div className="hidden min-w-0 text-right md:block">
          {secondary ? (
            <div className="truncate text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
              {secondary}
            </div>
          ) : null}
          <div className="truncate font-display text-[16px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            {activeModule.title}
          </div>
        </div>

        <Link
          href="/mission-control"
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(17,19,23,0.88)' }}
        >
          <Bell size={18} style={{ color: 'var(--secondary)' }} />
          {pendingApprovals > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          ) : null}
        </Link>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            style={{ background: profileOpen ? 'rgba(255,193,116,0.1)' : 'rgba(17,19,23,0.88)' }}
            aria-label="User profile menu"
          >
            {userName || userEmail ? (
              <span className="text-[13px] font-semibold" style={{ color: 'var(--primary)' }}>
                {(userName ?? userEmail ?? '?').charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserCircle2 size={22} style={{ color: 'var(--secondary)' }} />
            )}
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-[18px] py-2 animate-atelier-fade-up"
              style={{
                background: 'rgba(26,28,32,0.97)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Identity block */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="truncate text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                  {userName ?? userEmail ?? 'Operator'}
                </div>
                {userName && userEmail && (
                  <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                    {userEmail}
                  </div>
                )}
                <div
                  className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                  style={{ background: 'rgba(255,193,116,0.1)', color: 'var(--primary)' }}
                >
                  {getRoleLabel(userRole)}
                </div>
              </div>

              {/* Admin settings link */}
              {canAccessAdminSurface(userRole) && (
                <Link
                  href="/admin/users"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  <Settings size={15} />
                  Team settings
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
