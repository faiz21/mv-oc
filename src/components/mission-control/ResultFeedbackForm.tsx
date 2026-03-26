'use client'

import { startTransition, useState } from 'react'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResultFeedbackFormProps {
  approvalId: string
  outputPreview?: string
  ratingLabel?: string
}

export function ResultFeedbackForm({ approvalId, outputPreview, ratingLabel }: ResultFeedbackFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice(null)

    if (!rating) {
      setErrors(['Please provide a quality rating before submitting.'])
      return
    }

    setIsPending(true)

    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_type: 'result-feedback',
          rating,
          notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors(result.errors ?? ['Submission failed. Please try again.'])
        return
      }

      setNotice('Feedback recorded. Thank you.')
      startTransition(() => router.refresh())
    } finally {
      setIsPending(false)
    }
  }

  const activeLevel = hovered ?? rating ?? 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {outputPreview && (
        <div className="rounded-[22px] px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Output preview
          </div>
          <div className="text-sm leading-7" style={{ color: 'var(--secondary)' }}>
            {outputPreview}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
          {ratingLabel ?? 'Rate the quality of this output'}
        </div>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-full p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} out of 5`}
            >
              <Star
                size={28}
                fill={star <= activeLevel ? 'var(--primary)' : 'none'}
                style={{ color: star <= activeLevel ? 'var(--primary)' : 'var(--on-surface-variant)' }}
              />
            </button>
          ))}
        </div>
        {rating && (
          <div className="mt-2 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            {rating === 1 ? 'Poor' : rating === 2 ? 'Below average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
          </div>
        )}
      </div>

      <div>
        <label className="block">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Additional notes (optional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked well or what needs improvement?"
            rows={3}
            className="w-full rounded-[18px] px-4 py-3 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="rounded-[18px] px-4 py-3" style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--status-failed)' }}>
          <ul className="space-y-1 text-sm">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {notice && (
        <div className="rounded-[18px] px-4 py-3 text-sm" style={{ background: 'rgba(110,231,183,0.12)', color: 'var(--status-active)' }}>
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !rating}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        style={{
          background: rating ? 'rgba(255,193,116,0.14)' : 'rgba(255,255,255,0.04)',
          color: rating ? 'var(--primary)' : 'var(--on-surface-variant)',
          opacity: isPending ? 0.7 : 1,
          cursor: rating ? 'pointer' : 'not-allowed',
        }}
      >
        {isPending ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  )
}
