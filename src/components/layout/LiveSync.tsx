'use client'

import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SyncMode = 'connecting' | 'live' | 'polling'

interface LiveSyncProps {
  tables: string[]
  channelPrefix: string
}

export function LiveSync({ tables, channelPrefix }: LiveSyncProps) {
  const router = useRouter()
  const refreshTimer = useRef<number | null>(null)
  const [mode, setMode] = useState<SyncMode>('connecting')

  const scheduleRefresh = useEffectEvent(() => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current)
    }

    refreshTimer.current = window.setTimeout(() => {
      startTransition(() => {
        router.refresh()
      })
    }, 180)
  })

  const pollRefresh = useEffectEvent(() => {
    startTransition(() => {
      router.refresh()
    })
  })

  useEffect(() => {
    const supabase = createClient()
    let hasLiveChannel = false

    const channels = tables.map((table) =>
      supabase
        .channel(`${channelPrefix}:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => scheduleRefresh(),
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            hasLiveChannel = true
            setMode('live')
            return
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setMode(hasLiveChannel ? 'live' : 'polling')
          }
        }),
    )

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setMode((currentMode) => (currentMode === 'live' ? currentMode : 'polling'))
        pollRefresh()
      }
    }, 10000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setMode((currentMode) => (currentMode === 'live' ? currentMode : 'polling'))
        pollRefresh()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(pollInterval)
      channels.forEach((channel) => {
        void supabase.removeChannel(channel)
      })
    }
  }, [channelPrefix, pollRefresh, scheduleRefresh, tables])

  const copy =
    mode === 'live'
      ? 'Realtime sync'
      : mode === 'polling'
        ? 'Polling fallback'
        : 'Connecting'

  const tone =
    mode === 'live'
      ? 'var(--status-active)'
      : mode === 'polling'
        ? 'var(--status-running)'
        : 'var(--on-surface-variant)'

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em]"
      style={{
        background: `color-mix(in srgb, ${tone} 16%, transparent)`,
        color: tone,
      }}
    >
      <Radio size={12} />
      {copy}
    </span>
  )
}
