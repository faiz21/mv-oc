import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { GratitudeArchive } from '@/components/daily-routines/GratitudeArchive'
import type { Tables } from '@/types'

export default async function ArchivePage() {
  await requireAuthUser()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'gratitude')
    .order('date', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface)' }}
        >
          Gratitude Archive
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--on-surface-variant)' }}>
          Your personal reflection log. Only you can see private entries.
        </p>
      </div>
      <GratitudeArchive initialEntries={(entries ?? []) as Tables<'daily_entries'>[]} />
    </div>
  )
}
