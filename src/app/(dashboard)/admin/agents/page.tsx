import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAgentDefinitions, getRuntimeAgents } from '@/lib/data/agents'
import { AgentRegistryList } from '@/components/admin/AgentRegistryList'

export default async function AdminAgentsPage() {
  const authUser = await requireAuthUser()
  const admin = isAdmin(authUser.role)

  const adminClient = createAdminClient()
  const departmentIds = admin
    ? undefined
    : authUser.departmentMemberships.map((m) => m.department_id)

  const [definitions, runtimeAgents] = await Promise.all([
    getAgentDefinitions(adminClient),
    getRuntimeAgents(adminClient, departmentIds),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <AgentRegistryList
        definitions={definitions}
        runtimeAgents={runtimeAgents}
        isAdmin={admin}
      />
    </div>
  )
}
