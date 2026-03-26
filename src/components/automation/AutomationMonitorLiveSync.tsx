'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AutomationMonitorLiveSync() {
  const router = useRouter()
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('automation-monitor-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_runs' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_run_steps' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_queue' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_log' }, () => router.refresh())
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' ? status === 'SUBSCRIBED' : connected)
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router, connected])

  if (connected) return null

  return (
    <div className="mb-4 rounded-[20px] border px-4 py-3 text-sm" style={{ borderColor: 'var(--border-default)', background: 'rgba(248,113,113,0.12)', color: 'var(--status-failed)' }}>
      Connection lost. Reconnecting to live workflow updates…
    </div>
  )
}
