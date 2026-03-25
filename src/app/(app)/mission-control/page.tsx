import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Inbox, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function MissionControlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('approval_queue')
    .select('id, gate_type, source_type, source_ref, status, content, submitted_by, assigned_reviewer_id, expires_at, created_at')
    .eq('status', 'awaiting_review')
    .order('created_at', { ascending: true })
    .limit(50)

  const queue = items ?? []

  const gateTypeLabel: Record<string, string> = {
    'outbound-message': 'MESSAGE',
    'task-result': 'RESULT',
    'document': 'DOCUMENT',
    'publish': 'PUBLISH',
  }

  return (
    <div className="flex h-full">
      {/* Queue List Column */}
      <div
        className="w-[280px] flex-shrink-0 flex flex-col"
        style={{ borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Inbox size={15} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Inbox
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {queue.length} pending approval{queue.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1 px-3 py-2"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {['PRIORITY', 'RECENT'].map((tab) => (
            <button
              key={tab}
              className="text-[10px] font-semibold px-2.5 py-1 rounded"
              style={{
                background: tab === 'PRIORITY' ? 'var(--bg-elevated)' : 'transparent',
                color: tab === 'PRIORITY' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Shield size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No pending approvals</p>
            </div>
          ) : (
            queue.map((item) => {
              const title = (item.content as Record<string, unknown>)?.title as string ?? item.source_ref
              const description = (item.content as Record<string, unknown>)?.description as string ?? ''
              const agentName = (item.content as Record<string, unknown>)?.agent_name as string ?? null

              return (
                <div
                  key={item.id}
                  className="px-3 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {/* Type label + timestamp */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      {gateTypeLabel[item.gate_type] ?? item.gate_type.toUpperCase()}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </p>

                  {/* Description */}
                  {description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {description}
                    </p>
                  )}

                  {/* Agent badge */}
                  {agentName && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ background: 'var(--info)' }}
                      />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Generated by {agentName}
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Detail Panel — empty state */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Inbox size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Select an item to review
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Click an approval from the queue to view details and take action
          </p>
        </div>
      </div>
    </div>
  )
}
