'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
interface PointConfig {
  id: string
  action_type: string
  base_points: number
  bonus_points: number
  enabled: boolean
}

const ACTION_LABELS: Record<string, string> = {
  task_completed: 'Task Completed (base)',
  approval_reviewed_fast: 'Fast Approval Review (< 1hr)',
  approval_reviewed_slow: 'Approval Review (>= 1hr)',
  approval_rejected: 'Rejection Reviewed',
  standup_submitted_ontime: 'On-time Standup',
  standup_submitted_late: 'Late Standup',
  daily_login: 'Daily Login',
  incident_high_severity: 'High-Severity Incident Resolved',
  workflow_created: 'Workflow Created & Activated',
}

interface PointConfigPanelProps {
  configs: PointConfig[]
}

export function PointConfigPanel({ configs: initialConfigs }: PointConfigPanelProps) {
  const [configs, setConfigs] = useState<PointConfig[]>(initialConfigs)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function handleSave(config: PointConfig) {
    setSaving(config.action_type)
    const res = await fetch('/api/admin/gaming/point-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: config.action_type, base_points: config.base_points, bonus_points: config.bonus_points, enabled: config.enabled }),
    })
    if (res.ok) {
      setSaved(config.action_type)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  function update(actionType: string, field: keyof PointConfig, value: unknown) {
    setConfigs(prev => prev.map(c => c.action_type === actionType ? { ...c, [field]: value } : c))
  }

  return (
    <div>
      <div
        className="mb-5 rounded-xl px-4 py-3 text-[13px]"
        style={{ background: 'rgba(255,193,116,0.06)', color: 'var(--on-surface-variant)' }}
      >
        Changing point values affects future events only. Past points are immutable.
      </div>
      <div className="space-y-3">
        {configs.map(config => (
          <div
            key={config.action_type}
            className="flex items-center gap-4 rounded-2xl px-4 py-3"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: 'var(--on-surface)' }}>
                {ACTION_LABELS[config.action_type] || config.action_type}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>Base</label>
              <input
                type="number"
                min={0}
                max={100}
                value={config.base_points}
                onChange={e => update(config.action_type, 'base_points', parseInt(e.target.value) || 0)}
                className="w-16 rounded-lg px-2 py-1.5 text-center text-[13px] outline-none"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              />
              {config.bonus_points > 0 && (
                <>
                  <label className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>Bonus</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={config.bonus_points}
                    onChange={e => update(config.action_type, 'bonus_points', parseInt(e.target.value) || 0)}
                    className="w-16 rounded-lg px-2 py-1.5 text-center text-[13px] outline-none"
                    style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                  />
                </>
              )}
              <button
                onClick={() => handleSave(config)}
                disabled={saving === config.action_type}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] transition-colors disabled:opacity-50"
                style={{
                  background: saved === config.action_type ? 'rgba(74,222,128,0.1)' : 'var(--surface-container)',
                  color: saved === config.action_type ? '#4ade80' : 'var(--on-surface)',
                }}
              >
                <Save size={12} />
                {saved === config.action_type ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
