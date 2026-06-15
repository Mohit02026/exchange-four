import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recordInterviewScheduled } from '@/lib/services/interviews'
import { sendInterviewConfirmation } from '@/lib/integrations/email'
import { notifyInterviewScheduled } from '@/lib/integrations/slack'

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify this came from our GHL location
  const expectedLocationId = process.env.GHL_LOCATION_ID
  if (expectedLocationId && payload.locationId !== expectedLocationId) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 401 })
  }

  // Only handle AppointmentCreate — ignore updates/deletes
  if (payload.type !== 'AppointmentCreate') {
    return NextResponse.json({ received: true })
  }

  const contact = payload.contact as Record<string, unknown> | undefined
  const inviteeEmail = (contact?.email as string | undefined) ?? ''
  const inviteeName = (contact?.name as string | undefined) ?? inviteeEmail
  const startTime = payload.startTime as string | undefined
  const appointmentId = payload.id as string | undefined

  if (!inviteeEmail || !startTime || !appointmentId) {
    return NextResponse.json({ error: 'Missing appointment data' }, { status: 400 })
  }

  const scheduledAt = new Date(startTime)

  // Match applicant by correspondence email
  const applicant = await db.applicant.findFirst({
    where: { correspondenceEmail: inviteeEmail },
    include: {
      applications: {
        where: { status: 'START_DATE_REQUESTED' },
        include: { position: { select: { title: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  })

  const application = applicant?.applications[0]
  if (!application) {
    return NextResponse.json({ received: true })
  }

  await recordInterviewScheduled({
    applicationId: application.id,
    calendlyEventId: appointmentId,
    scheduledAt,
  })

  const applicantName = applicant
    ? `${applicant.firstName} ${applicant.lastName}`
    : inviteeName

  await Promise.all([
    sendInterviewConfirmation({
      to: inviteeEmail,
      name: applicantName,
      reference: application.reference,
      scheduledAt,
    }).catch(() => null),
    sendInterviewConfirmation({
      to: 'nicola@exchangefour.com',
      name: applicantName,
      reference: application.reference,
      scheduledAt,
      toNicola: true,
    }).catch(() => null),
  ])

  notifyInterviewScheduled({
    applicantName,
    reference: application.reference,
    scheduledAt,
  }).catch(() => null)

  return NextResponse.json({ received: true })
}
