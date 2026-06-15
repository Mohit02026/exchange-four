export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { BGCheckStatus, BGCheckResult } from '@/lib/generated/prisma/client'
import { getBGCheck, upsertBGCheck } from '@/lib/services/references'

const patchSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  provider: z.string().optional(),
  referenceNumber: z.string().optional(),
  result: z.enum(['CLEAR', 'CONSIDER', 'FAILED']).nullable().optional(),
  notes: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const application = await db.application.findUnique({ where: { id }, select: { id: true } })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const bgCheck = await getBGCheck(id)
  return NextResponse.json(bgCheck)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const application = await db.application.findUnique({ where: { id }, select: { id: true } })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { status, result, ...rest } = parsed.data

  const bgCheck = await upsertBGCheck(id, {
    ...rest,
    ...(status ? { status: status as BGCheckStatus } : {}),
    ...(result !== undefined ? { result: (result as BGCheckResult | null) } : {}),
  })
  return NextResponse.json(bgCheck)
}
