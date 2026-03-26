'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SandboxRun {
  id: string
  status: string
  workflow_id: string
  created_at: string
  execution_time_ms: number | null
  workflow?: { id: string; name: string } | null
}

interface SandboxRunHistoryProps {
  userId: string
}

export function SandboxRunHistory({ userId }: SandboxRunHistoryProps) {
  const [runs, setRuns] = useState<SandboxRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sandbox_runs')
        .select('*, workflow:workflows(id, name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setRuns(data as SandboxRun[] || [])
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-2xl" style={{ background: 'var(--surface-container-low)' }} />)}</div>
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center text-[14px]" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
        No sandbox runs yet. Try running a workflow above.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {runs.map(run => (
        <div
          key={run.id}
          className="flex items-center gap-4 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface-container-low)' }}
        >
          {(run.status === 'complete' || run.status === 'completed')
            ? <CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: 'var(--on-surface)' }}>
              {run.workflow?.name || run.workflow_id}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
              {new Date(run.created_at).toLocaleString()}
            </div>
          </div>
          {run.execution_time_ms && (
            <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              <Clock size={12} />
              {(run.execution_time_ms / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
