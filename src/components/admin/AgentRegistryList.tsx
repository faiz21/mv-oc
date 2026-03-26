'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AgentFormModal } from './AgentFormModal'
import { DecommissionAgentButton } from './DecommissionAgentButton'
import type { Tables } from '@/types'

interface AgentRegistryListProps {
  definitions: Tables<'agent_definitions'>[]
  runtimeAgents: Tables<'agents'>[]
  isAdmin: boolean
}

const statusColor: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(167,243,208,0.14)', text: 'rgb(167,243,208)' },
  draft: { bg: 'rgba(255,193,116,0.14)', text: 'var(--primary)' },
  published: { bg: 'rgba(147,197,253,0.14)', text: 'rgb(147,197,253)' },
  decommissioned: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
  archived: { bg: 'rgba(255,255,255,0.06)', text: 'var(--on-surface-variant)' },
  unreachable: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
  error: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444' },
}

export function AgentRegistryList({ definitions, runtimeAgents, isAdmin }: AgentRegistryListProps) {
  const [search, setSearch] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)

  // Merge runtime status into definitions
  const agentMap = new Map(runtimeAgents.map((a) => [a.id, a]))

  const filtered = definitions.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.agent_key.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
            Agent Registry
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {definitions.length} definition{definitions.length !== 1 ? 's' : ''} · {runtimeAgents.length} runtime agent{runtimeAgents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 w-full max-w-xs rounded-full px-4 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          {isAdmin && (
            <button
              onClick={() => setRegisterOpen(true)}
              className="whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-medium"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              Register Agent
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]" style={{ color: 'var(--on-surface)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Name</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Key</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Status</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Last Seen</th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Error Rate</th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                    {search ? 'No agents match your search.' : 'No agent definitions found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((def) => {
                  const runtime = def.published_agent_id ? agentMap.get(def.published_agent_id) : null
                  const status = runtime?.status ?? def.status
                  const colors = statusColor[status] ?? statusColor.draft

                  return (
                    <tr
                      key={def.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3 text-[14px] font-medium">
                        <Link
                          href={`/admin/agents/${def.id}`}
                          className="hover:underline"
                          style={{ color: 'var(--on-surface)' }}
                        >
                          {def.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--on-surface-variant)' }}>
                        {def.agent_key}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {runtime?.last_seen
                          ? new Date(runtime.last_seen).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                        {runtime?.error_rate_24h != null
                          ? `${(runtime.error_rate_24h * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/agents/${def.id}/edit`}
                              className="rounded-lg px-2.5 py-1 text-[12px] font-medium"
                              style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
                            >
                              Edit
                            </Link>
                            {runtime && (
                              <DecommissionAgentButton
                                agentId={runtime.id}
                                agentName={def.name}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && <AgentFormModal open={registerOpen} onClose={() => setRegisterOpen(false)} />}
    </div>
  )
}
