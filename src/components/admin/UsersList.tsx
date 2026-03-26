'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserRoleSelect } from './UserRoleSelect'
import { AddUserModal } from './AddUserModal'
import { DisableUserButton } from './DisableUserButton'
import { getRoleLabel } from '@/lib/roles'
import type { Tables } from '@/types'

interface UsersListProps {
  profiles: Tables<'profiles'>[]
  isAdmin?: boolean
}

const roleBadgeColor: Record<string, string> = {
  admin: 'rgba(255,193,116,0.14)',
  director: 'rgba(147,197,253,0.14)',
  officer: 'rgba(167,243,208,0.14)',
  operator: 'rgba(167,243,208,0.14)',
  member: 'rgba(255,255,255,0.06)',
  viewer: 'rgba(255,255,255,0.06)',
}

const roleBadgeText: Record<string, string> = {
  admin: 'var(--primary)',
  director: 'rgb(147,197,253)',
  officer: 'rgb(167,243,208)',
  operator: 'rgb(167,243,208)',
  member: 'var(--on-surface-variant)',
  viewer: 'var(--on-surface-variant)',
}

export function UsersList({ profiles, isAdmin = false }: UsersListProps) {
  const [search, setSearch] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)

  const filtered = profiles.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
            Users
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
            {profiles.length} active user{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 w-full max-w-xs rounded-full px-4 text-[13px] outline-none"
            style={{
              background: 'var(--surface-container)',
              color: 'var(--on-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          {isAdmin && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-medium"
              style={{
                background: 'var(--primary)',
                color: 'var(--on-primary)',
              }}
            >
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]" style={{ color: 'var(--on-surface)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Name
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Email
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Role
                </th>
                <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                  Status
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                    Change Role
                  </th>
                )}
                {isAdmin && (
                  <th className="px-5 py-3 text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((profile) => (
                  <tr
                    key={profile.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-[14px] font-medium">
                      <Link
                        href={`/admin/users/${profile.id}`}
                        className="transition-colors hover:underline"
                        style={{ color: 'var(--on-surface)' }}
                      >
                        {profile.full_name || '\u2014'}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {profile.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
                        style={{
                          background: roleBadgeColor[profile.role] ?? roleBadgeColor.member,
                          color: roleBadgeText[profile.role] ?? roleBadgeText.member,
                        }}
                      >
                        {getRoleLabel(profile.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-[12px] font-medium"
                        style={{
                          background: profile.status === 'active' ? 'rgba(167,243,208,0.14)' : 'rgba(255,255,255,0.06)',
                          color: profile.status === 'active' ? 'rgb(167,243,208)' : 'var(--on-surface-variant)',
                        }}
                      >
                        {profile.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <UserRoleSelect userId={profile.id} currentRole={profile.role} />
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <DisableUserButton userId={profile.id} userName={profile.full_name} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && <AddUserModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />}
    </div>
  )
}
