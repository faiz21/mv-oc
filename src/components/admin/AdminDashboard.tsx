'use client'

import Link from 'next/link'
import {
  type AdminSnapshot,
  type AdminSection,
  getAdminSections,
  getAdminHighlights,
  getSectionIcon,
} from '@/features/admin/admin-overview'

interface AdminDashboardProps {
  snapshot: AdminSnapshot
}

export function AdminDashboard({ snapshot }: AdminDashboardProps) {
  const sections = getAdminSections(snapshot)
  const highlights = getAdminHighlights(snapshot)

  return (
    <div className="flex flex-col gap-8">
      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {highlights.map((h) => (
          <div
            key={h.label}
            className="rounded-2xl px-4 py-3"
            style={{ background: 'var(--surface-container)' }}
          >
            <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
              {h.label}
            </div>
            <div className="mt-1 text-[18px] font-semibold" style={{ color: 'var(--on-surface)' }}>
              {h.value}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
              {h.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = getSectionIcon(section.icon)

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl px-5 py-4 transition-colors hover:bg-white/[0.02]"
              style={{
                background: 'var(--surface-container)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 rounded-lg p-2"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <Icon size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium" style={{ color: 'var(--on-surface)' }}>
                    {section.label}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                    {section.description}
                  </div>
                  <div
                    className="mt-2 text-[12px] font-medium"
                    style={{ color: 'var(--primary)' }}
                  >
                    {section.stat}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
