'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DecommissionAgentButtonProps {
  agentId: string
  agentName: string
}

export function DecommissionAgentButton({ agentId, agentName }: DecommissionAgentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleConfirm(reason?: string) {
    setError(null)

    const res = await fetch(`/api/admin/agents/${agentId}/decommission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to decommission agent.')
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
        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
      >
        Decommission
      </button>

      <ConfirmModal
        open={open}
        title="Decommission Agent"
        description={`Are you sure you want to decommission "${agentName}"? This agent will be taken offline.`}
        confirmLabel="Decommission"
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
