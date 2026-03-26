'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AgentFormModalProps {
  open: boolean
  onClose: () => void
  initialData?: {
    id?: string
    agentKey?: string
    name?: string
    description?: string
    capabilities?: string
    allowedTools?: string
  }
}

export function AgentFormModal({ open, onClose, initialData }: AgentFormModalProps) {
  const router = useRouter()
  const [agentKey, setAgentKey] = useState(initialData?.agentKey ?? '')
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [capabilities, setCapabilities] = useState(initialData?.capabilities ?? '[]')
  const [allowedTools, setAllowedTools] = useState(initialData?.allowedTools ?? '[]')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/admin/agents/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: initialData?.id,
        agentKey,
        name,
        description,
        capabilities,
        allowedTools,
        instructionMarkdown: '',
        inputSchema: '{}',
        outputSchema: '{}',
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save agent.')
      return
    }

    onClose()
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-2xl p-6"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--on-surface)' }}>
          {initialData?.id ? 'Edit Agent' : 'Register Agent'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                Agent Key
              </label>
              <input
                type="text"
                required
                value={agentKey}
                onChange={(e) => setAgentKey(e.target.value)}
                placeholder="my-agent"
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent Name"
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this agent do?"
              className="w-full resize-none rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Capabilities (JSON array)
            </label>
            <input
              type="text"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              Allowed Tools (JSON array)
            </label>
            <input
              type="text"
              value={allowedTools}
              onChange={(e) => setAllowedTools(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-[13px] font-medium"
              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              {isPending ? 'Saving...' : initialData?.id ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
