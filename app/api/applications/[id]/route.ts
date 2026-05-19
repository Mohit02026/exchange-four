import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getApplicationById } from '@/lib/services/reviews'
import { writeAuditLog } from '@/lib/utils/audit'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const application = await getApplicationById(id)
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(application)
}

const patchSchema = z.object({
  status: z.enum([
    'SUBMITTED', 'UNDER_REVIEW', 'CSW_GENERATED', 'SENT_TO_AVI',
    'EXECUTIVE_APPROVED', 'EXECUTIVE_DISAPPROVED', 'INTERVIEW_SCHEDULED',
    'START_DATE_REQUESTED', 'HIRED', 'REJECTED', 'FUTURE_PROSPECT',
  ]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const application = await db.application.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  await writeAuditLog({
    action: `STATUS_CHANGED_${parsed.data.status}`,
    entityType: 'Application',
    entityId: id,
    userId: session.user.id,
    metadata: { status: parsed.data.status },
  })

  return NextResponse.json({ id: application.id, status: application.status })
}
