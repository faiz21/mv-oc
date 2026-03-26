'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OrgTreeLiveSync() {
  const router = useRouter()
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('org-tree-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => router.refresh())
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router])

  if (connected) return null

  return (
    <div
      className="mb-4 rounded-[20px] border px-4 py-3 text-sm"
      style={{
        borderColor: 'var(--border-default)',
        background: 'rgba(248,113,113,0.12)',
        color: 'var(--status-failed)',
      }}
    >
      Connection lost. Reconnecting to live organization updates…
    </div>
  )
}
