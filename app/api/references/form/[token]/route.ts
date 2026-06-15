export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const submitSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().min(10),
  wouldRehire: z.boolean(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const ref = await db.referenceCheck.findUnique({
    where: { token },
    select: {
      id: true,
      refereeName: true,
      refereeEmail: true,
      refereeCompany: true,
      relationship: true,
      applicationId: true,
      status: true,
      tokenExpiry: true,
    },
  })

  if (!ref || !ref.tokenExpiry || ref.tokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }

  return NextResponse.json({
    refereeName: ref.refereeName,
    refereeEmail: ref.refereeEmail,
    refereeCompany: ref.refereeCompany,
    relationship: ref.relationship,
    applicationId: ref.applicationId,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const ref = await db.referenceCheck.findUnique({
    where: { token },
    select: { id: true, status: true, tokenExpiry: true },
  })

  if (!ref || !ref.tokenExpiry || ref.tokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }

  if (ref.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
  }

  const parsed = submitSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await db.referenceCheck.update({
    where: { id: ref.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      rating: parsed.data.rating,
      notes: parsed.data.notes,
      wouldRehire: parsed.data.wouldRehire,
    },
  })

  return NextResponse.json({ success: true, id: updated.id })
}
