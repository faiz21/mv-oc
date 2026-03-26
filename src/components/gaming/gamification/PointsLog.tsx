'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types'

type PointsLogEntry = Tables<'points_log'>

const ACTION_LABELS: Record<string, string> = {
  task_completed: 'Completed a task',
  approval_reviewed_fast: 'Fast approval review (< 1hr)',
  approval_reviewed_slow: 'Approval review',
  approval_rejected: 'Rejection reviewed',
  standup_submitted_ontime: 'On-time standup',
  standup_submitted_late: 'Standup submitted',
  daily_login: 'Daily login',
  incident_high_severity: 'Incident resolved',
  workflow_created: 'Workflow created',
}

interface PointsLogProps {
  userId: string
  totalPoints: number
}

export function PointsLog({ userId, totalPoints }: PointsLogProps) {
  const [entries, setEntries] = useState<PointsLogEntry[]>([])
  const [allEntries, setAllEntries] = useState<PointsLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadEntries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Realtime — new points appear immediately
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`points:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'points_log',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const newEntry = payload.new as PointsLogEntry
        setAllEntries(prev => [newEntry, ...prev])
        setEntries(prev => {
          if (filter !== 'all' && newEntry.action_type !== filter) return prev
          return [newEntry, ...prev]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, filter])

  async function loadEntries() {
    setLoading(true)
    const supabase = createClient()

    // Load all entries for CSV export
    const { data: all } = await supabase
      .from('points_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setAllEntries(all || [])

    let query = supabase
      .from('points_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') query = query.eq('action_type', filter)

    const { data } = await query
    setEntries(data || [])
    setLoading(false)
  }

  function exportCsv() {
    const headers = ['date', 'action_type', 'points', 'ref_type', 'ref_id', 'description']
    const rows = allEntries.map(e => [
      new Date(e.created_at).toISOString(),
      e.action_type,
      e.points,
      e.ref_type || '',
      e.ref_id || '',
      ACTION_LABELS[e.action_type] || e.action_type,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `points-log-${userId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filters = ['all', 'task_completed', 'approval_reviewed_fast', 'standup_submitted_ontime', 'incident_high_severity']

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
            Total Points
          </div>
          <div className="text-[32px] font-bold font-display" style={{ color: 'var(--primary)' }}>
            {totalPoints.toLocaleString()}
          </div>
        </div>

        {/* CSV Export */}
        {allEntries.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-xl px-3 py-1.5 text-[12px] transition-colors"
            style={{
              background: filter === f ? 'var(--surface-container)' : 'transparent',
              color: filter === f ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            }}
          >
            {f === 'all' ? 'All' : ACTION_LABELS[f] || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: 'var(--surface-container-low)' }} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
          No points earned yet. Complete tasks to start earning.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                  {ACTION_LABELS[entry.action_type] || entry.action_type}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  {new Date(entry.created_at).toLocaleString()}
                  {entry.ref_type && (
                    <span className="ml-2 capitalize">· {entry.ref_type}</span>
                  )}
                </div>
              </div>
              <div className="text-[14px] font-semibold" style={{ color: 'var(--primary)' }}>
                +{entry.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
