'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, Users, Clock } from 'lucide-react'
import type { PulseSurvey } from '@/features/feedback-hub/feedback-data'

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)', label: 'Draft' },
  published: { bg: 'rgba(110,231,183,0.10)', text: 'var(--status-active)', label: 'Active' },
  closed: { bg: 'rgba(148,163,184,0.06)', text: 'var(--secondary)', label: 'Closed' },
}

interface SurveyListProps {
  surveys: PulseSurvey[]
  isAdmin: boolean
  /** Null means no answered survey known client-side */
  answeredSurveyIds?: string[]
}

export function SurveyList({ surveys, isAdmin, answeredSurveyIds = [] }: SurveyListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [publishing, setPublishing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  async function publishSurvey(surveyId: string) {
    setPublishing(surveyId)
    try {
      const res = await fetch(`/api/feedback/surveys/${surveyId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        startTransition(() => router.refresh())
      }
    } finally {
      setPublishing(null)
    }
  }

  if (surveys.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          {isAdmin ? 'No surveys created yet.' : 'No active surveys at this time.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {surveys.map(survey => {
        const stat = STATUS_BADGE[survey.status] ?? STATUS_BADGE.draft
        const isActive = survey.status === 'published'
        const hasAnswered = answeredSurveyIds.includes(survey.id)
        const now = new Date()
        const isVisible = isActive
          && (!survey.sentAt || new Date(survey.sentAt) <= now)
          && (!survey.closesAt || new Date(survey.closesAt) > now)

        return (
          <div
            key={survey.id}
            className="rounded-[18px] overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: stat.bg, color: stat.text }}
                  >
                    {stat.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                    {survey.title}
                  </span>
                </div>

                {survey.description && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    {survey.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                    <Users size={11} />
                    {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                  </span>
                  {survey.closesAt && isActive && (
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                      <Clock size={11} />
                      Closes {formatDate(survey.closesAt)}
                    </span>
                  )}
                  {survey.sentAt && (
                    <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                      Started {formatDate(survey.sentAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Admin: view results */}
                {isAdmin && survey.status !== 'draft' && (
                  <button
                    onClick={() => setExpanded(expanded === survey.id ? null : survey.id)}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: 'rgba(148,163,184,0.10)', color: 'var(--on-surface-variant)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <BarChart2 size={12} />
                    Results
                  </button>
                )}

                {/* Admin: publish draft */}
                {isAdmin && survey.status === 'draft' && (
                  <button
                    onClick={() => void publishSurvey(survey.id)}
                    disabled={publishing === survey.id}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'rgba(110,231,183,0.12)', color: 'var(--status-active)', border: '1px solid rgba(110,231,183,0.15)' }}
                  >
                    {publishing === survey.id ? 'Publishing...' : 'Publish'}
                  </button>
                )}

                {/* Team member: respond */}
                {!isAdmin && isVisible && !hasAnswered && (
                  <button
                    onClick={() => setRespondingTo(survey.id)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.2)' }}
                  >
                    Respond
                  </button>
                )}

                {!isAdmin && hasAnswered && (
                  <span className="text-xs" style={{ color: 'var(--status-active)' }}>Responded</span>
                )}
              </div>
            </div>

            {/* Survey response form (inline) */}
            {respondingTo === survey.id && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <SurveyResponseForm
                  survey={survey}
                  onDone={() => {
                    setRespondingTo(null)
                    startTransition(() => router.refresh())
                  }}
                  onCancel={() => setRespondingTo(null)}
                />
              </div>
            )}

            {/* Results placeholder for admin */}
            {isAdmin && expanded === survey.id && (
              <div
                className="px-5 pb-5 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                  Survey results aggregation available via the Surveys admin page.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Inline survey response form ──────────────────────────────────────────────

function SurveyResponseForm({
  survey,
  onDone,
  onCancel,
}: {
  survey: PulseSurvey
  onDone: () => void
  onCancel: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/feedback/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSuccess(true)
      // Store in session to prevent re-submit
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`survey_answered_${survey.id}`, '1')
      }
      setTimeout(onDone, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--status-active)' }}>
          Thank you for your response. Your feedback will help us improve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
      <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
        Respond to Survey
      </p>

      {survey.questions.map((q, idx) => (
        <div key={q.id ?? idx} className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
            {idx + 1}. {q.text}
          </label>

          {q.type === 'multiple_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`q_${idx}`}
                    value={opt}
                    checked={answers[`q_${idx}`] === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [`q_${idx}`]: opt }))}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'rating_scale' && q.range && (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: q.range[1] - q.range[0] + 1 }, (_, i) => i + q.range![0]).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [`q_${idx}`]: n }))}
                    className="w-10 h-10 rounded-full text-sm font-medium transition-colors"
                    style={{
                      background: answers[`q_${idx}`] === n ? 'rgba(255,193,116,0.18)' : 'rgba(255,255,255,0.04)',
                      color: answers[`q_${idx}`] === n ? 'var(--primary)' : 'var(--on-surface-variant)',
                      border: `1px solid ${answers[`q_${idx}`] === n ? 'rgba(255,193,116,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{q.range[0]} = lowest</span>
                <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{q.range[1]} = highest</span>
              </div>
            </div>
          )}

          {q.type === 'free_text' && (
            <div>
              <textarea
                value={(answers[`q_${idx}`] as string) ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [`q_${idx}`]: e.target.value }))}
                rows={3}
                maxLength={q.charLimit ?? 500}
                className="w-full rounded-[14px] px-4 py-3 text-sm resize-none outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 16,
                }}
                placeholder="Your answer..."
              />
              <div className="mt-1 text-xs text-right" style={{ color: 'var(--on-surface-variant)' }}>
                {((answers[`q_${idx}`] as string) ?? '').length}/{q.charLimit ?? 500}
              </div>
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm" style={{ color: 'var(--status-failed)' }}>{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.2)' }}
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-sm"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
