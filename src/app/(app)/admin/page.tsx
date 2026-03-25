import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Bot, Key, Wrench, ClipboardList, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/hub')
  }

  const [usersResult, agentsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('agents').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const adminSections = [
    {
      label: 'Users',
      description: 'Manage team members and roles',
      icon: <Users size={20} />,
      href: '/admin/users',
      stat: `${usersResult.count ?? 0} active`,
      color: 'var(--info)',
      bg: 'var(--info-muted)',
    },
    {
      label: 'Agents',
      description: 'Register and monitor AI agents',
      icon: <Bot size={20} />,
      href: '/admin/agents',
      stat: `${agentsResult.count ?? 0} registered`,
      color: 'var(--accent)',
      bg: 'var(--accent-muted)',
    },
    {
      label: 'Environment',
      description: 'Secrets health and API keys',
      icon: <Key size={20} />,
      href: '/admin/environment',
      stat: 'Health check',
      color: 'var(--success)',
      bg: 'var(--success-muted)',
    },
    {
      label: 'Diagnostics',
      description: 'System health and channel checks',
      icon: <Wrench size={20} />,
      href: '/admin/diagnostics',
      stat: 'Run checks',
      color: 'var(--warning)',
      bg: 'var(--warning-muted)',
    },
    {
      label: 'Task Queue',
      description: 'Stuck tasks and force-release',
      icon: <AlertCircle size={20} />,
      href: '/admin/queue',
      stat: 'View queue',
      color: 'var(--error)',
      bg: 'var(--error-muted)',
    },
    {
      label: 'Audit Log',
      description: 'Compliance and export',
      icon: <ClipboardList size={20} />,
      href: '/admin/audit-log',
      stat: 'View all',
      color: 'var(--text-secondary)',
      bg: 'var(--bg-elevated)',
    },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Admin Panel
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          System governance and configuration
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl p-4 block transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: section.bg, color: section.color }}
            >
              {section.icon}
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {section.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {section.description}
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: section.color }}>
              {section.stat}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
