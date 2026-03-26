'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong while loading this section.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-6 py-8 text-center"
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
    >
      <AlertTriangle size={24} style={{ color: 'var(--status-failed)' }} />
      <p
        className="mt-3 text-[13px] leading-relaxed"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--status-failed)' }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]"
      style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--status-failed)' }}
    >
      <AlertTriangle size={13} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
