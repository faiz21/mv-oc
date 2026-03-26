import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, Insertable } from '@/types'

export async function getTodayEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Tables<'daily_entries'> | null> {
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .limit(1)
    .maybeSingle()

  return data ?? null
}

export async function getTodayEntriesByType(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Record<string, Tables<'daily_entries'>>> {
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)

  const result: Record<string, Tables<'daily_entries'>> = {}
  for (const entry of data ?? []) {
    result[entry.type] = entry
  }
  return result
}

export async function createDailyEntry(
  supabase: SupabaseClient<Database>,
  input: Insertable<'daily_entries'>,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('daily_entries')
    .insert(input)
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

export async function upsertDailyEntry(
  supabase: SupabaseClient<Database>,
  input: Insertable<'daily_entries'>,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,type' },
    )
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

export async function getDailyRoutinesConfig(
  supabase: SupabaseClient<Database>,
): Promise<Tables<'daily_routines_config'> | null> {
  const { data } = await supabase
    .from('daily_routines_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  return data ?? null
}

export async function getUserExclusion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Tables<'daily_routines_exclusions'> | null> {
  const { data } = await supabase
    .from('daily_routines_exclusions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data ?? null
}
