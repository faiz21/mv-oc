export interface NavPage {
  label: string
  href: string
}

export interface NavModule {
  label: string
  href: string
  pages: NavPage[]
  adminOnly?: boolean
  badge?: 'pendingApprovals'
}

export const NAV_MODULES: NavModule[] = [
  {
    label: 'Hub',
    href: '/hub',
    pages: [
      { label: 'Overview', href: '/hub' },
      { label: 'My Queue', href: '/hub#my-queue' },
      { label: 'Activity', href: '/hub#activity' },
    ],
  },
  {
    label: 'Wiki',
    href: '/wiki',
    pages: [
      { label: 'Knowledge Base', href: '/wiki' },
      { label: 'Search', href: '/wiki/search' },
      { label: 'Create Article', href: '/wiki/new' },
      { label: 'Review Queue', href: '/wiki/review-queue' },
      { label: 'Settings', href: '/wiki/settings' },
    ],
  },
  {
    label: 'Admin & Master Data',
    href: '/admin',
    adminOnly: true,
    pages: [
      { label: 'Overview', href: '/admin' },
      { label: 'Departments', href: '/admin/departments' },
      { label: 'Projects', href: '/admin/projects' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Agents', href: '/admin/agents' },
      { label: 'Environment', href: '/admin/environment' },
      { label: 'Diagnostics', href: '/admin/diagnostics' },
      { label: 'Queue', href: '/admin/queue' },
      { label: 'Audit Log', href: '/admin/audit-log' },
    ],
  },
  {
    label: 'Workflow Builder',
    href: '/workflow-builder',
    pages: [
      { label: 'Library', href: '/workflow-builder' },
      { label: 'New Draft', href: '/workflow-builder/new' },
    ],
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    pages: [
      { label: 'Runs', href: '/dashboard' },
      { label: 'Event Stream', href: '/dashboard#event-stream' },
      { label: 'System Health', href: '/dashboard#system-health' },
    ],
  },
  {
    label: 'Daily Routines',
    href: '/daily-routines',
    pages: [
      { label: 'Today', href: '/daily-routines' },
      { label: 'Standup', href: '/daily-routines#standup' },
      { label: 'Check-in', href: '/daily-routines#check-in' },
      { label: 'Gratitude', href: '/daily-routines#gratitude' },
    ],
  },
  {
    label: 'Operations Monitor',
    href: '/operations',
    pages: [
      { label: 'Live Runs', href: '/operations' },
      { label: 'SLA Monitor', href: '/operations/sla' },
      { label: 'Projects', href: '/operations/projects' },
    ],
  },
  {
    label: 'Gaming Session',
    href: '/gaming-session',
    pages: [
      { label: 'Leaderboard', href: '/gaming-session' },
      { label: 'Sandbox', href: '/gaming-session/sandbox' },
      { label: 'Team Activity', href: '/gaming-session/team-activity' },
    ],
  },
  {
    label: 'Feedback Hub',
    href: '/feedback-hub',
    pages: [
      { label: 'Submit Feedback', href: '/feedback-hub' },
      { label: 'Changelog', href: '/feedback-hub#changelog' },
    ],
  },
  {
    label: 'Agent Builder',
    href: '/agent-builder',
    pages: [
      { label: 'Agents', href: '/agent-builder' },
      { label: 'Skills', href: '/agent-builder/skills' },
      { label: 'Test Runs', href: '/agent-builder/test-runs' },
    ],
  },
  {
    label: 'Mission Control',
    href: '/mission-control',
    badge: 'pendingApprovals',
    pages: [
      { label: 'Action Queue', href: '/mission-control' },
      { label: 'Approvals', href: '/mission-control#approvals' },
    ],
  },
]
