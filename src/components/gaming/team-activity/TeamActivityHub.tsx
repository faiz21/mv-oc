'use client'

import { useState } from 'react'
import { CelebrationWall } from './CelebrationWall'
import { PollCard } from './PollCard'
import { TeamCalendar } from './TeamCalendar'
import type { Tables } from '@/types'

type TeamActivity = Tables<'team_activity'>
type TeamActivityResponse = Tables<'team_activity_responses'>

type Tab = 'shoutouts' | 'polls' | 'calendar'

type PollWithResponses = TeamActivity & { responses?: TeamActivityResponse[] }
type ShoutoutWithAuthor = TeamActivity & { author?: { id?: string; full_name?: string | null } | null }

interface TeamActivityHubProps {
  userId: string
  shoutouts: ShoutoutWithAuthor[]
  polls: PollWithResponses[]
  isAdmin?: boolean
}

export function TeamActivityHub({ userId, shoutouts, polls, isAdmin = false }: TeamActivityHubProps) {
  const [tab, setTab] = useState<Tab>('shoutouts')
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollType, setPollType] = useState<'yes_no' | 'custom'>('yes_no')
  const [pollOptions, setPollOptions] = useState(['Option A', 'Option B'])
  const [creating, setCreating] = useState(false)
  const [localPolls, setLocalPolls] = useState<PollWithResponses[]>(polls)

  async function handleCreatePoll() {
    if (!pollQuestion.trim()) return
    setCreating(true)
    const content = {
      question: pollQuestion.trim(),
      poll_type: pollType,
      options: pollType === 'custom' ? pollOptions.filter(Boolean) : undefined,
    }
    const res = await fetch('/api/gaming/team-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'poll', content }),
    })
    if (res.ok) {
      const created = await res.json()
      setLocalPolls(prev => [created, ...prev])
      setPollQuestion('')
      setPollType('yes_no')
      setPollOptions(['Option A', 'Option B'])
      setShowPollForm(false)
    }
    setCreating(false)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'shoutouts', label: '🎉 Celebration Wall' },
    { key: 'polls',     label: '📊 Polls' },
    { key: 'calendar',  label: '📅 Team Calendar' },
  ]

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface-container-low)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 rounded-xl px-4 py-2.5 text-center text-[13px] font-medium transition-colors"
            style={{
              background: tab === t.key ? 'var(--surface-container)' : 'transparent',
              color: tab === t.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shoutouts' && (
        <CelebrationWall initialShoutouts={shoutouts} currentUserId={userId} />
      )}

      {tab === 'polls' && (
        <div className="space-y-4">
          {/* Create poll button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowPollForm(f => !f)}
              className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              {showPollForm ? 'Cancel' : '+ Create Poll'}
            </button>
          </div>

          {/* Poll creation form */}
          {showPollForm && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface-container-low)' }}>
              <div>
                <label className="mb-1.5 block text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                  Question
                </label>
                <input
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  maxLength={200}
                  placeholder="What should the team decide?"
                  className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                />
                <div className="mt-1 text-right text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                  {pollQuestion.length}/200
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                  Poll Type
                </label>
                <div className="flex gap-2">
                  {(['yes_no', 'custom'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setPollType(type)}
                      className="rounded-xl px-4 py-2 text-[13px] transition-colors"
                      style={{
                        background: pollType === type ? 'var(--surface-container)' : 'transparent',
                        color: pollType === type ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                        border: `1px solid ${pollType === type ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      }}
                    >
                      {type === 'yes_no' ? 'Yes / No' : 'Multiple Choice'}
                    </button>
                  ))}
                </div>
              </div>

              {pollType === 'custom' && (
                <div>
                  <label className="mb-1.5 block text-[12px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                    Options
                  </label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                        placeholder={`Option ${i + 1}`}
                        className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none"
                        style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                      />
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        onClick={() => setPollOptions(prev => [...prev, ''])}
                        className="text-[12px]"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        + Add option
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreatePoll}
                disabled={creating || !pollQuestion.trim()}
                className="rounded-xl px-5 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
              >
                {creating ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          )}

          {/* Poll list */}
          {localPolls.length === 0 ? (
            <div className="rounded-2xl p-8 text-center text-[14px]" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
              No active polls. Create one to get the team voting!
            </div>
          ) : (
            localPolls.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                currentUserId={userId}
                userResponse={null}
              />
            ))
          )}
        </div>
      )}

      {tab === 'calendar' && (
        <TeamCalendar isAdmin={isAdmin} />
      )}
    </div>
  )
}
