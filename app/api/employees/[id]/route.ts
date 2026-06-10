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

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, ethicsAccess: true } },
      onboardingPlan: { include: { tasks: true } },
      dailyCheckins: { orderBy: { submittedAt: 'desc' }, take: 10 },
      newHireSurveys: { orderBy: { weekNumber: 'asc' } },
      trainingPlan: { include: { tasks: true } },
      statistics: { include: { entries: { orderBy: { enteredAt: 'desc' }, take: 5 } } },
    },
  })

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Resolve the linked application for header data
  const application = employee.applicationId
    ? await db.application.findUnique({
        where: { id: employee.applicationId },
        include: {
          files: { where: { type: 'PHOTO' } },
          position: { select: { title: true } },
        },
      })
    : null

  const auditLogs = await db.auditLog.findMany({
    where: { entityType: 'Employee', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ employee, application, auditLogs })
}
