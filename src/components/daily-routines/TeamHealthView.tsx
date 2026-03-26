'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'

interface TeamHealth {
  standup_completion: {
    submitted: number
    total: number
    percentage: number
    warning: boolean
  }
  check_in_signals: {
    green: number
    yellow: number
    red: number
  }
  blocked_tasks: Array<{ id: string; title: string; assigned_to: string | null }>
  members: Array<{
    user_id: string
    name: string
    submitted_standup: boolean
    submitted_at: string | null
    pending: boolean
  }>
  timestamp: string
}

export function TeamHealthView() {
  const [health, setHealth] = useState<TeamHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/daily-routines/team-health')
      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        setError(d.error ?? 'Failed to load')
        return
      }
      setHealth(await res.json() as TeamHealth)
      setError(null)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHealth()
  }, [fetchHealth])

  // Realtime: refresh on any daily_entries change
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('team-health-daily-entries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_entries' },
        () => {
          void fetchHealth()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchHealth])

  if (loading) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
        Loading team health...
      </div>
    )
  }

  if (error || !health) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: 'var(--status-failed)' }}>
        {error ?? 'No data available'}
      </div>
    )
  }

  const { standup_completion, check_in_signals, blocked_tasks, members } = health

  return (
    <div className="space-y-6">
      {/* Standup Completion */}
      <div
        className="rounded-[24px] p-5"
        style={{
          background: standup_completion.warning
            ? 'rgba(251,191,36,0.08)'
            : 'var(--surface-container)',
          borderLeft: standup_completion.warning ? '4px solid #f59e0b' : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--on-surface-variant)' }}>
            Standup Completion
          </h3>
          <button
            onClick={() => void fetchHealth()}
            className="rounded-full p-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--on-surface-variant)' }}
            aria-label="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold" style={{ color: 'var(--on-surface)' }}>
            {standup_completion.submitted}/{standup_completion.total}
          </span>
          <span className="mb-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {standup_completion.percentage}% submitted
          </span>
        </div>
        {standup_completion.warning && (
          <p className="mt-2 text-[12px] font-medium" style={{ color: '#f59e0b' }}>
            Below 75% target
          </p>
        )}
      </div>

      {/* Check-In Signals */}
      <div className="rounded-[24px] p-5" style={{ background: 'var(--surface-container)' }}>
        <h3
          className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Daily Check-In Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { emoji: '🟢', label: 'On Track', count: check_in_signals.green },
            { emoji: '🟡', label: 'Needs Attention', count: check_in_signals.yellow },
            { emoji: '🔴', label: 'Blocked', count: check_in_signals.red },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl">{s.emoji}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>
                {s.count}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Tasks */}
      {blocked_tasks.length > 0 && (
        <div
          className="rounded-[24px] p-5"
          style={{
            background: 'rgba(248,113,113,0.06)',
            borderLeft: '4px solid rgba(248,113,113,0.5)',
          }}
        >
          <h3
            className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--status-failed)' }}
          >
            Blocked Tasks ({blocked_tasks.length})
          </h3>
          <ul className="space-y-2">
            {blocked_tasks.map((task) => (
              <li
                key={task.id}
                className="text-[13px]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Team Member Status */}
      <div className="rounded-[24px] p-5" style={{ background: 'var(--surface-container)' }}>
        <h3
          className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Team Member Status
        </h3>
        <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                {m.name}
              </span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: m.submitted_standup ? 'var(--status-active)' : 'var(--on-surface-variant)' }}
              >
                {m.submitted_standup
                  ? `Submitted ${m.submitted_at ? new Date(m.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                  : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-right" style={{ color: 'var(--on-surface-variant)' }}>
        Last updated: {new Date(health.timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}
