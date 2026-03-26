'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { FeedbackCategory } from '@/features/feedback-hub/feedback-data'

const CATEGORY_LABELS: Record<FeedbackCategory, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'rgba(255,193,116,0.14)' },
  problem: { label: 'Problem', color: 'rgba(248,113,113,0.10)' },
  request: { label: 'Request', color: 'rgba(96,165,250,0.10)' },
  general: { label: 'General', color: 'rgba(148,163,184,0.10)' },
}

const CATEGORY_TEXT_COLOR: Record<FeedbackCategory, string> = {
  idea: 'var(--primary)',
  problem: 'var(--status-failed)',
  request: '#60A5FA',
  general: 'var(--on-surface-variant)',
}

const MAX_CONTENT = 1000

export function FeedbackSubmitForm() {
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const charCount = content.length
  const overLimit = charCount > MAX_CONTENT

  function validateContent(): boolean {
    if (!content.trim()) {
      setContentError('Please share your feedback')
      return false
    }
    if (overLimit) {
      setContentError(`Max ${MAX_CONTENT} characters`)
      return false
    }
    setContentError(null)
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateContent()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content, anonymous }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSuccess(true)
      setContent('')
      setContentError(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div
        className="flex items-start gap-3 rounded-[22px] px-5 py-5"
        style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.12)' }}
      >
        <CheckCircle2 size={20} style={{ color: 'var(--status-active)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            Your feedback has been received. You can view its status anytime.
          </div>
          <div className="mt-2">
            <button
              onClick={() => { setSuccess(false); setAnonymous(false); setCategory('general') }}
              className="text-sm underline"
              style={{ color: 'var(--primary)' }}
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Category */}
      <div>
        <label className="block text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--on-surface-variant)' }}>
          Category
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="rounded-[18px] px-3 py-3 text-sm font-medium transition-colors min-h-[48px]"
              style={{
                background: category === cat ? CATEGORY_LABELS[cat].color : 'rgba(255,255,255,0.03)',
                color: category === cat ? CATEGORY_TEXT_COLOR[cat] : 'var(--on-surface-variant)',
                border: `1px solid ${category === cat ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {CATEGORY_LABELS[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="feedback-content"
          className="block text-[11px] uppercase tracking-[0.18em] mb-2"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Your feedback <span style={{ color: 'var(--status-failed)' }}>*</span>
        </label>
        <textarea
          id="feedback-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (contentError) setContentError(null)
          }}
          onBlur={validateContent}
          rows={5}
          className="w-full rounded-[18px] px-4 py-3 text-sm resize-none outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--on-surface)',
            border: `1px solid ${contentError ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.06)'}`,
            fontSize: '16px', // prevent iOS zoom
          }}
          placeholder="Describe your idea, problem, or request in detail..."
          aria-invalid={!!contentError}
          aria-describedby={contentError ? 'content-error' : undefined}
        />
        <div className="mt-1 flex items-center justify-between">
          {contentError ? (
            <span
              id="content-error"
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--status-failed)' }}
            >
              <AlertCircle size={12} />
              {contentError}
            </span>
          ) : <span />}
          <span
            className="text-xs"
            style={{ color: overLimit ? 'var(--status-failed)' : 'var(--on-surface-variant)' }}
          >
            {charCount}/{MAX_CONTENT}
          </span>
        </div>
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div style={{ marginTop: 2 }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="rounded"
            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
          />
        </div>
        <div>
          <span className="text-sm" style={{ color: 'var(--on-surface)' }}>
            Submit anonymously
          </span>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Your identity will not be stored at the database level
          </p>
        </div>
      </label>

      {submitError ? (
        <div
          className="rounded-[16px] px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--status-failed)' }}
        >
          <AlertCircle size={14} />
          {submitError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || overLimit}
        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity disabled:opacity-50 min-h-[48px]"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
          color: 'var(--on-primary-container)',
          minWidth: 160,
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
