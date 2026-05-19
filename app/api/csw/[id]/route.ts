import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getCSWById, updateCSWContent } from '@/lib/services/csw'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const csw = await getCSWById(id)
  if (!csw) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(csw)
}

const patchSchema = z.object({ content: z.string().min(1) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const csw = await updateCSWContent(id, parsed.data.content)
  return NextResponse.json({ id: csw.id })
}
