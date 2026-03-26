// Server-only — never import from client components

type EnvCategory = 'supabase' | 'openclaw' | 'external' | 'app'

interface EnvCheck {
  key: string
  present: boolean
  category: EnvCategory
}

const REQUIRED_ENV_KEYS: Array<{ key: string; category: EnvCategory }> = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', category: 'supabase' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', category: 'supabase' },
  { key: 'SERVICE_ROLE_KEY', category: 'supabase' },
  { key: 'SUPABASE_URL', category: 'supabase' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', category: 'supabase' },
  { key: 'SUPABASE_DB_URL', category: 'supabase' },
  { key: 'OPENCLAW_API_URL', category: 'openclaw' },
  { key: 'OPENCLAW_API_KEY', category: 'openclaw' },
  { key: 'OPENAI_API_KEY', category: 'external' },
  { key: 'DISCORD_WEBHOOK_URL', category: 'external' },
  { key: 'NEXTAUTH_SECRET', category: 'app' },
  { key: 'NEXT_PUBLIC_APP_URL', category: 'app' },
]

export function getRequiredEnvKeys(): string[] {
  return REQUIRED_ENV_KEYS.map((e) => e.key)
}

export function checkAllSecrets(): EnvCheck[] {
  return REQUIRED_ENV_KEYS.map(({ key, category }) => ({
    key,
    present: !!process.env[key],
    category,
  }))
}
