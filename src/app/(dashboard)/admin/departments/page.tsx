import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { getDepartments } from '@/lib/data/departments'
import { DepartmentsList, type DepartmentRow } from '@/components/admin/DepartmentsList'

export default async function AdminDepartmentsPage() {
  const authUser = await requireAuthUser()

  const admin = isAdmin(authUser.role)
  const supabase = await createClient()
  const allDepartments = await getDepartments(supabase)

  // Directors see only their departments
  const deptIds = authUser.departmentMemberships.map((m) => m.department_id)
  const departments = admin
    ? allDepartments
    : allDepartments.filter((d) => deptIds.includes(d.id))

  // Fetch member counts for all departments in one query
  const { data: memberCounts } = await supabase
    .from('department_members')
    .select('department_id')

  const countByDept = (memberCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.department_id] = (acc[row.department_id] ?? 0) + 1
    return acc
  }, {})

  const rows: DepartmentRow[] = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    description: dept.description,
    memberCount: countByDept[dept.id] ?? 0,
  }))

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
            Departments
          </h1>
          <p className="mt-1" style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
            {departments.length} department{departments.length !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>
      <DepartmentsList departments={rows} />
    </div>
  )
}
