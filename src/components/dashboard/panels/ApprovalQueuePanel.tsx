'use client'

import { useCallback, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { DashboardPanel } from '@/components/dashboard/shared/DashboardPanel'
import { StatusBadge } from '@/components/dashboard/shared/StatusBadge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { RoleGate } from '@/components/dashboard/shared/RoleGate'
import { useDashboardRealtime } from '@/features/dashboard/hooks/use-dashboard-realtime'
import { approveItem } from '@/features/dashboard/actions/approve-item'
import { getPendingApprovals } from '@/features/dashboard/data'
import type { Tables } from '@/types'
import { useUser } from '@/components/providers/user-provider'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface ApprovalQueuePanelProps {
  initialItems: Tables<'approval_queue'>[]
}

type ModalState =
  | { open: false }
  | {
      open: true
      itemId: string
      decision: 'approved' | 'rejected'
      summary: string
      notes: string
    }

export function ApprovalQueuePanel({ initialItems }: ApprovalQueuePanelProps) {
  const { id: userId } = useUser()
  const [items, setItems] = useState<Tables<'approval_queue'>[]>(initialItems)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesByItem, setNotesByItem] = useState<Record<string, string>>({})
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const fresh = await getPendingApprovals(supabase)
    setItems(fresh)
  }, [])

  useDashboardRealtime({
    onApprovalQueueChange: () => {
      void refetch()
    },
  })

  function handleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function openModal(
    itemId: string,
    decision: 'approved' | 'rejected',
    summary: string,
    notes: string,
  ) {
    // Reject: must have notes
    if (decision === 'rejected' && !notes.trim()) return
    setModal({ open: true, itemId, decision, summary, notes })
  }

  function handleConfirm() {
    if (!modal.open) return
    const { itemId, decision, notes } = modal
    setModal({ open: false })

    startTransition(async () => {
      const result = await approveItem({
        approvalQueueId: itemId,
        decision,
        notes,
        reviewedBy: userId,
      })

      if (result.success) {
        // Optimistic remove
        setItems((prev) => prev.filter((i) => i.id !== itemId))
        setExpandedId((prev) => (prev === itemId ? null : prev))
        showToast(
          decision === 'approved' ? 'Approval recorded' : 'Rejection recorded',
        )
      } else {
        showToast(`Error: ${result.error ?? 'Unknown error'}`)
      }
    })
  }

  function getContentPreview(item: Tables<'approval_queue'>): string {
    const content = item.content as Record<string, unknown>
    const msg =
      content?.message ??
      content?.description ??
      content?.summary ??
      content?.title

    if (typeof msg === 'string') {
      return msg.slice(0, 150) + (msg.length > 150 ? '…' : '')
    }

    return JSON.stringify(content).slice(0, 150) + '…'
  }

  function renderFullContent(item: Tables<'approval_queue'>) {
    const content = item.content as Record<string, unknown>
    const gateType = item.gate_type

    if (gateType === 'outbound-message') {
      const msg = content?.message
      return (
        <div
          className="mt-2 rounded-xl p-3 text-[13px] leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--on-surface)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {typeof msg === 'string' ? msg : JSON.stringify(content, null, 2)}
        </div>
      )
    }

    if (gateType === 'document') {
      const body = content?.body ?? content?.content
      return (
        <div
          className="mt-2 rounded-xl p-3 text-[13px] leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--on-surface)',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
          }}
        >
          {typeof body === 'string' ? body : JSON.stringify(content, null, 2)}
        </div>
      )
    }

    // task-result, publish: pretty JSON
    return (
      <pre
        className="mt-2 overflow-x-auto rounded-xl p-3 text-[12px]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--on-surface)',
          fontFamily: 'monospace',
        }}
      >
        {JSON.stringify(content, null, 2)}
      </pre>
    )
  }

  function getAgeBg(createdAt: string): string {
    const ageMs = Date.now() - Date.parse(createdAt)
    return ageMs > 60 * 60 * 1000 ? 'rgba(245,158,11,0.06)' : 'transparent'
  }

  return (
    <>
      <DashboardPanel
        title="Approval Queue"
        count={items.length}
        isLive
        onRefresh={refetch}
      >
        {items.length === 0 ? (
          <div
            className="py-10 text-center text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            No pending approvals
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isExpanded = expandedId === item.id
              const notes = notesByItem[item.id] ?? ''
              const canReject = notes.trim().length > 0
              const content = item.content as Record<string, unknown>
              const summary =
                typeof content?.title === 'string' ? content.title : item.source_ref

              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: getAgeBg(item.created_at),
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Row header */}
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                    onClick={() => handleExpand(item.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.gate_type} label={item.gate_type.replace(/-/g, ' ')} />
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--on-surface-variant)' }}
                          >
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p
                          className="mt-1 truncate text-[13px]"
                          style={{ color: 'var(--on-surface)' }}
                        >
                          {getContentPreview(item)}
                        </p>
                      </div>

                      <span
                        className="shrink-0"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {/* Full content */}
                      {renderFullContent(item)}

                      {/* Notes field */}
                      <RoleGate allow={['admin', 'officer']}>
                        <div className="mt-4">
                          <label
                            htmlFor={`notes-${item.id}`}
                            className="block text-[11px] font-medium uppercase tracking-wide"
                            style={{ color: 'var(--on-surface-variant)' }}
                          >
                            Approval Notes
                            <span style={{ color: '#fca5a5' }}> *required for rejection</span>
                          </label>
                          <textarea
                            id={`notes-${item.id}`}
                            value={notes}
                            onChange={(e) =>
                              setNotesByItem((prev) => ({
                                ...prev,
                                [item.id]: e.target.value.slice(0, 500),
                              }))
                            }
                            rows={3}
                            maxLength={500}
                            placeholder="Optional note for approval, required for rejection…"
                            className="mt-2 w-full resize-none rounded-xl px-3 py-2 text-[13px] outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: 'var(--on-surface)',
                            }}
                          />
                          <div
                            className="mt-1 text-right text-[11px]"
                            style={{ color: 'var(--on-surface-variant)' }}
                          >
                            {notes.length}/500
                          </div>
                        </div>

                        {/* Action buttons — individually reviewed, NO bulk actions */}
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              openModal(item.id, 'approved', summary, notes)
                            }
                            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-40"
                            style={{
                              background: 'rgba(34,197,94,0.12)',
                              color: '#86efac',
                              border: '1px solid rgba(34,197,94,0.2)',
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={!canReject || isPending}
                            onClick={() =>
                              openModal(item.id, 'rejected', summary, notes)
                            }
                            title={
                              !canReject
                                ? 'Enter a rejection note before rejecting'
                                : 'Reject this item'
                            }
                            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-30"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </RoleGate>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DashboardPanel>

      {/* Confirmation modal */}
      <ConfirmModal
        open={modal.open}
        title={
          modal.open
            ? `${modal.decision === 'approved' ? 'Approve' : 'Reject'} this item?`
            : ''
        }
        description={
          modal.open
            ? `${modal.decision === 'approved' ? 'Approve' : 'Reject'} "${modal.summary}"? This action cannot be undone.`
            : ''
        }
        confirmLabel={
          modal.open
            ? modal.decision === 'approved'
              ? 'Confirm Approval'
              : 'Confirm Rejection'
            : 'Confirm'
        }
        variant={modal.open && modal.decision === 'rejected' ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
        onCancel={() => setModal({ open: false })}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-[13px] font-medium shadow-lg"
          style={{
            background: 'var(--surface-container)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--on-surface)',
          }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </>
  )
}
