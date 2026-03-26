'use client'

import { useState } from 'react'
import type { Tables } from '@/types'
import type { Json } from '@/types/database'

type TeamActivity = Tables<'team_activity'>
type TeamActivityResponse = Tables<'team_activity_responses'>

interface PollContent {
  question: string
  poll_type: 'yes_no' | 'custom'
  options?: string[]
}

interface PollCardProps {
  poll: TeamActivity & { responses?: TeamActivityResponse[] }
  currentUserId: string
  userResponse?: Record<string, unknown> | null
}

export function PollCard({ poll, currentUserId, userResponse }: PollCardProps) {
  const [voted, setVoted] = useState<string | null>(
    userResponse ? String(userResponse.option) : null
  )
  const [loading, setLoading] = useState(false)

  // Suppress unused variable warning — currentUserId reserved for future use
  void currentUserId

  const content = poll.content as unknown as PollContent
  const responses = poll.responses || []
  const totalVotes = responses.length

  async function handleVote(option: string) {
    if (voted || poll.status === 'closed') return
    setLoading(true)
    const res = await fetch(`/api/gaming/team-activity/${poll.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: { option } }),
    })
    if (res.ok) setVoted(option)
    setLoading(false)
  }

  const options = content.poll_type === 'yes_no'
    ? ['Yes', 'No']
    : content.options || []

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="mb-1 flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{ background: poll.status === 'closed' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)', color: poll.status === 'closed' ? '#f87171' : '#4ade80' }}
        >
          {poll.status === 'closed' ? 'Closed' : 'Active'}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
          {totalVotes} votes
        </span>
      </div>
      <div className="mb-4 text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
        {content.question}
      </div>
      <div className="space-y-2">
        {options.map(option => {
          const voteCount = responses.filter(r => {
            const resp = r.response as unknown as { option?: string } | null
            return resp?.option === option
          }).length
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isVoted = voted === option
          return (
            <button
              key={option}
              onClick={() => handleVote(option)}
              disabled={loading || !!voted || poll.status === 'closed'}
              className="relative w-full overflow-hidden rounded-xl px-4 py-2.5 text-left text-[13px] transition-all disabled:cursor-default"
              style={{
                background: isVoted ? 'rgba(255,193,116,0.12)' : 'var(--surface-container)',
                border: `1px solid ${isVoted ? 'rgba(255,193,116,0.3)' : 'rgba(255,255,255,0.04)'}`,
                color: 'var(--on-surface)',
              }}
            >
              {(voted || poll.status === 'closed') && (
                <div
                  className="absolute inset-y-0 left-0 rounded-xl transition-all"
                  style={{ width: `${pct}%`, background: 'rgba(255,193,116,0.08)' }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span>{option}</span>
                {(voted || poll.status === 'closed') && (
                  <span className="text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>{pct}%</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
