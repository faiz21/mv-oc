import { requireAuthUser } from '@/lib/data/auth'
import { createClient } from '@/lib/supabase/server'
import { TodayView } from '@/components/daily-routines/TodayView'

export default async function DailyRoutinesPage() {
  const authUser = await requireAuthUser()
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  // Fetch user's own submissions for today
  const { data: ownEntries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('date', today)

  const standupEntry = ownEntries?.find((e) => e.type === 'standup') ?? null
  const checkInEntry = ownEntries?.find((e) => e.type === 'check_in') ?? null
  const gratitudeEntry = ownEntries?.find((e) => e.type === 'gratitude') ?? null
  const submittedTypes = (ownEntries ?? []).map((e) => e.type)

  // Fetch team standups for today's feed (public entries)
  const { data: teamStandups } = await supabase
    .from('daily_entries')
    .select('*, profiles(full_name)')
    .eq('type', 'standup')
    .eq('date', today)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Fetch shared gratitude (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

  const { data: sharedGratitude } = await supabase
    .from('daily_entries')
    .select('*, profiles(full_name)')
    .eq('type', 'gratitude')
    .eq('is_public', true)
    .gte('date', sevenDaysAgoStr)
    .order('created_at', { ascending: false })

  // Fetch user exclusion
  const { data: exclusion } = await supabase
    .from('daily_routines_exclusions')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()

  return (
    <TodayView
      user={authUser}
      today={today}
      submittedTypes={submittedTypes}
      standupEntry={standupEntry}
      checkInEntry={checkInEntry}
      gratitudeEntry={gratitudeEntry}
      teamStandups={teamStandups ?? []}
      sharedGratitude={sharedGratitude ?? []}
      exclusion={exclusion ?? null}
    />
  )
}
