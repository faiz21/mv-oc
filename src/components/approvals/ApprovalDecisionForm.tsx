'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

interface ApprovalDecisionFormProps {
  approvalId: string
  compact?: boolean
}

export function ApprovalDecisionForm({ approvalId, compact = false }: ApprovalDecisionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRejectNotes, setShowRejectNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submitDecision(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !notes.trim()) {
      setError('Rejection requires a note.')
      setShowRejectNotes(true)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes,
        }),
      })

      const result = (await response.json()) as { error?: string; errors?: string[] }

      if (!response.ok) {
        setError(result.errors?.[0] ?? result.error ?? 'Unable to record the decision.')
        return
      }

      setNotice(decision === 'approved' ? 'Approved.' : 'Rejected with feedback.')
      setNotes('')
      setShowRejectNotes(false)
      startTransition(() => router.refresh())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {showRejectNotes ? (
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Explain what should change before this can proceed."
          className="min-h-[96px] w-full rounded-[18px] px-4 py-3 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
        />
      ) : null}

      <div className={`flex ${compact ? 'flex-col sm:flex-row' : 'flex-col lg:flex-row'} gap-3`}>
        <button
          type="button"
          onClick={() => submitDecision('approved')}
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          style={{ background: 'rgba(110,231,183,0.14)', color: 'var(--status-active)' }}
        >
          {isSubmitting ? 'Saving...' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!showRejectNotes) {
              setShowRejectNotes(true)
              setError(null)
              return
            }

            void submitDecision('rejected')
          }}
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--status-failed)' }}
        >
          {showRejectNotes ? (isSubmitting ? 'Saving...' : 'Reject with note') : 'Reject'}
        </button>
      </div>

      {error ? (
        <div className="text-sm" style={{ color: 'var(--status-failed)' }}>
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="text-sm" style={{ color: 'var(--status-active)' }}>
          {notice}
        </div>
      ) : null}
    </div>
  )
}
