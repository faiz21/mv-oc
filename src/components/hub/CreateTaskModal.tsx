'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2 } from 'lucide-react'
import { createTask, HubApiError } from '@/features/hub/api'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
}

const WORKFLOWS = [
  { id: 'weekly-report', label: 'Weekly Report' },
  { id: 'triage-emails', label: 'Triage Emails' },
  { id: 'generate-summary', label: 'Generate Summary' },
  { id: 'crm-sync', label: 'CRM Sync' },
  { id: 'data-export', label: 'Data Export' },
]

type ModalState = 'idle' | 'loading' | 'success' | 'error'

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const [workflowId, setWorkflowId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(5)
  const [triggerImmediately, setTriggerImmediately] = useState(false)
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function handleClose() {
    if (modalState === 'loading') return
    setWorkflowId('')
    setTitle('')
    setDescription('')
    setPriority(5)
    setTriggerImmediately(false)
    setModalState('idle')
    setErrorMessage('')
    setSuccessMessage('')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workflowId || !title.trim()) return

    setModalState('loading')
    setErrorMessage('')

    try {
      const result = await createTask({
        workflowId,
        title: title.trim(),
        description: description.trim(),
        priority,
        triggerImmediately,
      })
      setSuccessMessage(`Task created: ${result.taskId ? title : 'Task created successfully'}`)
      setModalState('success')
      setTimeout(() => handleClose(), 2000)
    } catch (err) {
      const msg =
        err instanceof HubApiError ? err.message : 'An unexpected error occurred. Please retry.'
      setErrorMessage(msg)
      setModalState('error')
    }
  }

  if (!open) return null

  const isValid = workflowId !== '' && title.trim().length > 0
  const isLoading = modalState === 'loading'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
    >
      <div
        className="w-full rounded-t-[28px] px-5 py-6 sm:mx-4 sm:max-w-lg sm:rounded-2xl"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--primary)' }}
            >
              Quick Action
            </div>
            <h2
              className="mt-1 font-display text-[22px] font-semibold tracking-[-0.03em]"
              style={{ color: 'var(--on-surface)' }}
            >
              Create Task
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'rgba(17,19,23,0.5)' }}
            aria-label="Close modal"
          >
            <X size={18} style={{ color: 'var(--on-surface)' }} />
          </button>
        </div>

        {/* Success state */}
        {modalState === 'success' && (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-4"
            style={{ background: 'rgba(34,197,94,0.1)' }}
          >
            <CheckCircle2 size={18} style={{ color: 'var(--status-active)' }} />
            <span className="text-[14px]" style={{ color: 'var(--status-active)' }}>
              {successMessage}
            </span>
          </div>
        )}

        {/* Form */}
        {modalState !== 'success' && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Workflow selector */}
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Workflow *
              </label>
              <select
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none disabled:opacity-50"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <option value="">Select workflow…</option>
                {WORKFLOWS.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title…"
                required
                disabled={isLoading}
                maxLength={200}
                className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none disabled:opacity-50"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={3}
                disabled={isLoading}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-[14px] outline-none disabled:opacity-50"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>

            {/* Priority */}
            <div>
              <label
                className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <span>Priority</span>
                <span style={{ color: 'var(--primary)' }}>{priority}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                disabled={isLoading}
                className="w-full accent-[var(--primary)] disabled:opacity-50"
              />
              <div
                className="mt-1 flex justify-between text-[10px]"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <span>Low (1)</span>
                <span>High (10)</span>
              </div>
            </div>

            {/* Trigger immediately */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={triggerImmediately}
                onClick={() => setTriggerImmediately((prev) => !prev)}
                disabled={isLoading}
                className="relative h-6 w-10 rounded-full transition-colors disabled:opacity-50"
                style={{
                  background: triggerImmediately
                    ? 'var(--primary)'
                    : 'rgba(255,255,255,0.15)',
                }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                  style={{ left: triggerImmediately ? 'calc(100% - 22px)' : '2px' }}
                />
              </button>
              <span className="text-[13px]" style={{ color: 'var(--on-surface)' }}>
                Trigger immediately
              </span>
            </div>

            {/* Error */}
            {modalState === 'error' && (
              <div
                className="rounded-xl px-4 py-3 text-[13px]"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-failed)' }}
              >
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 rounded-xl py-3 text-[14px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  background: 'rgba(17,19,23,0.5)',
                  color: 'var(--on-surface-variant)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
