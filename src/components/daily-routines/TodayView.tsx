'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DailyRitualForms } from './DailyRitualForms'
import type { Tables } from '@/types'
import type { AuthUser } from '@/lib/data/auth'

type DailyEntry = Tables<'daily_entries'>
type Exclusion = Tables<'daily_routines_exclusions'>

interface TeamStandup extends DailyEntry {
  profiles: { full_name: string | null } | null
}

interface SharedGratitude extends DailyEntry {
  profiles: { full_name: string | null } | null
}

interface TodayViewProps {
  user: AuthUser
  today: string
  submittedTypes: string[]
  standupEntry: DailyEntry | null
  checkInEntry: DailyEntry | null
  gratitudeEntry: DailyEntry | null
  teamStandups: TeamStandup[]
  sharedGratitude: SharedGratitude[]
  exclusion: Exclusion | null
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TodayView({
  user,
  today,
  submittedTypes,
  standupEntry,
  checkInEntry,
  gratitudeEntry,
  teamStandups,
  sharedGratitude,
  exclusion,
}: TodayViewProps) {
  const router = useRouter()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  // Realtime: refresh page when new submissions arrive
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`daily_routines:today:${today}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_entries' },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [today, router])

  const standupCount = teamStandups.length
  const todayGratitude = sharedGratitude.filter((g) => g.date === today)
  const olderGratitude = sharedGratitude.filter((g) => g.date !== today)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          Daily Routines
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          {new Date(today).toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Forms column */}
        <div>
          <DailyRitualForms
            submittedTypes={submittedTypes}
            standupEntry={standupEntry}
            checkInEntry={checkInEntry}
            gratitudeEntry={gratitudeEntry}
            exclusion={exclusion}
          />
        </div>

        {/* Feed column */}
        <aside className="space-y-6">
          {/* Today's Standups */}
          <section
            className="rounded-[24px] p-5"
            style={{ background: 'var(--surface-container)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-[13px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Today&apos;s Standups
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--on-surface-variant)',
                }}
              >
                {standupCount} submitted
              </span>
            </div>

            {teamStandups.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                No standups yet. Be the first!
              </p>
            ) : (
              <ul className="space-y-3">
                {teamStandups.map((entry) => {
                  const c = entry.content as {
                    yesterday?: string
                    today?: string
                    blockers?: string
                  }
                  const name = entry.profiles?.full_name ?? 'Team Member'
                  return (
                    <li
                      key={entry.id}
                      className="rounded-[16px] p-3"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: 'var(--on-surface)' }}
                        >
                          {name}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--on-surface-variant)' }}
                        >
                          {formatTime(entry.created_at)}
                        </span>
                      </div>
                      {c.today && (
                        <p
                          className="text-[12px] leading-5 line-clamp-2"
                          style={{ color: 'var(--on-surface-variant)' }}
                        >
                          {c.today}
                        </p>
                      )}
                      {c.blockers && (
                        <p
                          className="mt-1 text-[11px]"
                          style={{ color: 'var(--status-running, #fbbf24)' }}
                        >
                          Blockers: {c.blockers}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Shared Gratitude */}
          <section
            className="rounded-[24px] p-5"
            style={{ background: 'var(--surface-container)' }}
          >
            <h2
              className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Shared Gratitude
            </h2>

            {sharedGratitude.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                No one&apos;s shared gratitude yet. Be the first!
              </p>
            ) : (
              <div className="space-y-3">
                {todayGratitude.map((g) => {
                  const c = g.content as { text?: string }
                  return (
                    <div
                      key={g.id}
                      className="rounded-[16px] p-3"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: 'var(--on-surface)' }}
                        >
                          {g.profiles?.full_name ?? 'Team Member'}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--on-surface-variant)' }}
                        >
                          {formatTime(g.created_at)}
                        </span>
                      </div>
                      <p
                        className="text-[12px] leading-5"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {c.text}
                      </p>
                    </div>
                  )
                })}

                {olderGratitude.length > 0 && (
                  <details className="mt-2">
                    <summary
                      className="cursor-pointer text-[12px]"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      Previous 7 days ({olderGratitude.length})
                    </summary>
                    <div className="mt-3 space-y-3">
                      {olderGratitude.map((g) => {
                        const c = g.content as { text?: string }
                        return (
                          <div
                            key={g.id}
                            className="rounded-[16px] p-3"
                            style={{ background: 'rgba(255,255,255,0.02)' }}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span
                                className="text-[12px] font-semibold"
                                style={{ color: 'var(--on-surface)' }}
                              >
                                {g.profiles?.full_name ?? 'Team Member'}
                              </span>
                              <span
                                className="text-[11px]"
                                style={{ color: 'var(--on-surface-variant)' }}
                              >
                                {g.date}
                              </span>
                            </div>
                            <p
                              className="text-[12px] leading-5"
                              style={{ color: 'var(--on-surface-variant)' }}
                            >
                              {c.text}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
