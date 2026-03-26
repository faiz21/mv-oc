'use client'

import { useState } from 'react'

type TabKey = 'operations' | 'agents' | 'compliance' | 'workflows'

interface DashboardTabsProps {
  operationsTab: React.ReactNode
  agentsTab: React.ReactNode
  complianceTab: React.ReactNode
  workflowsTab: React.ReactNode
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'operations', label: 'Operations' },
  { key: 'agents', label: 'Agents' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'workflows', label: 'Workflows' },
]

export function DashboardTabs({
  operationsTab,
  agentsTab,
  complianceTab,
  workflowsTab,
}: DashboardTabsProps) {
  const [active, setActive] = useState<TabKey>('operations')

  const panels: Record<TabKey, React.ReactNode> = {
    operations: operationsTab,
    agents: agentsTab,
    compliance: complianceTab,
    workflows: workflowsTab,
  }

  return (
    <div>
      <div
        className="flex gap-1 rounded-full p-1"
        style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}
        role="tablist"
        aria-label="Dashboard sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            onClick={() => setActive(tab.key)}
            className="rounded-full px-5 py-2 text-sm font-semibold transition-colors"
            style={
              active === tab.key
                ? { background: 'rgba(255,193,116,0.16)', color: 'var(--primary)' }
                : { color: 'var(--on-surface-variant)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="mt-6"
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {panels[active]}
      </div>
    </div>
  )
}
