'use client'

import { useState } from 'react'
import { Clock, RotateCcw } from 'lucide-react'
import type { WorkflowVersionSummary } from '@/features/workflows/editor-model'
import { restoreVersion } from '@/features/workflows/api'

interface VersionHistoryProps {
  workflowId: string
  versions: WorkflowVersionSummary[]
  currentVersionId: string | null
  onRestore?: () => void
}

export function VersionHistory({ workflowId, versions, currentVersionId, onRestore }: VersionHistoryProps) {
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleRestore(versionId: string, versionNumber: number) {
    setRestoring(versionId)
    setError(null)
    setNotice(null)

    const result = await restoreVersion(workflowId, versionId)
    if (result.ok) {
      setNotice(`Restored from v${versionNumber}. New version: v${result.data.newVersionNumber}`)
      setConfirmId(null)
      onRestore?.()
    } else {
      setError(result.errors.join(', '))
    }
    setRestoring(null)
  }

  if (versions.length === 0) {
    return (
      <div
        className="rounded-[22px] px-4 py-6 text-center text-sm"
        style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--secondary)' }}
      >
        No saved versions yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--on-surface-variant)' }}>
        <Clock size={12} />
        Version history
      </div>

      {error && (
        <div className="rounded-[18px] px-4 py-3 text-[13px]" style={{ background: 'rgba(248,113,113,0.14)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-[18px] px-4 py-3 text-[13px]" style={{ background: 'rgba(110,231,183,0.14)', color: 'var(--status-active)' }}>
          {notice}
        </div>
      )}

      <div className="space-y-2">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId
          return (
            <div
              key={version.id}
              className="rounded-[22px] px-4 py-4"
              style={{
                background: isCurrent ? 'rgba(255,193,7,0.06)' : 'rgba(255,255,255,0.03)',
                border: isCurrent ? '1px solid rgba(255,193,7,0.2)' : '1px solid transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
                    v{version.versionNumber}
                  </span>
                  {isCurrent && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                      style={{ background: 'rgba(56,199,135,0.12)', color: 'var(--status-active)' }}
                    >
                      current
                    </span>
                  )}
                </div>

                {!isCurrent && (
                  <>
                    {confirmId === version.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>Restore?</span>
                        <button
                          onClick={() => handleRestore(version.id, version.versionNumber)}
                          disabled={restoring === version.id}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                        >
                          {restoring === version.id ? 'Restoring...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(version.id)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        <RotateCcw size={11} />
                        Restore
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="mt-2 text-sm" style={{ color: 'var(--on-surface)' }}>
                {version.changeSummary || 'No summary recorded.'}
              </div>
              <div className="mt-2 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(version.createdAt).toLocaleString('en-US')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
