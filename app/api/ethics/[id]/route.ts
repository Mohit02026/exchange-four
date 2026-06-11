import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getReportById, updateReport } from '@/lib/services/ethics'

const patchSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'CLOSED', 'FILED']).optional(),
  triageNotes: z.string().optional(),
  assignedHandlerId: z.string().optional(),
  outcome: z.string().optional(),
  fileDestination: z.string().optional(),
})

async function getAccess(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { ethicsAccess: true } })
  return user?.ethicsAccess ?? false
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const hasAccess = await getAccess(session.user.id)
  const report = await getReportById(id, hasAccess)

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const hasAccess = await getAccess(session.user.id)
  const report = await updateReport(id, hasAccess, parsed.data)

  if (!report) return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
  return NextResponse.json(report)
}
