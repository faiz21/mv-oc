'use client'

import { useMemo, useState } from 'react'
import type { Tables } from '@/types'

interface ProjectWithDepartment extends Tables<'projects'> {
  departmentName: string
}

interface ProjectsListProps {
  projects: ProjectWithDepartment[]
  departments: Tables<'departments'>[]
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(76,175,80,0.14)', color: 'var(--status-active, #4caf50)' },
  completed: { bg: 'rgba(33,150,243,0.14)', color: 'var(--status-completed, #2196f3)' },
  archived: { bg: 'rgba(255,255,255,0.06)', color: 'var(--on-surface-variant, #9e9e9e)' },
  on_hold: { bg: 'rgba(255,193,116,0.14)', color: 'var(--primary, #ffc174)' },
  planning: { bg: 'rgba(156,39,176,0.14)', color: '#ce93d8' },
}

function statusStyle(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.active
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProjectsList({ projects, departments }: ProjectsListProps) {
  const [filterDept, setFilterDept] = useState<string>('all')

  const filtered = useMemo(() => {
    if (filterDept === 'all') return projects
    return projects.filter((p) => p.department_id === filterDept)
  }, [projects, filterDept])

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
          Projects
        </h1>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="min-h-10 rounded-full px-4 text-[13px] outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--on-surface)' }}
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: 'var(--surface-container, #1e1e1e)' }}
      >
        {filtered.length === 0 ? (
          <div
            className="px-5 py-10 text-center text-[13px]"
            style={{ color: 'var(--on-surface-variant, #9e9e9e)' }}
          >
            No projects found.
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr
                className="border-b text-[12px] uppercase tracking-wider"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'var(--on-surface-variant, #9e9e9e)',
                }}
              >
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Department</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const s = statusStyle(project.status)
                return (
                  <tr
                    key={project.id}
                    className="border-b last:border-b-0 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-5 py-3" style={{ color: 'var(--on-surface)' }}>
                      <div className="font-medium text-[14px]">{project.name}</div>
                      {project.description ? (
                        <div
                          className="mt-0.5 line-clamp-1 text-[12px]"
                          style={{ color: 'var(--on-surface-variant, #9e9e9e)' }}
                        >
                          {project.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {formatStatus(project.status)}
                      </span>
                    </td>
                    <td
                      className="hidden px-5 py-3 sm:table-cell"
                      style={{ color: 'var(--on-surface-variant, #9e9e9e)' }}
                    >
                      {project.departmentName}
                    </td>
                    <td
                      className="hidden px-5 py-3 md:table-cell"
                      style={{ color: 'var(--on-surface-variant, #9e9e9e)' }}
                    >
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Count footer */}
      <div
        className="text-[12px]"
        style={{ color: 'var(--on-surface-variant, #9e9e9e)' }}
      >
        {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        {filterDept !== 'all' ? ' in selected department' : ' total'}
      </div>
    </div>
  )
}
