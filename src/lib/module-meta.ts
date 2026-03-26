export interface ModuleMeta {
  label: string
  href: string
  title: string
  searchPlaceholder: string
  statusBadge?: string
  secondaryText?: string
  adminOnly?: boolean
  sections?: Array<{
    label: string
    href: string
  }>
  sidebarNote?: string
  quickActions?: Array<{
    label: string
    href: string
  }>
}

export const moduleMeta: ModuleMeta[] = [
  {
    label: 'Hub',
    href: '/hub',
    title: 'Hub',
    searchPlaceholder: 'Search work, agents, and signals...',
    secondaryText: 'Workspace status',
    sidebarNote: 'Live status, queue visibility, and approvals for the active workspace.',
    sections: [
      { label: 'Overview', href: '/hub' },
      { label: 'My Queue', href: '/hub#my-queue' },
      { label: 'Activity', href: '/hub#activity' },
      { label: 'Quick Actions', href: '/hub#quick-actions' },
      { label: 'System Status', href: '/hub#system-status' },
    ],
    quickActions: [
      { label: 'Open Mission Control', href: '/mission-control' },
      { label: 'Open Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Wiki',
    href: '/wiki',
    title: 'Wiki',
    searchPlaceholder: 'Search standards, SOPs, and articles...',
    secondaryText: 'Knowledge base',
    sidebarNote: 'Canonical company knowledge lives here, with review, history, and retrieval-ready publication.',
    sections: [
      { label: 'Knowledge Base', href: '/wiki' },
      { label: 'Search', href: '/wiki/search' },
      { label: 'Create Article', href: '/wiki/new' },
      { label: 'Review Queue', href: '/wiki/review-queue' },
      { label: 'Settings', href: '/wiki/settings' },
    ],
    quickActions: [
      { label: 'New article', href: '/wiki/new' },
      { label: 'Review queue', href: '/wiki/review-queue' },
    ],
  },
  {
    label: 'Admin & Master Data',
    href: '/admin',
    title: 'Admin & Master Data',
    searchPlaceholder: 'Search settings...',
    adminOnly: true,
    sidebarNote: 'Governance, master data, and infrastructure controls for administrators.',
    sections: [
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
    quickActions: [
      { label: 'Admin home', href: '/admin' },
      { label: 'Review Mission Control', href: '/mission-control' },
    ],
  },
  {
    label: 'Workflow Builder',
    href: '/workflow-builder',
    title: 'Workflow Builder',
    searchPlaceholder: 'Search templates...',
    secondaryText: 'Current view',
    sidebarNote: 'Draft, edit, and activate workflow graphs from one focused workspace.',
    sections: [
      { label: 'Library', href: '/workflow-builder' },
      { label: 'Create Draft', href: '/workflow-builder/new' },
    ],
    quickActions: [
      { label: 'New workflow', href: '/workflow-builder/new' },
    ],
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    title: 'Dashboard',
    searchPlaceholder: 'Search workflow nodes...',
    statusBadge: 'Live',
    sidebarNote: 'Operational telemetry, health, and execution history for the current system.',
    sections: [
      { label: 'Runs', href: '/dashboard' },
      { label: 'Event Stream', href: '/dashboard#event-stream' },
      { label: 'System Health', href: '/dashboard#system-health' },
    ],
    quickActions: [
      { label: 'Open Hub', href: '/hub' },
    ],
  },
  {
    label: 'Daily Routines',
    href: '/daily-routines',
    title: 'Daily Routines',
    searchPlaceholder: 'Search rituals and team updates...',
    secondaryText: 'Team ceremonies',
    sidebarNote: 'Submit your standup, check-in, and gratitude. Power the daily digest.',
    sections: [
      { label: 'Today', href: '/daily-routines' },
      { label: 'Standup', href: '/daily-routines#standup' },
      { label: 'Check-in', href: '/daily-routines#check-in' },
      { label: 'Gratitude', href: '/daily-routines#gratitude' },
    ],
  },
  {
    label: 'Operations Monitor',
    href: '/operations',
    title: 'Operations Monitor',
    searchPlaceholder: 'Search runs, steps, and SLA risk...',
    secondaryText: 'Live execution',
    sidebarNote: 'Watch workflow execution in flight, inspect step logs, and intervene before SLA breach.',
    sections: [
      { label: 'Live Runs', href: '/operations' },
      { label: 'SLA Monitor', href: '/operations/sla' },
      { label: 'Projects', href: '/operations/projects' },
    ],
    quickActions: [
      { label: 'Open Mission Control', href: '/mission-control' },
      { label: 'Open Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Gaming Session',
    href: '/gaming-session',
    title: 'Gaming Session',
    searchPlaceholder: 'Search leaderboard, badges, and sandbox...',
    secondaryText: 'Engagement layer',
    sidebarNote: 'Earn points, run sandbox workflows, and celebrate wins with your team.',
    sections: [
      { label: 'Leaderboard', href: '/gaming-session' },
      { label: 'Sandbox', href: '/gaming-session/sandbox' },
      { label: 'Team Activity', href: '/gaming-session/team-activity' },
    ],
    quickActions: [
      { label: 'Run Sandbox', href: '/gaming-session/sandbox' },
      { label: 'Post Shoutout', href: '/gaming-session/team-activity' },
    ],
  },
  {
    label: 'Feedback Hub',
    href: '/feedback-hub',
    title: 'Feedback Hub',
    searchPlaceholder: 'Search feedback and changelog...',
    secondaryText: 'Team feedback',
    sidebarNote: 'Share ideas, flag problems, and see what leadership is doing about it.',
    sections: [
      { label: 'Submit Feedback', href: '/feedback-hub' },
      { label: 'Changelog', href: '/feedback-hub#changelog' },
    ],
  },
  {
    label: 'Agent Builder',
    href: '/agent-builder',
    title: 'Agent Builder',
    searchPlaceholder: 'Search agents, skills, and test runs...',
    secondaryText: 'Agent authoring',
    sidebarNote: 'Define, version, and test agent configurations and skill libraries.',
    sections: [
      { label: 'Agents', href: '/agent-builder' },
      { label: 'Skills', href: '/agent-builder/skills' },
      { label: 'Test Runs', href: '/agent-builder/test-runs' },
    ],
    quickActions: [
      { label: 'New agent', href: '/agent-builder' },
    ],
  },
  {
    label: 'Mission Control',
    href: '/mission-control',
    title: 'Mission Control',
    searchPlaceholder: 'Search tasks...',
    sidebarNote: 'Review approvals and pending actions that need human intervention.',
    sections: [
      { label: 'Action Queue', href: '/mission-control' },
      { label: 'Approvals', href: '/mission-control#approvals' },
    ],
    quickActions: [
      { label: 'Go to Hub', href: '/hub' },
    ],
  },
]

export function getModuleMeta(pathname: string) {
  return moduleMeta.find((item) => pathname.startsWith(item.href)) ?? moduleMeta[0]
}
