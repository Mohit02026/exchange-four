import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { upsertReview } from '@/lib/services/reviews'
import { writeAuditLog } from '@/lib/utils/audit'

const sectionSchema = z.object({
  section: z.string(),
  rating: z.enum(['Yes', 'No', 'Maybe']).nullable(),
  notes: z.string().nullable(),
})

const schema = z.object({
  applicationId: z.string(),
  sections: z.array(sectionSchema),
  notesForAvi: z.string().nullable(),
  privateNotes: z.string().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const review = await upsertReview({ ...parsed.data, reviewerId: session.user.id })

  // Advance application from SUBMITTED → UNDER_REVIEW when HR first touches a review.
  // updateMany is a no-op if the application is already beyond SUBMITTED.
  await db.application.updateMany({
    where: { id: parsed.data.applicationId, status: 'SUBMITTED' },
    data: { status: 'UNDER_REVIEW' },
  })

  await writeAuditLog({
    action: 'REVIEW_SAVED',
    entityType: 'Application',
    entityId: parsed.data.applicationId,
    userId: session.user.id,
  })

  return NextResponse.json({ id: review.id }, { status: 200 })
}
