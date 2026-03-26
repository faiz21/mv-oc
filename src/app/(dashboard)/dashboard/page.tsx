import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { LiveTaskMonitor } from '@/components/dashboard/panels/LiveTaskMonitor'
import { ApprovalQueuePanel } from '@/components/dashboard/panels/ApprovalQueuePanel'
import { AgentHealthPanel } from '@/components/dashboard/panels/AgentHealthPanel'
import { WorkflowPerformancePanel } from '@/components/dashboard/panels/WorkflowPerformancePanel'
import { SLAComplianceTiles } from '@/components/dashboard/panels/SLAComplianceTiles'
import { SystemHealthPanel } from '@/components/dashboard/panels/SystemHealthPanel'
import { AuditLogViewer } from '@/components/dashboard/panels/AuditLogViewer'
import {
  getDashboardSummary,
  getSlaThresholds,
  getSlaSnapshot,
  getWorkflowPerformance,
  getActiveWorkflowRuns,
  getPendingApprovals,
  getSystemHealth,
} from '@/features/dashboard/data'
import { getAuditLog } from '@/lib/data/audit'
import { getRuntimeAgents } from '@/lib/data/agents'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  // ─── Auth & role gate ─────────────────────────────────────────────────────
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  // member role cannot access Dashboard
  if (authUser.role === 'member') redirect('/hub')

  // ─── Department resolution ─────────────────────────────────────────────────
  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('mv-active-dept')?.value

  const departments = authUser.departmentMemberships.map((m) => ({
    id: m.department_id,
    slug: m.department.slug,
  }))

  const activeDept =
    departments.find((d) => d.slug === activeSlug) ?? departments[0]

  const departmentId = activeDept?.id ?? ''

  // ─── Parallel data fetch ───────────────────────────────────────────────────
  const supabase = await createClient()

  const [
    summary,
    slaThresholds,
    slaItems,
    workflowPerformance,
    activeRuns,
    pendingApprovals,
    systemHealth,
    auditLogResult,
    agents,
    systemStateRows,
  ] = await Promise.all([
    getDashboardSummary(supabase, departmentId),
    getSlaThresholds(supabase),
    getSlaSnapshot(supabase, departmentId),
    getWorkflowPerformance(supabase, departmentId, '24h'),
    getActiveWorkflowRuns(supabase, departmentId),
    getPendingApprovals(supabase),
    getSystemHealth(supabase, departmentId),
    getAuditLog(supabase, {
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      limit: 50,
      offset: 0,
    }),
    getRuntimeAgents(supabase, departmentId ? [departmentId] : undefined),
    supabase
      .from('system_state')
      .select('key, value')
      .in('key', [
        'agent_error_rate_alert_threshold_pct',
        'agent_offline_threshold_minutes',
      ]),
  ])

  // Resolve agent health thresholds from system_state
  const stateMap: Record<string, number> = {}
  for (const row of systemStateRows.data ?? []) {
    if (typeof row.value === 'number') stateMap[row.key] = row.value
  }
  const agentErrorThreshold = stateMap['agent_error_rate_alert_threshold_pct'] ?? 25
  const agentOfflineThresholdMinutes =
    stateMap['agent_offline_threshold_minutes'] ?? 30

  // ─── Tab content ──────────────────────────────────────────────────────────

  const operationsTab = (
    <div className="space-y-6">
      <LiveTaskMonitor
        initialRuns={activeRuns}
        departmentId={departmentId}
        slaThresholds={slaThresholds}
      />
      <ApprovalQueuePanel initialItems={pendingApprovals} />
      <SystemHealthPanel initialData={systemHealth} departmentId={departmentId} />
    </div>
  )

  const agentsTab = (
    <AgentHealthPanel
      initialAgents={agents}
      agentErrorThreshold={agentErrorThreshold}
      agentOfflineThresholdMinutes={agentOfflineThresholdMinutes}
    />
  )

  const complianceTab = (
    <div className="space-y-6">
      <SLAComplianceTiles
        initialItems={slaItems}
        slaThresholds={slaThresholds}
        departmentId={departmentId}
      />
      <AuditLogViewer
        initialEntries={auditLogResult.entries}
        initialTotal={auditLogResult.total}
      />
    </div>
  )

  const workflowsTab = (
    <WorkflowPerformancePanel
      initialData={workflowPerformance}
      departmentId={departmentId}
    />
  )

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-8">
      <DashboardHeader summary={summary} />

      <DashboardTabs
        operationsTab={operationsTab}
        agentsTab={agentsTab}
        complianceTab={complianceTab}
        workflowsTab={workflowsTab}
      />
    </div>
  )
}
