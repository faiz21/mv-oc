'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function GamificationOptInBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (dismissed) return null

  async function handleOptIn() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ gamification_enabled: true }).eq('id', user.id)
    // Trigger retroactive points backfill (T-08-08) — fire-and-forget
    fetch('/api/gaming/backfill', { method: 'POST' }).catch(() => null)
    router.refresh()
  }

  return (
    <div
      className="relative mb-6 rounded-2xl p-5"
      style={{ background: 'rgba(255,193,116,0.08)', border: '1px solid rgba(255,193,116,0.2)' }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-white/10"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,193,116,0.15)', color: 'var(--primary)' }}
        >
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            Welcome to Gaming Session
          </div>
          <div className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            Earn points for completing tasks, submitting standups, and reviewing approvals. Track your rank on the leaderboard. Opt-in is voluntary and never affects your role or performance.
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleOptIn}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              {loading ? 'Enabling...' : 'Opt In'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-xl px-4 py-2 text-[13px] transition-colors hover:bg-white/5"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
