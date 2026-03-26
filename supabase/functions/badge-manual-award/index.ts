import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    // Check admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    const { target_user_id, badge_slug } = await req.json()
    if (!target_user_id || !badge_slug) {
      return new Response(JSON.stringify({ error: 'target_user_id and badge_slug required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get badge
    const { data: badge } = await supabase.from('badges').select('*').eq('slug', badge_slug).single()
    if (!badge) {
      return new Response(JSON.stringify({ error: 'Badge not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    // Award badge
    const { data: award, error } = await supabase.from('user_badges').insert({
      user_id: target_user_id,
      badge_id: badge.id,
      awarded_by: user.id,
    }).select().single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Log to audit_log
    await supabase.from('audit_log').insert({
      event: 'badge_manually_awarded',
      actor_id: user.id,
      actor_type: 'human',
      target_id: target_user_id,
      data: { badge_slug, badge_name: badge.name },
    })

    return new Response(JSON.stringify({ success: true, award }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
