'use client'

import { useState } from 'react'
import { ArrowLeft, Send, X, RotateCcw } from 'lucide-react'
import type { FeedbackItem, FeedbackStatus } from '@/features/feedback-hub/feedback-data'
import { ANONYMOUS_DISPLAY_NAME } from '@/features/feedback-hub/feedback-data'

const CATEGORY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  idea: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)', label: 'Idea' },
  problem: { bg: 'rgba(248,113,113,0.12)', text: 'var(--status-failed)', label: 'Problem' },
  request: { bg: 'rgba(96,165,250,0.10)', text: '#60A5FA', label: 'Request' },
  general: { bg: 'rgba(148,163,184,0.10)', text: 'var(--on-surface-variant)', label: 'General' },
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' },
]

const MAX_RESPONSE = 2000
const MAX_CLOSURE = 500

interface FeedbackDetailProps {
  item: FeedbackItem
  onClose: () => void
  onUpdate: () => void
}

export function FeedbackDetail({ item, onClose, onUpdate }: FeedbackDetailProps) {
  const [responseText, setResponseText] = useState('')
  const [closureNote, setClosureNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>(item.status)
  const [showResponseEditor, setShowResponseEditor] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const cat = CATEGORY_BADGE[item.category]
  const name = item.userId === null ? ANONYMOUS_DISPLAY_NAME : 'Team Member'
  const isAnonymous = item.userId === null

  async function changeStatus(newStatus: FeedbackStatus, note?: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/feedback/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, closureNote: note }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to update status')
      setNotice(`Status updated to ${newStatus.replace('_', ' ')}`)
      setSelectedStatus(newStatus)
      setShowCloseDialog(false)
      setClosureNote('')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  async function submitResponse() {
    if (!responseText.trim()) { setError('Response text is required'); return }
    if (responseText.length > MAX_RESPONSE) { setError('Max 2000 characters'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/feedback/${item.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit response')
      setNotice('Response submitted')
      setResponseText('')
      setShowResponseEditor(false)
      setSelectedStatus('responded')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="lg:hidden flex items-center gap-1 text-sm"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: cat.bg, color: cat.text }}
          >
            {cat.label}
          </span>
          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {name}
            {isAnonymous && (
              <span className="ml-1 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                (Anonymous)
              </span>
            )}
          </span>
          <span className="ml-auto text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            {formatDateTime(item.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="rounded-[18px] p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
          {item.content}
        </p>
      </div>

      {/* Status control */}
      <div className="space-y-2">
        <label className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value === 'closed') {
                  setShowCloseDialog(true)
                } else if (opt.value !== selectedStatus) {
                  void changeStatus(opt.value)
                }
              }}
              disabled={saving}
              className="rounded-full px-4 py-2 text-xs font-medium transition-colors"
              style={{
                background: selectedStatus === opt.value ? 'rgba(255,193,116,0.14)' : 'rgba(255,255,255,0.04)',
                color: selectedStatus === opt.value ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: `1px solid ${selectedStatus === opt.value ? 'rgba(255,193,116,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Existing response */}
      {item.response && (
        <div
          className="rounded-[18px] p-5 space-y-2"
          style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.10)' }}
        >
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--status-active)' }}>
            Leadership Response{item.responseAt ? ` · ${formatDateTime(item.responseAt)}` : ''}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>
            {item.response}
          </p>
        </div>
      )}

      {/* Closure note */}
      {item.closedReason && (
        <div
          className="rounded-[18px] p-4"
          style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.10)' }}
        >
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--on-surface-variant)' }}>
            Closure Note{item.closedAt ? ` · ${formatDateTime(item.closedAt)}` : ''}
          </p>
          <p className="text-sm" style={{ color: 'var(--on-surface)' }}>{item.closedReason}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!item.response && !showResponseEditor && item.status !== 'closed' && (
          <button
            onClick={() => setShowResponseEditor(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
            style={{ background: 'rgba(255,193,116,0.12)', color: 'var(--primary)', border: '1px solid rgba(255,193,116,0.2)' }}
          >
            <Send size={14} />
            Write Response
          </button>
        )}

        {item.status === 'closed' && (
          <button
            onClick={() => void changeStatus('received')}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
            style={{ background: 'rgba(96,165,250,0.10)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.12)' }}
          >
            <RotateCcw size={14} />
            Reopen
          </button>
        )}

        {item.status !== 'closed' && (
          <button
            onClick={() => setShowCloseDialog(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
            style={{ background: 'rgba(148,163,184,0.08)', color: 'var(--on-surface-variant)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <X size={14} />
            Close
          </button>
        )}
      </div>

      {/* Response editor */}
      {showResponseEditor && (
        <div className="space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
            Write Response
          </label>
          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            rows={5}
            maxLength={MAX_RESPONSE}
            className="w-full rounded-[18px] px-4 py-3 text-sm resize-none outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 16,
            }}
            placeholder="Write your response..."
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: responseText.length > MAX_RESPONSE ? 'var(--status-failed)' : 'var(--on-surface-variant)' }}>
              {responseText.length}/{MAX_RESPONSE}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowResponseEditor(false); setResponseText('') }}
                className="rounded-full px-4 py-2 text-xs"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                disabled={saving || !responseText.trim() || responseText.length > MAX_RESPONSE}
                className="rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-50"
                style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
              >
                {saving ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dialog */}
      {showCloseDialog && (
        <div className="space-y-3 rounded-[18px] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>Close this feedback?</p>
          <textarea
            value={closureNote}
            onChange={e => setClosureNote(e.target.value)}
            rows={3}
            maxLength={MAX_CLOSURE}
            className="w-full rounded-[16px] px-4 py-3 text-sm resize-none outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 16,
            }}
            placeholder="Optional closure note (e.g., 'Implemented in v2.1')"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{closureNote.length}/{MAX_CLOSURE}</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCloseDialog(false); setClosureNote('') }}
                className="rounded-full px-4 py-2 text-xs"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => void changeStatus('closed', closureNote || undefined)}
                disabled={saving || closureNote.length > MAX_CLOSURE}
                className="rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-50"
                style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--on-surface)' }}
              >
                {saving ? 'Closing...' : 'Close Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback strip */}
      {error && (
        <p className="text-sm" style={{ color: 'var(--status-failed)' }}>{error}</p>
      )}
      {notice && (
        <p className="text-sm" style={{ color: 'var(--status-active)' }}>{notice}</p>
      )}
    </div>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
