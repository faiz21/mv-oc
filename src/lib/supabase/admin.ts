import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SERVICE_ROLE_KEY.')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
