'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DisableUserButtonProps {
  userId: string
  userName: string | null
}

export function DisableUserButton({ userId, userName }: DisableUserButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleConfirm(reason?: string) {
    setError(null)

    const res = await fetch(`/api/admin/users/${userId}/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to disable user.')
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
        style={{
          background: 'rgba(239,68,68,0.08)',
          color: '#ef4444',
        }}
      >
        Disable
      </button>

      <ConfirmModal
        open={open}
        title="Disable User"
        description={`Are you sure you want to disable ${userName ?? 'this user'}? They will lose access to the system.`}
        confirmLabel="Disable"
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
