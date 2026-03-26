import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getBoardColumns } from '@/lib/data/departments'
import { requireAdminApi } from '@/lib/admin/require-admin-api'
import { writeAudit } from '@/lib/admin/write-audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> },
) {
  const result = await requireAdminApi()
  if (!result.ok) return result.response

  const { departmentId } = await params
  const supabase = await createClient()
  const columns = await getBoardColumns(supabase, departmentId)

  return NextResponse.json(columns)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> },
) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const { departmentId } = await params
  const body = await req.json()
  const { name, slug, sort_order, color, is_done_state } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('board_columns')
    .insert({
      department_id: departmentId,
      name,
      slug,
      sort_order: sort_order ?? 0,
      color: color ?? null,
      is_done_state: is_done_state ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await writeAudit(admin, {
    actorId: result.auth.user.id,
    entityType: 'board_column',
    entityId: data.id,
    event: 'department:column_created',
    data: { department_id: departmentId, name, slug },
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> },
) {
  const result = await requireAdminApi({ adminOnly: true })
  if (!result.ok) return result.response

  const { departmentId } = await params
  const body = await req.json()
  const { id, name, slug, sort_order, color, is_done_state } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('board_columns')
    .update({
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(sort_order !== undefined && { sort_order }),
      ...(color !== undefined && { color }),
      ...(is_done_state !== undefined && { is_done_state }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('department_id', departmentId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await writeAudit(admin, {
    actorId: result.auth.user.id,
    entityType: 'board_column',
    entityId: id,
    event: 'department:column_updated',
    data: { department_id: departmentId, name, slug },
  })

  return NextResponse.json(data)
}
