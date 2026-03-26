import type { SupabaseClient } from '@supabase/supabase-js'

export type EntryType = 'standup' | 'check_in' | 'gratitude'

export interface StandupContent {
  yesterday: string
  today: string
  blockers: string
}

export interface CheckInContent {
  mood: 'great' | 'good' | 'okay' | 'struggling'
  note?: string
}

export interface GratitudeContent {
  text: string
  recipient?: string
}

export interface DailyEntry {
  id: string
  user_id: string
  date: string
  type: EntryType
  content: StandupContent | CheckInContent | GratitudeContent
  is_public: boolean
  created_at: string
}

export async function getTodayEntries(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('daily_entries')
    .select('id, type, content, is_public, created_at')
    .eq('user_id', userId)
    .eq('date', today)
  return data ?? []
}

export async function getTeamEntriesToday(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('daily_entries')
    .select('id, user_id, type, content, is_public, created_at')
    .eq('date', today)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function submitEntry(
  supabase: SupabaseClient,
  userId: string,
  type: EntryType,
  content: StandupContent | CheckInContent | GratitudeContent,
  isPublic = false,
) {
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('daily_entries')
    .insert({ user_id: userId, date: today, type, content, is_public: isPublic })
  return error
}
