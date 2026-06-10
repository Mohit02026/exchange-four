import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const application = await db.application.findUnique({
    where: { id },
    include: {
      applicant: {
        include: { user: { select: { id: true, email: true, ethicsAccess: true } } },
      },
      position: true,
      files: true,
      videos: true,
      driveFolder: true,
      review: { include: { sections: true, notes: true } },
      csw: true,
      approvalRequest: { include: { decision: true } },
      interviewEvent: { include: { survey: true } },
      emailEvents: { orderBy: { sentAt: 'desc' } },
    },
  })

  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auditLogs = await db.auditLog.findMany({
    where: { entityType: 'Application', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ application, auditLogs })
}
