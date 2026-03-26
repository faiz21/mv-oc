'use client'

import Link from 'next/link'

export interface DepartmentRow {
  id: string
  name: string
  slug: string
  description: string | null
  memberCount: number
}

interface DepartmentsListProps {
  departments: DepartmentRow[]
}

export function DepartmentsList({ departments }: DepartmentsListProps) {
  if (departments.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
      >
        <p style={{ fontSize: 14 }}>No departments found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface-container)' }}>
      <table className="w-full border-collapse" style={{ fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <th
              className="px-5 py-3 text-left font-medium"
              style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}
            >
              Name
            </th>
            <th
              className="px-5 py-3 text-left font-medium"
              style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}
            >
              Slug
            </th>
            <th
              className="px-5 py-3 text-right font-medium"
              style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}
            >
              Members
            </th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr
              key={dept.id}
              className="transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <td className="px-5 py-3">
                <Link
                  href={`/admin/departments/${dept.slug}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--primary)', fontSize: 14 }}
                >
                  {dept.name}
                </Link>
                {dept.description ? (
                  <p
                    className="mt-0.5 line-clamp-1"
                    style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}
                  >
                    {dept.description}
                  </p>
                ) : null}
              </td>
              <td className="px-5 py-3">
                <code
                  className="rounded-md px-2 py-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--on-surface)',
                    fontSize: 13,
                  }}
                >
                  {dept.slug}
                </code>
              </td>
              <td
                className="px-5 py-3 text-right tabular-nums"
                style={{ color: 'var(--on-surface)', fontSize: 14 }}
              >
                {dept.memberCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
