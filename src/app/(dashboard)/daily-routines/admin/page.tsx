import { requireAuthUser } from '@/lib/data/auth'
import { isAdmin } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettingsForm } from '@/components/daily-routines/admin/AdminSettingsForm'
import { ExclusionsManager } from '@/components/daily-routines/admin/ExclusionsManager'
import { TestDigestButton } from '@/components/daily-routines/admin/TestDigestButton'
import type { Tables } from '@/types'

export default async function AdminDailyRoutinesPage() {
  const authUser = await requireAuthUser()

  if (!isAdmin(authUser.role)) {
    redirect('/daily-routines')
  }

  const supabase = await createClient()

  const { data: config } = await supabase
    .from('daily_routines_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, status')
    .eq('status', 'active')
    .order('full_name', { ascending: true })

  const { data: exclusions } = await supabase
    .from('daily_routines_exclusions')
    .select('*')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8">
      <div>
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          Daily Routines Admin
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Configure timing, channels, reminders, and user participation.
        </p>
      </div>

      <AdminSettingsForm initialConfig={config ?? null} />
      <ExclusionsManager
        profiles={(allProfiles ?? []) as Pick<Tables<'profiles'>, 'id' | 'full_name' | 'status'>[]}
        initialExclusions={(exclusions ?? []) as Tables<'daily_routines_exclusions'>[]}
      />
      <TestDigestButton />
    </div>
  )
}
