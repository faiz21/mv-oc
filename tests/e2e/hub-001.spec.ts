import { expect, test } from '@playwright/test'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function createTempUser() {
  const email = `hub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const password = 'Test12345!'

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      data: {
        full_name: 'Hub Test User',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create temp user: ${response.status} ${await response.text()}`)
  }

  const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!signInResponse.ok) {
    throw new Error(`Failed to sign in temp user: ${signInResponse.status} ${await signInResponse.text()}`)
  }

  const session = await signInResponse.json()

  return { email, password, session }
}

test('HUB-001 - logged-in user sees the personalized Hub home screen', async ({ page }) => {
  const user = await createTempUser()
  const storageKey = 'sb-127-auth-token'

  await page.context().addCookies([
    {
      name: storageKey,
      value: JSON.stringify(user.session),
      url: 'http://127.0.0.1:3001',
    },
  ])

  await page.goto('/hub')
  await expect(page).toHaveURL(/\/hub/)
  await expect(page.getByText('Personalized operations surface')).toBeVisible()
  await expect(page.locator('#my-queue')).toBeVisible()
  await expect(page.locator('#activity')).toBeVisible()
  await expect(page.locator('#system-status')).toBeVisible()
})
