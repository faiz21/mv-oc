'use client'

import { useState } from 'react'

export function TestDigestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function triggerTestDigest() {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/daily-routines/digest-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      })

      const d = (await res.json()) as {
        error?: string
        message?: string
        approval_queue_id?: string
      }

      if (!res.ok) {
        setResult({ type: 'error', text: d.error ?? 'Failed to generate test digest' })
      } else {
        setResult({
          type: 'success',
          text: `Test digest created (ID: ${d.approval_queue_id ?? '—'}). Review it in the Approval Queue.`,
        })
      }
    } catch {
      setResult({ type: 'error', text: 'Network error. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[24px] p-6" style={{ background: 'var(--surface-container)' }}>
      <h2 className="mb-1 text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
        Test Digest Generation
      </h2>
      <p className="mb-4 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
        Triggers an immediate digest using today&apos;s data. The digest enters the Approval Queue
        and follows the full approval flow — no auto-send.
      </p>

      {result && (
        <div
          className="mb-4 rounded-[14px] px-4 py-3 text-[13px]"
          style={{
            background:
              result.type === 'success'
                ? 'rgba(110,231,183,0.08)'
                : 'rgba(248,113,113,0.08)',
            color:
              result.type === 'success' ? 'var(--status-active)' : 'var(--status-failed)',
          }}
        >
          {result.type === 'success' ? '✓ ' : ''}{result.text}
        </div>
      )}

      <button
        onClick={() => void triggerTestDigest()}
        disabled={loading}
        className="inline-flex min-h-[48px] items-center justify-center rounded-full px-6 py-3 text-[13px] font-semibold disabled:opacity-50"
        style={{
          background: 'var(--surface-container-high)',
          color: 'var(--on-surface)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {loading ? 'Generating...' : 'Test Digest Generation'}
      </button>
    </div>
  )
}
