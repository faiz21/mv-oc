import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuthUser } from '@/lib/data/auth'
import { canAccessAdminSurface } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { BoardColumnsPanel } from '@/components/admin/BoardColumnsPanel'

export default async function AdminDepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const authUser = await requireAuthUser()
  if (!canAccessAdminSurface(authUser.role)) redirect('/')

  const { slug } = await params
  const supabase = await createClient()

  const { data: department } = await supabase
    .from('departments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!department) redirect('/admin/departments')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin/departments"
        className="mb-4 inline-block text-[13px] transition-colors hover:underline"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        &larr; All Departments
      </Link>

      <div className="mb-8">
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--on-surface)' }}
        >
          {department.name}
        </h1>
        {department.description ? (
          <p
            className="mt-1 text-[13px]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {department.description}
          </p>
        ) : null}
      </div>

      <section>
        <h2
          className="mb-4 text-[15px] font-semibold"
          style={{ color: 'var(--on-surface)' }}
        >
          Board Columns
        </h2>
        <p
          className="mb-4 text-[13px]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          Configure the columns that appear on this department&apos;s task board.
        </p>
        <BoardColumnsPanel departmentId={department.id} />
      </section>
    </div>
  )
}
