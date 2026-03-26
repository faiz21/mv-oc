'use client'

import { Inbox, Activity, ShieldAlert, Cpu } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center"
      style={{ background: 'rgba(17,19,23,0.5)' }}
    >
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--on-surface-variant)' }}
        >
          {icon}
        </div>
      )}
      <div
        className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        style={{ color: 'var(--on-surface)' }}
      >
        {title}
      </div>
      <p
        className="mt-2 max-w-[280px] text-[13px] leading-relaxed"
        style={{ color: 'var(--secondary)' }}
      >
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 min-h-[44px] rounded-2xl px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function EmptyQueue() {
  return (
    <EmptyState
      title="Nothing in your queue"
      description="You have no assigned tasks right now. Use the workflow library or ask your team to assign tasks."
      icon={<Inbox size={24} />}
    />
  )
}

export function EmptyActivity() {
  return (
    <EmptyState
      title="No recent activity"
      description="Activity events will appear here as your team and agents complete tasks and workflows."
      icon={<Activity size={24} />}
    />
  )
}

export function EmptyApprovals() {
  return (
    <EmptyState
      title="No pending approvals"
      description="All caught up! Approval requests will appear here when they need your review."
      icon={<ShieldAlert size={24} />}
    />
  )
}

export function EmptyAgents() {
  return (
    <EmptyState
      title="No agents registered"
      description="Register agents in the system settings to monitor their health here."
      icon={<Cpu size={24} />}
    />
  )
}
