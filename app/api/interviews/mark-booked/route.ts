import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'

const schema = z.object({ applicationId: z.string().min(1) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { applicationId } = parsed.data

  await db.$transaction([
    db.interviewEvent.update({
      where: { applicationId },
      data: { scheduledAt: new Date() },
    }),
    db.application.update({
      where: { id: applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    }),
  ])

  await writeAuditLog({
    action: 'INTERVIEW_SCHEDULED',
    entityType: 'Application',
    entityId: applicationId,
    metadata: { markedManually: true, by: session.user.email },
  })

  return NextResponse.json({ success: true })
}
