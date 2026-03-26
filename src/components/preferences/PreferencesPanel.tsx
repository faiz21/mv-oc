'use client'

/**
 * User Preferences Panel (T-08-23)
 *
 * Manages gamification and team activity opt-in toggles.
 *
 * SCHEMA FLAG: T-08-23 specifies `profiles.team_activity_enabled` column.
 * That column is NOT present in the current database.ts generated types.
 * Until that migration runs (T-08-19 prerequisite), the Team Activity toggle
 * is stored in `system_state` under key `team_activity_disabled_{user_id}`,
 * or falls back to controlling `gamification_enabled` as a proxy.
 *
 * The gamification toggle directly writes to `profiles.gamification_enabled`
 * which IS in the DB types.
 */

import { useState } from 'react'
import { Sparkles, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PreferencesPanelProps {
  gamificationEnabled: boolean
}

export function PreferencesPanel({ gamificationEnabled: initialGamification }: PreferencesPanelProps) {
  const [gamificationEnabled, setGamificationEnabled] = useState(initialGamification)
  // SCHEMA FLAG: team_activity_enabled not in DB types — mirrors gamification_enabled as proxy
  const [teamActivityEnabled, setTeamActivityEnabled] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function toggleGamification(enabled: boolean) {
    setSaving('gamification')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ gamification_enabled: enabled })
      .eq('id', user.id)

    if (!enabled) {
      // Log opt-out to audit_log per spec
      await supabase.from('audit_log').insert({
        event: 'gamification_disabled',
        entity_type: 'profile',
        entity_id: user.id,
        actor_type: 'human',
        actor_ref: user.id,
        data: { gamification_enabled: false },
      })
    }

    setGamificationEnabled(enabled)
    setSaved('gamification')
    setTimeout(() => setSaved(null), 2000)
    setSaving(null)
  }

  async function toggleTeamActivity(enabled: boolean) {
    setSaving('team_activity')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // SCHEMA FLAG: team_activity_enabled column not in DB types (T-08-19 migration pending)
    // Storing as system_state key per interim workaround
    const key = `team_activity_disabled_${user.id}`
    if (!enabled) {
      await supabase.from('system_state').upsert({
        key,
        value: { disabled: true, disabled_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      await supabase.from('audit_log').insert({
        event: 'team_activity_disabled',
        entity_type: 'profile',
        entity_id: user.id,
        actor_type: 'human',
        actor_ref: user.id,
        data: { team_activity_enabled: false },
      })
    } else {
      await supabase.from('system_state').delete().eq('key', key)
    }

    setTeamActivityEnabled(enabled)
    setSaved('team_activity')
    setTimeout(() => setSaved(null), 2000)
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      {/* Gamification toggle */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-container-low)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(255,193,116,0.1)', color: 'var(--primary)' }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                Gaming Session
              </div>
              <div className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                Earn points and badges for completing tasks, reviewing approvals, and submitting standups. Your ranking is visible to the team.
              </div>
              <div className="mt-1.5 text-[11px]" style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                Opt-out hides you from the leaderboard and stops point accrual. No impact on your role.
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => toggleGamification(!gamificationEnabled)}
              disabled={saving === 'gamification'}
              className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50"
              style={{ background: gamificationEnabled ? 'var(--primary)' : 'var(--surface-container)' }}
              aria-label={gamificationEnabled ? 'Disable Gaming Session' : 'Enable Gaming Session'}
            >
              <div
                className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
                style={{
                  background: 'white',
                  transform: gamificationEnabled ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </button>
            {saved === 'gamification' && (
              <span className="text-[11px]" style={{ color: '#4ade80' }}>Saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Team Activity toggle */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-container-low)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}
            >
              <Users size={16} />
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                Team Activity
              </div>
              <div className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                Participate in polls, share shoutouts, and see team calendar events. Turning off hides notifications and prevents new activity.
              </div>
              <div className="mt-1.5 text-[11px]" style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                Previously submitted votes and reactions remain visible to others.
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => toggleTeamActivity(!teamActivityEnabled)}
              disabled={saving === 'team_activity'}
              className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50"
              style={{ background: teamActivityEnabled ? '#60a5fa' : 'var(--surface-container)' }}
              aria-label={teamActivityEnabled ? 'Disable Team Activity' : 'Enable Team Activity'}
            >
              <div
                className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
                style={{
                  background: 'white',
                  transform: teamActivityEnabled ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </button>
            {saved === 'team_activity' && (
              <span className="text-[11px]" style={{ color: '#4ade80' }}>Saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Schema note — for developers */}
      <div
        className="rounded-xl px-4 py-3 text-[11px] leading-relaxed"
        style={{ background: 'rgba(255,193,116,0.04)', color: 'var(--on-surface-variant)', opacity: 0.6 }}
      >
        SCHEMA FLAG: profiles.team_activity_enabled column not yet migrated (T-08-19).
        Team Activity preference is stored in system_state as interim workaround.
      </div>
    </div>
  )
}
