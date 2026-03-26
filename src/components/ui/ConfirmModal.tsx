'use client'

import { useEffect, useRef, useState } from 'react'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  reasonRequired?: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  reasonRequired = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [reason, setReason] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const isDestructive = variant === 'destructive'

  useEffect(() => {
    if (!open) {
      setReason('')
      return
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Block Escape for destructive modals
      if (e.key === 'Escape' && !isDestructive) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isDestructive, onCancel])

  if (!open) return null

  function handleOverlayClick(e: React.MouseEvent) {
    // Block outside-click for destructive modals
    if (isDestructive) return
    if (e.target === overlayRef.current) onCancel()
  }

  const canConfirm = !reasonRequired || reason.trim().length > 0

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2
          className="text-base font-semibold"
          style={{ color: isDestructive ? '#ef4444' : 'var(--on-surface)' }}
        >
          {title}
        </h2>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {description}
        </p>

        {reasonRequired && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)..."
            rows={3}
            className="mt-4 w-full resize-none rounded-xl px-3 py-2 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface-variant)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={!canConfirm}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-40"
            style={{
              background: isDestructive ? 'rgba(239,68,68,0.12)' : 'var(--primary)',
              color: isDestructive ? '#ef4444' : 'var(--on-primary)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
