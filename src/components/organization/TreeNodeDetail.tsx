'use client'

import { X } from 'lucide-react'

interface AgentNodeDetail {
  kind: 'agent'
  id: string
  label: string
  status: string
  description?: string | null
  endpoint?: string | null
  capabilities: string[]
  ownerName?: string | null
}

interface HumanNodeDetail {
  kind: 'human'
  id: string
  label: string
  role: string
  email: string
  departmentName?: string | null
  managerName?: string | null
}

export type TreeNodeDetailRecord = AgentNodeDetail | HumanNodeDetail

interface Props {
  node: TreeNodeDetailRecord | null
  onClose: () => void
}

export function TreeNodeDetail({ node, onClose }: Props) {
  if (!node) return null

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-y-auto shadow-2xl md:w-[320px]"
      style={{
        background: 'var(--surface-container)',
        borderLeft: '1px solid var(--border-default)',
        transition: 'transform 200ms ease',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b px-5 py-5" style={{ borderColor: 'var(--border-default)' }}>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--mv-light-blue)' }}>
            {node.kind === 'agent' ? 'Agent' : 'Person'}
          </div>
          <div className="mt-1 truncate text-[20px] font-semibold leading-tight" style={{ color: 'var(--on-surface)' }}>
            {node.label}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}
          aria-label="Close detail panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 px-5 py-5">
        {node.kind === 'agent' && (
          <>
            <DetailRow label="Status">
              <span className="flex items-center gap-2">
                <StatusDot status={node.status} />
                <span className="capitalize" style={{ color: 'var(--on-surface)' }}>{node.status}</span>
              </span>
            </DetailRow>

            {node.description && (
              <DetailRow label="Description">
                <p className="text-sm leading-6" style={{ color: 'var(--secondary)' }}>{node.description}</p>
              </DetailRow>
            )}

            {node.endpoint && (
              <DetailRow label="Endpoint">
                <code className="break-all rounded px-2 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--tertiary)' }}>
                  {node.endpoint}
                </code>
              </DetailRow>
            )}

            {node.capabilities && node.capabilities.length > 0 && (
              <DetailRow label="Capabilities">
                <div className="flex flex-wrap gap-1">
                  {node.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ background: 'rgba(58,126,200,0.15)', color: 'var(--mv-light-blue)' }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </DetailRow>
            )}

            {node.ownerName && (
              <DetailRow label="Owner">
                <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{node.ownerName}</span>
              </DetailRow>
            )}

            {!node.ownerName && (
              <div className="rounded-[12px] border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.3)', color: 'var(--status-failed)' }}>
                No owner assigned
              </div>
            )}
          </>
        )}

        {node.kind === 'human' && (
          <>
            <DetailRow label="Role">
              <span
                className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize"
                style={{ background: 'rgba(255,193,116,0.12)', color: 'var(--primary)' }}
              >
                {node.role}
              </span>
            </DetailRow>

            <DetailRow label="Email">
              <span className="break-all text-sm" style={{ color: 'var(--on-surface)' }}>{node.email}</span>
            </DetailRow>

            {node.departmentName && (
              <DetailRow label="Department">
                <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{node.departmentName}</span>
              </DetailRow>
            )}

            {node.managerName && (
              <DetailRow label="Reports To">
                <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{node.managerName}</span>
              </DetailRow>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  let color = 'var(--status-active)'
  if (status === 'deprecated' || status === 'inactive') color = 'var(--status-warn)'
  if (status === 'unreachable') color = 'var(--status-failed)'

  return (
    <span
      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden="true"
    />
  )
}
