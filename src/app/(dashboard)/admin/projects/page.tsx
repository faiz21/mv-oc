import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { getDepartments, getDepartmentProjects } from '@/lib/data/departments'
import { ProjectsList } from '@/components/admin/ProjectsList'

export default async function AdminProjectsPage() {
  const user = await requireAuthUser()
  const admin = isAdmin(user.role)

  const supabase = await createClient()
  const allDepartments = await getDepartments(supabase)

  // Directors see only their departments
  const deptIds = user.departmentMemberships.map((m) => m.department_id)
  const departments = admin
    ? allDepartments
    : allDepartments.filter((d) => deptIds.includes(d.id))

  const projectsByDept = await Promise.all(
    departments.map((dept) => getDepartmentProjects(supabase, dept.id)),
  )

  const projects = departments.flatMap((dept, i) =>
    projectsByDept[i].map((p) => ({ ...p, departmentName: dept.name })),
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <ProjectsList projects={projects} departments={departments} />
    </div>
  )
}
