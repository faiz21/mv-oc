import { AlertCircle, Bot, ClipboardList, Key, Shield, Users, Wrench } from 'lucide-react'

export type AdminSnapshot = {
  activeUsers: number
  registeredAgents: number
  unreachableAgents: number
  verifiedEnvChecks: number
  stuckTasks: number
  auditEvents24h: number
}

export type AdminSection = {
  label: string
  description: string
  href: string
  stat: string
  icon: string
}

export function getAdminSections(snapshot: AdminSnapshot): AdminSection[] {
  return [
    {
      label: 'Users',
      description: 'Manage team members and operational access.',
      href: '/admin/users',
      stat: `${snapshot.activeUsers} active`,
      icon: 'users',
    },
    {
      label: 'Agents',
      description: 'Inspect the registered fleet and runtime posture.',
      href: '/admin/agents',
      stat: `${snapshot.registeredAgents} registered · ${snapshot.unreachableAgents} unreachable`,
      icon: 'bot',
    },
    {
      label: 'Environment',
      description: 'Verify required variables are present without revealing values.',
      href: '/admin/environment',
      stat: `${snapshot.verifiedEnvChecks} checks`,
      icon: 'key',
    },
    {
      label: 'Diagnostics',
      description: 'Run system checks and channel verification.',
      href: '/admin/diagnostics',
      stat: `${snapshot.stuckTasks} stuck tasks`,
      icon: 'wrench',
    },
    {
      label: 'Task Queue',
      description: 'Inspect blocked work and release tasks that are locked too long.',
      href: '/admin/queue',
      stat: 'Force release',
      icon: 'alert',
    },
    {
      label: 'Audit Log',
      description: 'Trace governance events, changes, and exports.',
      href: '/admin/audit-log',
      stat: `${snapshot.auditEvents24h} events in 24h`,
      icon: 'clipboard',
    },
  ]
}

export function getAdminHighlights(snapshot: AdminSnapshot) {
  return [
    {
      label: 'Access control',
      value: 'Admin only',
      detail: 'Frontend and backend both gate the module.',
    },
    {
      label: 'Env verification',
      value: `${snapshot.verifiedEnvChecks} checks`,
      detail: 'Presence only, never secret values.',
    },
    {
      label: 'Runtime posture',
      value: `${snapshot.unreachableAgents} unreachable`,
      detail: 'Agents and health status are reviewed together.',
    },
    {
      label: 'Audit coverage',
      value: `${snapshot.auditEvents24h} events`,
      detail: 'Every admin action must be logged.',
    },
  ]
}

export function getSectionIcon(name: AdminSection['icon']) {
  switch (name) {
    case 'users':
      return Users
    case 'bot':
      return Bot
    case 'key':
      return Key
    case 'wrench':
      return Wrench
    case 'alert':
      return AlertCircle
    case 'clipboard':
      return ClipboardList
    default:
      return Shield
  }
}
