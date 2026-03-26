'use client'

import { useEffect, useState } from 'react'
import { Trophy, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BadgeNotification {
  badge_slug: string
  badge_name: string
  badge_icon: string
  badge_color: string
  tier: string
}

interface BadgeNotificationToastProps {
  userId: string
}

export function BadgeNotificationToast({ userId }: BadgeNotificationToastProps) {
  const [notification, setNotification] = useState<BadgeNotification | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('gaming:badges')
      .on('broadcast', { event: 'badge_awarded' }, (payload) => {
        if (payload.payload.user_id === userId) {
          setNotification(payload.payload as BadgeNotification)
          // Dismiss after 6 seconds
          setTimeout(() => setNotification(null), 6000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (!notification) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-2xl p-4 shadow-2xl"
      style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,193,116,0.3)', minWidth: '280px' }}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,193,116,0.15)', color: 'var(--primary)' }}
      >
        <Trophy size={22} />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
          Badge Unlocked!
        </div>
        <div className="text-[12px]" style={{ color: 'var(--primary)' }}>
          {notification.badge_name}
        </div>
      </div>
      <button
        onClick={() => setNotification(null)}
        className="rounded-full p-1 hover:bg-white/10"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
