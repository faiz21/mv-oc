'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  Copy,
  GitBranch,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Workflow,
} from 'lucide-react'
import type { WorkflowListItem } from '@/features/workflows/queries'
import {
  activateWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from '@/features/workflows/api'

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'rgba(56,199,135,0.12)', text: 'var(--status-active)', label: 'Active' },
  draft: { bg: 'rgba(255,193,7,0.12)', text: 'var(--tertiary)', label: 'Draft' },
  inactive: { bg: 'rgba(255,255,255,0.06)', text: 'var(--on-surface-variant)', label: 'Inactive' },
}

type SortKey = 'name' | 'updated_at' | 'status'

interface WorkflowLibraryProps {
  workflows: WorkflowListItem[]
}

export function WorkflowLibrary({ workflows }: WorkflowLibraryProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...workflows]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.key.toLowerCase().includes(q) ||
          (w.description ?? '').toLowerCase().includes(q),
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((w) => w.status === statusFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [workflows, search, statusFilter, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  async function handleActivate(workflowId: string) {
    const result = await activateWorkflow(workflowId)
    if (result.ok) router.refresh()
    setOpenMenuId(null)
  }

  async function handleDeactivate(workflowId: string) {
    const result = await deactivateWorkflow(workflowId)
    if (result.ok) router.refresh()
    setOpenMenuId(null)
  }

  async function handleDelete(workflowId: string) {
    const result = await deleteWorkflow(workflowId)
    if (result.ok) router.refresh()
    setConfirmDelete(null)
    setOpenMenuId(null)
  }

  async function handleDuplicate(workflowId: string) {
    const result = await duplicateWorkflow(workflowId)
    if (result.ok) router.refresh()
    setOpenMenuId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            Workflow Builder
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/workflow-builder/new"
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
            color: 'var(--on-primary-container)',
          }}
        >
          <Plus size={16} />
          New Workflow
        </Link>
      </div>

      {/* Filters & sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
        >
          <Search size={15} style={{ color: 'var(--on-surface-variant)' }} />
          <input
            type="text"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 bg-transparent text-[13px] outline-none placeholder:text-[var(--on-surface-variant)]"
            style={{ color: 'var(--on-surface)' }}
          />
        </div>

        <div className="flex gap-1.5">
          {['all', 'active', 'draft', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors"
              style={{
                background: statusFilter === s ? 'var(--primary)' : 'var(--surface-container)',
                color: statusFilter === s ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5">
          {([
            { key: 'name' as const, label: 'Name' },
            { key: 'updated_at' as const, label: 'Updated' },
            { key: 'status' as const, label: 'Status' },
          ]).map((sort) => (
            <button
              key={sort.key}
              onClick={() => toggleSort(sort.key)}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                background: sortKey === sort.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: sortKey === sort.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              }}
            >
              <ArrowUpDown size={11} />
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        >
          <Workflow size={32} />
          <p className="text-[14px]">
            {search || statusFilter !== 'all' ? 'No workflows match your filters.' : 'No workflows yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((workflow) => {
            const st = statusColors[workflow.status] ?? statusColors.draft
            return (
              <div
                key={workflow.id}
                className="group relative flex flex-col gap-3 rounded-2xl p-5 transition-shadow hover:shadow-lg"
                style={{
                  background: 'var(--surface-container)',
                  border: '1px solid var(--outline-variant)',
                }}
              >
                <Link
                  href={`/workflow-builder/${workflow.id}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                  aria-label={`Edit ${workflow.name}`}
                />

                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-[15px] font-semibold group-hover:underline"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {workflow.name}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-mono" style={{ color: 'var(--on-surface-variant)' }}>
                      {workflow.key}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                    {/* Actions menu */}
                    <div className="relative z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === workflow.id ? null : workflow.id)
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/5"
                        style={{ color: 'var(--on-surface-variant)' }}
                        aria-label="Actions"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenuId === workflow.id && (
                        <div
                          className="absolute right-0 top-8 z-20 w-48 rounded-xl p-1"
                          style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}
                        >
                          <Link
                            href={`/workflow-builder/${workflow.id}`}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                            style={{ color: 'var(--on-surface)' }}
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={(e) => { e.preventDefault(); void handleDuplicate(workflow.id) }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                            style={{ color: 'var(--on-surface)' }}
                          >
                            <Copy size={13} />
                            Duplicate
                          </button>
                          {workflow.status !== 'active' && (
                            <button
                              onClick={(e) => { e.preventDefault(); void handleActivate(workflow.id) }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                              style={{ color: 'var(--status-active)' }}
                            >
                              <Play size={13} />
                              Activate
                            </button>
                          )}
                          {workflow.status === 'active' && (
                            <button
                              onClick={(e) => { e.preventDefault(); void handleDeactivate(workflow.id) }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                              style={{ color: 'var(--on-surface-variant)' }}
                            >
                              <Pause size={13} />
                              Deactivate
                            </button>
                          )}
                          {confirmDelete === workflow.id ? (
                            <div className="px-3 py-2">
                              <div className="text-[11px]" style={{ color: '#ef4444' }}>Delete permanently?</div>
                              <div className="mt-1 flex gap-2">
                                <button
                                  onClick={(e) => { e.preventDefault(); void handleDelete(workflow.id) }}
                                  className="rounded-lg px-2 py-1 text-[11px] font-medium"
                                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => { e.preventDefault(); setConfirmDelete(null) }}
                                  className="rounded-lg px-2 py-1 text-[11px] font-medium"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.preventDefault(); setConfirmDelete(workflow.id) }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {workflow.description && (
                  <p
                    className="line-clamp-2 text-[13px] leading-relaxed"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {workflow.description}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center gap-4 pt-1 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={12} />
                    {workflow.versionCount} version{workflow.versionCount !== 1 ? 's' : ''}
                  </span>
                  {workflow.requires_approval && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--tertiary)' }}>
                      <ShieldCheck size={12} />
                      Approval
                    </span>
                  )}
                  <span>
                    Updated {new Date(workflow.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
