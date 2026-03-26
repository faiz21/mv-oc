'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReviewQueueActions({ articleId }: { articleId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'publish' | 'reject' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  async function apply(decision: 'publish' | 'reject') {
    if (decision === 'reject' && !rejectionReason.trim()) {
      setMessage('Rejection note is required.')
      return
    }

    setBusy(decision)
    setMessage(decision === 'publish' ? 'Publishing article…' : 'Rejecting article…')

    const response = await fetch(`/api/wiki/${articleId}/${decision}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: decision === 'reject' ? JSON.stringify({ reason: rejectionReason.trim() }) : undefined,
    })
    const payload = await response.json()
    setBusy(null)

    if (!response.ok) {
      setMessage(payload.error ?? `Unable to ${decision} the article.`)
      return
    }

    setMessage(decision === 'publish' ? 'Article published.' : 'Article rejected and moved back to draft.')
    startTransition(() => router.refresh())
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void apply('publish')} disabled={busy !== null} className="inline-flex min-h-11 rounded-full px-4 text-sm font-semibold" style={{ background: 'rgba(110,231,183,0.14)', color: 'var(--status-active)' }}>
          Approve & Publish
        </button>
        <button type="button" onClick={() => void apply('reject')} disabled={busy !== null} className="inline-flex min-h-11 rounded-full px-4 text-sm font-semibold" style={{ background: 'rgba(248,113,113,0.14)', color: 'var(--status-failed)' }}>
          Reject
        </button>
      </div>
      <textarea
        value={rejectionReason}
        onChange={(event) => setRejectionReason(event.target.value)}
        placeholder="Required when rejecting. Explain what must change."
        className="min-h-24 rounded-[18px] border px-4 py-3 text-sm outline-none"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
      />
      {message ? (
        <span className="text-sm" style={{ color: 'var(--secondary)' }}>
          {message}
        </span>
      ) : null}
    </div>
  )
}
