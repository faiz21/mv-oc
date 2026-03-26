'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Period = 'daily' | 'weekly' | 'monthly' | 'alltime'

interface LeaderboardEntry {
  user_id: string
  name: string
  points: number
  rank: number
  trend: 'up' | 'down' | 'same'
}

interface LeaderboardSnapshot {
  data: LeaderboardEntry[]
}

interface LeaderboardPanelProps {
  currentUserId: string
  initialSnapshot?: LeaderboardSnapshot | null
}

export function LeaderboardPanel({ currentUserId, initialSnapshot }: LeaderboardPanelProps) {
  const [period, setPeriod] = useState<Period>('weekly')
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialSnapshot?.data || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (period === 'weekly' && initialSnapshot) {
      setEntries(initialSnapshot.data)
      return
    }
    loadLeaderboard()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('gaming:points')
      .on('broadcast', { event: 'points_awarded' }, () => {
        loadLeaderboard()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/gaming/leaderboard?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setEntries(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'alltime', label: 'All Time' },
  ]

  return (
    <div>
      {/* Period tabs */}
      <div className="mb-5 flex gap-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              background: period === p.key ? 'var(--surface-container)' : 'transparent',
              color: period === p.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Leaderboard entries */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-2xl" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center text-[14px]"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
        >
          Complete your first task to appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId
            return (
              <div
                key={entry.user_id}
                className="flex items-center gap-4 rounded-2xl px-4 py-3"
                style={{
                  background: isCurrentUser ? 'rgba(255,193,116,0.08)' : 'var(--surface-container-low)',
                  border: isCurrentUser ? '1px solid rgba(255,193,116,0.2)' : '1px solid transparent',
                }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{
                    background: entry.rank <= 3 ? 'var(--primary)' : 'var(--surface-container)',
                    color: entry.rank <= 3 ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  {entry.rank}
                </div>
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                  style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
                >
                  {(entry.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate" style={{ color: 'var(--on-surface)' }}>
                    {entry.name}
                    {isCurrentUser && <span className="ml-2 text-[11px]" style={{ color: 'var(--primary)' }}>You</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {entry.points.toLocaleString()}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>pts</span>
                  {entry.trend === 'up' && <TrendingUp size={14} style={{ color: '#4ade80' }} />}
                  {entry.trend === 'down' && <TrendingDown size={14} style={{ color: '#f87171' }} />}
                  {entry.trend === 'same' && <Minus size={14} style={{ color: 'var(--on-surface-variant)' }} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
