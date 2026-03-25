import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GitBranch, Plus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, key, name, description, status, requires_approval, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50)

  const items = workflows ?? []

  const statusColor: Record<string, { bg: string; color: string }> = {
    draft:    { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
    active:   { bg: 'var(--success-muted)', color: 'var(--success)' },
    inactive: { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Workflows
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {items.length} workflow{items.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* Workflow list */}
      {items.length === 0 ? (
        <div
          className="rounded-xl px-6 py-16 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <GitBranch size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            No workflows yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Create your first workflow to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((wf) => {
            const s = statusColor[wf.status] ?? statusColor.draft
            return (
              <div
                key={wf.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <GitBranch size={16} style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {wf.name}
                  </p>
                  {wf.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {wf.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {wf.requires_approval && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
                      APPROVAL GATE
                    </span>
                  )}
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize"
                    style={s}
                  >
                    {wf.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(wf.updated_at)}
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
