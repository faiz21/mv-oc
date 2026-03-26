import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreferencesPanel } from '@/components/preferences/PreferencesPanel'

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gamification_enabled, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Preferences
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--on-surface-variant)' }}>
            Manage your personal preferences and notification settings.
          </p>
        </div>
        <PreferencesPanel
          gamificationEnabled={profile?.gamification_enabled ?? true}
        />
      </div>
    </div>
  )
}
