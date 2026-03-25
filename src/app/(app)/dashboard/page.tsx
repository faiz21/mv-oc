import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Activity } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [runsResult, agentsResult] = await Promise.all([
    supabase
      .from('workflow_runs')
      .select('id, workflow_id, status, trigger_type, sla_due_at, started_at, created_at')
      .in('status', ['pending', 'running', 'awaiting_approval', 'paused'])
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('agents')
      .select('id, name, status, last_seen, error_rate_24h')
      .is('deleted_at', null),
  ])

  const runs = runsResult.data ?? []
  const agents = agentsResult.data ?? []

  const statusColor: Record<string, string> = {
    pending: 'var(--text-muted)',
    running: 'var(--info)',
    awaiting_approval: 'var(--warning)',
    paused: 'var(--text-secondary)',
    complete: 'var(--success)',
    failed: 'var(--error)',
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Active Runs
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Task Monitor */}
        <div
          className="lg:col-span-2 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <Activity size={14} style={{ color: 'var(--info)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Live Task Monitor
            </h2>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--info-muted)', color: 'var(--info)' }}
            >
              {runs.length} active
            </span>
          </div>

          {runs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active workflow runs</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {runs.map((run) => (
                <div key={run.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: statusColor[run.status] ?? 'var(--text-muted)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                      {run.id.slice(0, 8)}…
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {run.trigger_type} · started {run.started_at ? formatRelativeTime(run.started_at) : 'just now'}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize"
                    style={{
                      background: `color-mix(in srgb, ${statusColor[run.status]} 15%, transparent)`,
                      color: statusColor[run.status],
                    }}
                  >
                    {run.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Health */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Agent Health
            </h2>
          </div>

          {agents.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No agents registered</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        agent.status === 'active' ? 'var(--success)' :
                        agent.status === 'unreachable' ? 'var(--error)' :
                        'var(--text-muted)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                    {agent.last_seen && (
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {formatRelativeTime(agent.last_seen)}
                      </p>
                    )}
                  </div>
                  {agent.error_rate_24h !== null && agent.error_rate_24h > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--error)' }}>
                      {agent.error_rate_24h}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
