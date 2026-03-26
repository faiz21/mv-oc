import { requireAuthUser, getAllProfiles } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UsersList } from '@/components/admin/UsersList'

export default async function AdminUsersPage() {
  const authUser = await requireAuthUser()
  const admin = isAdmin(authUser.role)

  let profiles: Awaited<ReturnType<typeof getAllProfiles>>
  if (admin) {
    const adminClient = createAdminClient()
    profiles = await getAllProfiles(adminClient)
  } else {
    // Director: show only users in their departments
    const supabase = await createClient()
    const deptIds = authUser.departmentMemberships.map((m) => m.department_id)
    const { data: memberLinks } = await supabase
      .from('department_members')
      .select('user_id')
      .in('department_id', deptIds)
    const userIds = [...new Set((memberLinks ?? []).map((m) => m.user_id))]
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .is('disabled_at', null)
        .order('full_name', { ascending: true })
      profiles = data ?? []
    } else {
      profiles = []
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <UsersList profiles={profiles} isAdmin={admin} />
    </div>
  )
}
