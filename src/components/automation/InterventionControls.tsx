'use client'

import { useState } from 'react'
import { InterventionModal } from './InterventionModal'

interface InterventionControlsProps {
  runId: string
}

type OpenAction = 'pause' | 'resume' | 'cancel' | null

export function InterventionControls({ runId }: InterventionControlsProps) {
  const [openAction, setOpenAction] = useState<OpenAction>(null)

  function open(action: 'pause' | 'resume' | 'cancel') {
    setOpenAction(action)
  }

  function close() {
    setOpenAction(null)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => open('pause')}
          className="inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => open('resume')}
          className="inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
        >
          Resume
        </button>
        <button
          type="button"
          onClick={() => open('cancel')}
          className="inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'rgba(248,113,113,0.14)', color: 'var(--status-failed)' }}
        >
          Cancel
        </button>
      </div>

      {openAction && (
        <InterventionModal runId={runId} action={openAction} onClose={close} />
      )}
    </>
  )
}
