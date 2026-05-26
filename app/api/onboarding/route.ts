import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createEmployee, getEmployeeByApplication } from '@/lib/services/onboarding'
import { sendOfferLetter } from '@/lib/integrations/email'
import { notifyEmployeeHired } from '@/lib/integrations/slack'

const bodySchema = z.object({
  applicationId: z.string().min(1),
  startDate: z.string().optional(), // ISO date string, optional
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { applicationId, startDate } = parsed.data

  // Check not already hired
  const existing = await getEmployeeByApplication(applicationId)
  if (existing) return NextResponse.json({ error: 'Employee record already exists', employeeId: existing.id }, { status: 409 })

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { applicant: true, position: { select: { title: true } } },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const allowedStatuses = ['INTERVIEW_SCHEDULED', 'START_DATE_REQUESTED', 'EXECUTIVE_APPROVED']
  if (!allowedStatuses.includes(application.status)) {
    return NextResponse.json({ error: 'Application is not in a hireable status' }, { status: 422 })
  }

  const employee = await createEmployee({
    applicationId,
    userId: application.applicant.userId,
    firstName: application.applicant.firstName,
    lastName: application.applicant.lastName,
    positionId: application.positionId ?? null,
    startDate: startDate ? new Date(startDate) : null,
    hrUserId: session.user.id,
  })

  const startDateFormatted = startDate
    ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  await sendOfferLetter({
    to: application.applicant.correspondenceEmail,
    name: `${application.applicant.firstName} ${application.applicant.lastName}`,
    reference: application.reference,
    positionTitle: application.position?.title ?? null,
    startDate: startDateFormatted,
    employeeId: employee.id,
  }).catch((err) => console.error('[Offer letter email error]', err))

  notifyEmployeeHired({
    name: `${application.applicant.firstName} ${application.applicant.lastName}`,
    reference: application.reference,
    positionTitle: application.position?.title ?? null,
    employeeId: employee.id,
  }).catch(() => null)

  return NextResponse.json({ employeeId: employee.id }, { status: 201 })
}
