import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PointConfigPanel } from '@/components/gaming/admin/PointConfigPanel'
import { SandboxAnalyticsPanel } from '@/components/gaming/admin/SandboxAnalyticsPanel'

const CONFIG_KEY = 'gamification_point_config'

const DEFAULT_CONFIGS = [
  { action_type: 'task_completed',           base_points: 10, bonus_points: 5, enabled: true },
  { action_type: 'approval_reviewed_fast',   base_points: 15, bonus_points: 0, enabled: true },
  { action_type: 'approval_reviewed_slow',   base_points: 5,  bonus_points: 0, enabled: true },
  { action_type: 'approval_rejected',        base_points: 5,  bonus_points: 0, enabled: true },
  { action_type: 'standup_submitted_ontime', base_points: 5,  bonus_points: 0, enabled: true },
  { action_type: 'standup_submitted_late',   base_points: 2,  bonus_points: 0, enabled: true },
  { action_type: 'incident_high_severity',   base_points: 25, bonus_points: 0, enabled: true },
  { action_type: 'workflow_created',         base_points: 10, bonus_points: 0, enabled: true },
  { action_type: 'daily_login',              base_points: 2,  bonus_points: 0, enabled: true },
]

export default async function AdminGamificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Load stored point config from system_state
  const { data: stateRow } = await supabase
    .from('system_state')
    .select('value')
    .eq('key', CONFIG_KEY)
    .single()

  const stored = typeof stateRow?.value === 'object' && stateRow?.value !== null
    ? stateRow.value as Record<string, { base_points?: number; bonus_points?: number; enabled?: boolean }>
    : {}

  const configs = DEFAULT_CONFIGS.map(d => ({
    id: d.action_type,
    action_type: d.action_type,
    base_points: stored[d.action_type]?.base_points ?? d.base_points,
    bonus_points: stored[d.action_type]?.bonus_points ?? d.bonus_points,
    enabled: stored[d.action_type]?.enabled ?? d.enabled,
  }))

  // Global stats
  const { count: optedInCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('gamification_enabled', true)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weekPointsRows } = await supabase
    .from('points_log')
    .select('points, user_id')
    .gte('created_at', sevenDaysAgo.toISOString())

  const weekPoints = (weekPointsRows || []).reduce((sum, r) => sum + r.points, 0)
  const activeUserIds = new Set((weekPointsRows || []).map(r => r.user_id))
  const avgPointsPerUser = activeUserIds.size > 0 ? Math.round(weekPoints / activeUserIds.size) : 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Gamification Configuration
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Configure point values, view sandbox analytics, and monitor participation.
          </p>
        </div>

        {/* Global stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Opted In</div>
            <div className="mt-1 text-[24px] font-bold" style={{ color: 'var(--on-surface)' }}>{optedInCount ?? 0}</div>
            <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>users</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Avg Points</div>
            <div className="mt-1 text-[24px] font-bold" style={{ color: 'var(--on-surface)' }}>{avgPointsPerUser}</div>
            <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>per active user this week</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Total Points</div>
            <div className="mt-1 text-[24px] font-bold" style={{ color: 'var(--on-surface)' }}>{weekPoints.toLocaleString()}</div>
            <div className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>awarded this week</div>
          </div>
        </div>

        {/* Point configuration */}
        <section className="mb-10">
          <h2 className="mb-4 text-[16px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            Point Values
          </h2>
          <PointConfigPanel configs={configs} />
        </section>

        {/* Sandbox analytics */}
        <section>
          <h2 className="mb-4 text-[16px] font-semibold" style={{ color: 'var(--on-surface)' }}>
            Sandbox Analytics
          </h2>
          <SandboxAnalyticsPanel />
        </section>
      </div>
    </div>
  )
}
