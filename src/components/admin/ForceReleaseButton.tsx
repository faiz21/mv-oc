'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ForceReleaseButtonProps {
  taskId: string
  taskType: string
}

export function ForceReleaseButton({ taskId, taskType }: ForceReleaseButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleConfirm(reason?: string) {
    setError(null)

    const res = await fetch(`/api/admin/tasks/${taskId}/force-release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to release task.')
      return
    }

    setOpen(false)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors"
        style={{ background: 'rgba(255,193,116,0.14)', color: 'var(--primary)' }}
      >
        Force Release
      </button>

      <ConfirmModal
        open={open}
        title="Force Release Task"
        description={`This will reset task "${taskType}" (${taskId.slice(0, 8)}) to pending and increment its attempt count.`}
        confirmLabel="Release"
        variant="destructive"
        reasonRequired
        onConfirm={handleConfirm}
        onCancel={() => {
          setOpen(false)
          setError(null)
        }}
      />

      {error && (
        <span className="ml-2 text-[11px]" style={{ color: '#ef4444' }}>
          {error}
        </span>
      )}
    </>
  )
}
