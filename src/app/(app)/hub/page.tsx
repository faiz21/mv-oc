import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/utils'
import {
  Activity,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
  Zap,
  AlertTriangle,
  Circle,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Parallel data fetches
  const [
    activeRunsResult,
    pendingApprovalsResult,
    myTasksResult,
    agentsResult,
    recentActivityResult,
    systemStateResult,
  ] = await Promise.all([
    supabase
      .from('workflow_runs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['running', 'awaiting_approval']),

    supabase
      .from('approval_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'awaiting_review'),

    supabase
      .from('tasks')
      .select('id, title, status, due_at, priority')
      .eq('assigned_to', user.id)
      .in('status', ['pending', 'queued', 'running', 'awaiting_approval'])
      .order('priority', { ascending: false })
      .limit(10),

    supabase
      .from('agents')
      .select('id, name, status, last_seen, error_rate_24h')
      .is('deleted_at', null),

    supabase
      .from('audit_log')
      .select('id, entity_type, actor_type, actor_ref, event, data, created_at')
      .order('created_at', { ascending: false })
      .limit(15),

    supabase
      .from('system_state')
      .select('key, value'),
  ])

  const activeRuns = activeRunsResult.count ?? 0
  const pendingApprovals = pendingApprovalsResult.count ?? 0
  const myTasks = myTasksResult.data ?? []
  const agents = agentsResult.data ?? []
  const recentActivity = recentActivityResult.data ?? []
  const systemState = Object.fromEntries(
    (systemStateResult.data ?? []).map((s) => [s.key, s.value])
  )

  const healthyAgents = agents.filter((a) => a.status === 'active').length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = profile?.full_name?.split(' ')[0] ?? 'there'

  const metrics = [
    {
      label: 'Active Runs',
      value: activeRuns,
      icon: <Activity size={16} />,
      href: '/dashboard',
      color: 'var(--info)',
      bg: 'var(--info-muted)',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: <Shield size={16} />,
      href: '/mission-control',
      color: pendingApprovals > 0 ? 'var(--warning)' : 'var(--success)',
      bg: pendingApprovals > 0 ? 'var(--warning-muted)' : 'var(--success-muted)',
    },
    {
      label: 'My Tasks',
      value: myTasks.length,
      icon: <CheckCircle size={16} />,
      href: '#my-queue',
      color: 'var(--accent)',
      bg: 'var(--accent-muted)',
    },
    {
      label: 'Agents Healthy',
      value: `${healthyAgents}/${agents.length}`,
      icon: <Zap size={16} />,
      href: '/admin/agents',
      color: healthyAgents === agents.length ? 'var(--success)' : 'var(--warning)',
      bg: healthyAgents === agents.length ? 'var(--success-muted)' : 'var(--warning-muted)',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {greeting}, {displayName}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Summary — 4 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-xl p-4 block transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: m.bg, color: m.color }}
              >
                {m.icon}
              </div>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {m.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Queue */}
        <div
          className="lg:col-span-2 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          id="my-queue"
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              My Queue
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {myTasks.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All clear — no tasks assigned</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <StatusDot status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {task.title ?? 'Untitled task'}
                    </p>
                    {task.due_at && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Due {formatRelativeTime(task.due_at)}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Activity
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Circle size={20} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {recentActivity.map((log) => (
                <div key={log.id} className="px-4 py-2.5 flex gap-2.5">
                  <ActivityIcon actorType={log.actor_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{log.entity_type}: </span>
                      {log.event}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-6 flex-wrap"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          System Status
        </span>
        <SystemStatusItem
          label="OpenClaw"
          status={
            systemState['global_execution']?.emergency_stop ? 'error' : 'ok'
          }
        />
        <SystemStatusItem
          label="Discord"
          status={systemState['channel_health']?.discord === 'healthy' ? 'ok' : 'warning'}
        />
        <SystemStatusItem
          label="Teams"
          status={systemState['channel_health']?.teams === 'healthy' ? 'ok' : 'warning'}
        />
        <SystemStatusItem
          label="Automation"
          status={systemState['global_automation_pause']?.paused ? 'warning' : 'ok'}
        />
        <div className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          {agents.length} agents registered · {healthyAgents} active
        </div>
      </div>

      {/* Pending Approvals banner */}
      {pendingApprovals > 0 && (
        <Link
          href="/mission-control"
          className="flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-80"
          style={{ background: 'var(--warning-muted)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
            {pendingApprovals} item{pendingApprovals !== 1 ? 's' : ''} waiting for your approval
          </span>
          <ArrowRight size={14} className="ml-auto" style={{ color: 'var(--warning)' }} />
        </Link>
      )}
    </div>
  )
}

// --- Sub-components ---

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'running' ? 'var(--info)' :
    status === 'awaiting_approval' ? 'var(--warning)' :
    status === 'failed' ? 'var(--error)' :
    'var(--text-muted)'

  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
      style={{ background: color }}
    />
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending:           { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: 'Pending' },
    queued:            { bg: 'var(--info-muted)', color: 'var(--info)', label: 'Queued' },
    running:           { bg: 'var(--info-muted)', color: 'var(--info)', label: 'Running' },
    awaiting_approval: { bg: 'var(--warning-muted)', color: 'var(--warning)', label: 'Approval' },
  }
  const s = styles[status] ?? styles.pending
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function ActivityIcon({ actorType }: { actorType: string }) {
  const color =
    actorType === 'human' ? 'var(--accent)' :
    actorType === 'agent' ? 'var(--info)' :
    'var(--text-muted)'

  return (
    <div
      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
      style={{ background: 'var(--bg-elevated)', color }}
    >
      {actorType === 'human' ? 'H' : actorType === 'agent' ? 'A' : 'S'}
    </div>
  )
}

function SystemStatusItem({ label, status }: { label: string; status: 'ok' | 'warning' | 'error' }) {
  const color =
    status === 'ok' ? 'var(--success)' :
    status === 'warning' ? 'var(--warning)' :
    'var(--error)'

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}
