'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface InterventionModalProps {
  runId: string
  action: 'pause' | 'resume' | 'cancel'
  onClose: () => void
}

const ACTION_LABELS: Record<InterventionModalProps['action'], string> = {
  pause: 'Pause Run',
  resume: 'Resume Run',
  cancel: 'Cancel Run',
}

const ACTION_DESCRIPTIONS: Record<InterventionModalProps['action'], string> = {
  pause: 'This will pause the automation run and block any currently running steps. You can resume it at any time.',
  resume: 'This will resume the paused automation run and re-queue blocked steps.',
  cancel: 'This will permanently cancel the automation run. All pending and running steps will be terminated. This cannot be undone.',
}

type ModalState = 'idle' | 'loading' | 'error' | 'success'

export function InterventionModal({ runId, action, onClose }: InterventionModalProps) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const isReasonRequired = action === 'cancel'
  const canSubmit = modalState !== 'loading' && (!isReasonRequired || reason.trim().length > 0)

  async function handleConfirm() {
    if (!canSubmit) return

    setModalState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/automation/runs/${runId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
        redirect: 'manual',
      })

      // API returns 2xx JSON on success, or redirect (treated as success here)
      if (response.ok || response.type === 'opaqueredirect' || response.status === 0) {
        setModalState('success')
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 800)
        return
      }

      let errMsg = `Request failed (${response.status})`
      try {
        const body = await response.json()
        if (typeof body?.error === 'string') errMsg = body.error
      } catch {
        // ignore parse error
      }
      setErrorMessage(errMsg)
      setModalState('error')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(message)
      setModalState('error')
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intervention-modal-title"
        className="relative w-full max-w-md rounded-[28px] border px-7 py-7 shadow-2xl"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-container)' }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
            Confirm Action
          </div>
          <h2
            id="intervention-modal-title"
            className="mt-2 text-[22px] font-semibold tracking-[-0.03em]"
            style={{ color: 'var(--on-surface)' }}
          >
            {ACTION_LABELS[action]}
          </h2>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>
          {ACTION_DESCRIPTIONS[action]}
        </p>

        {/* Reason field */}
        <div className="mb-5">
          <label
            htmlFor="intervention-reason"
            className="mb-2 block text-[11px] uppercase tracking-[0.16em]"
            style={{ color: 'var(--secondary)' }}
          >
            Reason{isReasonRequired ? <span style={{ color: 'var(--status-failed)' }}> *</span> : ' (optional)'}
          </label>
          <textarea
            id="intervention-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={modalState === 'loading' || modalState === 'success'}
            placeholder={
              action === 'cancel'
                ? 'Explain why this run is being cancelled…'
                : 'Add a note (optional)…'
            }
            rows={3}
            className="w-full resize-none rounded-[16px] border px-4 py-3 text-sm outline-none transition-colors"
            style={{
              borderColor: 'var(--border-default)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--on-surface)',
            }}
          />
          {isReasonRequired && reason.trim().length === 0 && modalState !== 'success' && (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--status-failed)' }}>
              A reason is required to cancel this run.
            </p>
          )}
        </div>

        {/* Error state */}
        {modalState === 'error' && errorMessage && (
          <div
            className="mb-4 rounded-[16px] border px-4 py-3 text-sm"
            style={{
              borderColor: 'rgba(248,113,113,0.3)',
              background: 'rgba(248,113,113,0.10)',
              color: 'var(--status-failed)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Success state */}
        {modalState === 'success' && (
          <div
            className="mb-4 rounded-[16px] border px-4 py-3 text-sm"
            style={{
              borderColor: 'rgba(110,231,183,0.3)',
              background: 'rgba(110,231,183,0.10)',
              color: 'var(--status-active)',
            }}
          >
            Action applied successfully.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={modalState === 'loading'}
            className="inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--on-surface)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={
              action === 'cancel'
                ? { background: 'rgba(248,113,113,0.18)', color: 'var(--status-failed)' }
                : { background: 'rgba(255,193,116,0.18)', color: 'var(--primary)' }
            }
          >
            {modalState === 'loading' ? 'Working…' : ACTION_LABELS[action]}
          </button>
        </div>
      </div>
    </div>
  )
}
