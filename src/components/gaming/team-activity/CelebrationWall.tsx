'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types'

type TeamActivity = Tables<'team_activity'>

interface ShoutoutContent {
  text: string
  emoji: string
}

type ShoutoutRow = TeamActivity & { author?: { id?: string; full_name?: string | null } | null }

interface CelebrationWallProps {
  initialShoutouts: ShoutoutRow[]
  currentUserId: string
}

export function CelebrationWall({ initialShoutouts, currentUserId }: CelebrationWallProps) {
  const [shoutouts, setShoutouts] = useState<ShoutoutRow[]>(initialShoutouts)
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('team-activity:shoutouts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_activity',
        filter: 'type=eq.shoutout',
      }, (payload) => {
        setShoutouts(prev => [payload.new as ShoutoutRow, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handlePost() {
    if (!text.trim()) return
    setPosting(true)
    await fetch('/api/gaming/team-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'shoutout', content: { text: text.trim(), emoji } }),
    })
    setText('')
    setPosting(false)
  }

  const EMOJI_OPTIONS = ['🎉', '🏆', '⭐', '💪', '✨', '🚀', '❤️', '🔥']

  return (
    <div className="space-y-5">
      {/* Composer */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
        <div className="mb-3 flex gap-2">
          {EMOJI_OPTIONS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className="rounded-xl p-1.5 text-lg transition-colors"
              style={{ background: emoji === e ? 'var(--surface-container)' : 'transparent' }}
            >
              {e}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's your win? Share with the team..."
          rows={3}
          maxLength={300}
          className="w-full resize-none rounded-xl px-4 py-3 text-[14px] outline-none"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
            {text.length}/300
          </span>
          <button
            onClick={handlePost}
            disabled={posting || !text.trim()}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            {posting ? 'Posting...' : `${emoji} Share`}
          </button>
        </div>
      </div>

      {/* Feed */}
      {shoutouts.length === 0 ? (
        <div className="py-8 text-center text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
          No shoutouts yet. Be the first to celebrate a win!
        </div>
      ) : (
        shoutouts.map(shoutout => {
          const c = shoutout.content as unknown as ShoutoutContent
          const isOwn = shoutout.author_id === currentUserId
          return (
            <div
              key={shoutout.id}
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                  style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
                >
                  {(shoutout.author?.full_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                      {shoutout.author?.full_name || 'Team member'}
                      {isOwn && <span className="ml-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>(you)</span>}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {new Date(shoutout.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--on-surface)' }}>
                    {c?.emoji} {c?.text}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
