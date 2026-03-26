'use client'

import { useState } from 'react'
import { WorkflowRunner } from './WorkflowRunner'
import { ScenarioLibrary } from './ScenarioLibrary'
import { SandboxRunHistory } from './SandboxRunHistory'

type Tab = 'runner' | 'scenarios' | 'history'

interface SandboxHubProps {
  userId: string
  workflows: Array<{ id: string; name: string }>
}

export function SandboxHub({ userId, workflows }: SandboxHubProps) {
  const [tab, setTab] = useState<Tab>('runner')
  const [selectedScenario, setSelectedScenario] = useState<{ name: string; payload: string } | null>(null)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'runner', label: 'Workflow Runner' },
    { key: 'scenarios', label: 'Scenario Library' },
    { key: 'history', label: 'My Runs' },
  ]

  return (
    <div>
      {/* Isolation banner */}
      <div
        className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
      >
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          <strong style={{ color: 'var(--on-surface)' }}>Sandbox mode.</strong> All runs are fully isolated. No production data will be touched.
        </span>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface-container-low)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 rounded-xl px-4 py-2.5 text-center text-[13px] font-medium transition-colors"
            style={{
              background: tab === t.key ? 'var(--surface-container)' : 'transparent',
              color: tab === t.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'runner' && (
        <WorkflowRunner
          workflows={workflows}
          initialScenario={selectedScenario}
        />
      )}
      {tab === 'scenarios' && (
        <ScenarioLibrary
          onRunScenario={(scenario) => {
            setSelectedScenario(scenario)
            setTab('runner')
          }}
        />
      )}
      {tab === 'history' && <SandboxRunHistory userId={userId} />}
    </div>
  )
}
