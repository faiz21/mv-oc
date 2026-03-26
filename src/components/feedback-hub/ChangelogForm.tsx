'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { FeedbackItem } from '@/features/feedback-hub/feedback-data'

interface ChangelogFormProps {
  feedbackItems?: FeedbackItem[]
  onClose: () => void
}

const CATEGORIES = ['idea', 'problem', 'request', 'general']

export function ChangelogForm({ feedbackItems = [], onClose }: ChangelogFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function toggleFeedback(id: string) {
    setSelectedFeedbackIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!description.trim()) { setError('Description is required'); return }
    if (description.length > 1000) { setError('Description max 1000 characters'); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          relatedFeedbackIds: selectedFeedbackIds,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create changelog entry')
      setSuccess(true)
      startTransition(() => router.refresh())
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--status-active)' }}>
          Changelog entry created and submitted for approval.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>New Changelog Entry</h3>
        <button onClick={onClose} style={{ color: 'var(--on-surface-variant)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Title <span style={{ color: 'var(--status-failed)' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded-[14px] px-4 py-3 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
          placeholder="What changed?"
        />
        <div className="mt-1 text-xs text-right" style={{ color: 'var(--on-surface-variant)' }}>{title.length}/100</div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Description <span style={{ color: 'var(--status-failed)' }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full rounded-[14px] px-4 py-3 text-sm resize-none outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 16 }}
          placeholder="Describe what was done in response to team feedback..."
        />
        <div className="mt-1 text-xs text-right" style={{ color: description.length > 1000 ? 'var(--status-failed)' : 'var(--on-surface-variant)' }}>
          {description.length}/1000
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
          Category (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className="rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: !category ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
              color: !category ? 'var(--primary)' : 'var(--on-surface-variant)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            None
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className="rounded-full px-3 py-1.5 text-xs font-medium capitalize"
              style={{
                background: category === cat ? 'rgba(255,193,116,0.12)' : 'rgba(255,255,255,0.04)',
                color: category === cat ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Related feedback */}
      {feedbackItems.length > 0 && (
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--on-surface-variant)' }}>
            Related Feedback (optional)
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {feedbackItems.map(item => (
              <label key={item.id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFeedbackIds.includes(item.id)}
                  onChange={() => toggleFeedback(item.id)}
                  style={{ accentColor: 'var(--primary)', marginTop: 2 }}
                />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--on-surface)' }}>
                  [{item.category}] {item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--status-failed)' }}>{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={submitting || description.length > 1000}
          className="rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.2)' }}
        >
          {submitting ? 'Saving...' : 'Submit for Approval'}
        </button>
        <button
          onClick={onClose}
          className="rounded-full px-5 py-2.5 text-sm"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Cancel
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
        Draft entries are submitted to the approval queue. They become visible to the team after an admin approves them.
      </p>
    </div>
  )
}
