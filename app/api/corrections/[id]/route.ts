import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getCorrectionById, updateCorrection } from '@/lib/services/corrections'
import { CorrectionStatus, CorrectionAction } from '@/lib/generated/prisma/client'

const patchSchema = z.object({
  status: z.nativeEnum(CorrectionStatus).optional(),
  hrNotes: z.string().optional(),
  employeeResponse: z.string().optional(),
  resolution: z.string().optional(),
  followUpDate: z.string().nullable().optional(),
  action: z.nativeEnum(CorrectionAction).optional(),
  trainingAssigned: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const correction = await getCorrectionById(id)
  if (!correction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ correction: JSON.parse(JSON.stringify(correction)) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { followUpDate, ...rest } = parsed.data
  let correction
  try {
    correction = await updateCorrection(id, {
      ...rest,
      followUpDate: followUpDate === null ? null : followUpDate ? new Date(followUpDate) : undefined,
    })
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    throw e
  }

  return NextResponse.json({ correction: JSON.parse(JSON.stringify(correction)) })
}
