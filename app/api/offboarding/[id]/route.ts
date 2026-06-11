import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getCaseById, updateCase } from '@/lib/services/offboarding'
import { OffboardingStatus } from '@/lib/generated/prisma/client'

const patchSchema = z.object({
  finalDay: z.string().nullable().optional(),
  exitSummary: z.string().optional(),
  status: z.nativeEnum(OffboardingStatus).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const c = await getCaseById(id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ case: JSON.parse(JSON.stringify(c)) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { finalDay, ...rest } = parsed.data
  const updated = await updateCase(id, {
    ...rest,
    finalDay: finalDay === null ? null : finalDay ? new Date(finalDay) : undefined,
  })

  return NextResponse.json({ case: JSON.parse(JSON.stringify(updated)) })
}
