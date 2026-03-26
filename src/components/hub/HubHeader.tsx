'use client'

import { useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useUser } from '@/components/providers/user-provider'
import { useHubRealtime } from '@/features/hub/contexts/HubRealtimeContext'
import { HubLiveSync } from '@/components/hub/HubLiveSync'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function scrollToApprovals() {
  const el = document.getElementById('approval-queue')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HubHeader() {
  const user = useUser()
  const { approvalQueue } = useHubRealtime()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const pendingApprovals = approvalQueue.filter((a) => a.status === 'awaiting_review').length
  const firstName = user.fullName?.split(' ')[0] ?? user.email.split('@')[0] ?? 'there'
  const greeting = getGreeting()

  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{ background: 'rgba(17,19,23,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3">
        {/* Left: branding + welcome */}
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="hidden text-[11px] uppercase tracking-[0.18em] sm:block"
            style={{ color: 'var(--primary)' }}
          >
            Hub
          </div>
          <h1
            className="truncate font-display text-[18px] font-semibold tracking-[-0.03em] sm:text-[20px]"
            style={{ color: 'var(--on-surface)' }}
          >
            {greeting}, {firstName}
          </h1>
        </div>

        {/* Right: live sync + approval badge + user menu */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <HubLiveSync />

          {/* Approval badge */}
          <button
            type="button"
            onClick={scrollToApprovals}
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'rgba(17,19,23,0.5)' }}
            aria-label={`${pendingApprovals} pending approvals`}
          >
            <Bell size={16} style={{ color: 'var(--on-surface)' }} />
            {pendingApprovals > 0 && (
              <span
                className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: '#f97316', color: '#fff' }}
              >
                {pendingApprovals > 99 ? '99+' : pendingApprovals}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex min-h-[36px] items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-opacity hover:opacity-80"
              style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--on-surface)' }}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase"
                style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
              >
                {firstName[0]}
              </span>
              <span className="hidden sm:block max-w-[100px] truncate">{firstName}</span>
              <ChevronDown size={12} style={{ color: 'var(--on-surface-variant)' }} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-2 shadow-lg"
                style={{
                  background: 'var(--surface-container)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="mb-2 border-b px-3 py-2"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="truncate text-[12px] font-semibold"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {user.fullName ?? user.email}
                  </div>
                  <div
                    className="truncate text-[11px]"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {user.role}
                  </div>
                </div>

                <a
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--on-surface)' }}
                >
                  <User size={14} />
                  Profile
                </a>
                <a
                  href="/logout"
                  className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--status-failed)' }}
                >
                  <LogOut size={14} />
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
