'use client'

import { useState } from 'react'
import { Plus, Play } from 'lucide-react'
import { useUser } from '@/components/providers/user-provider'
import { isMemberRole } from '@/lib/roles'
import { CreateTaskModal } from '@/components/hub/CreateTaskModal'

function TriggerWorkflowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[28px] px-5 py-6 sm:mx-4 sm:max-w-lg sm:rounded-2xl"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
          Quick Action
        </div>
        <h2
          className="mt-1 font-display text-[22px] font-semibold tracking-[-0.03em]"
          style={{ color: 'var(--on-surface)' }}
        >
          Trigger Workflow
        </h2>
        <p className="mt-4 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
          Workflow triggering is coming soon. Use the Workflow Library to start a workflow run directly.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3 text-[14px] font-medium"
          style={{ background: 'rgba(17,19,23,0.5)', color: 'var(--on-surface-variant)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export function QuickActions() {
  const user = useUser()
  const isMember = isMemberRole(user.role)
  const [createOpen, setCreateOpen] = useState(false)
  const [triggerOpen, setTriggerOpen] = useState(false)

  // Members cannot create tasks or trigger workflows
  if (isMember) return null

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          <Plus size={16} />
          Create Task
        </button>
        <button
          type="button"
          onClick={() => setTriggerOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(17,19,23,0.5)',
            color: 'var(--on-surface)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Play size={16} />
          Trigger Workflow
        </button>
      </div>

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TriggerWorkflowModal open={triggerOpen} onClose={() => setTriggerOpen(false)} />
    </>
  )
}
