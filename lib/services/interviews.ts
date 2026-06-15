import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'
import crypto from 'crypto'

function generateInterviewToken(): string {
  return `EX4-INTERVIEW-${crypto.randomBytes(24).toString('hex')}`
}

// Create an InterviewEvent record and generate a booking token when invite is sent.
export async function createInterviewInvite(applicationId: string): Promise<string> {
  const token = generateInterviewToken()
  await db.interviewEvent.upsert({
    where: { applicationId },
    update: { inviteSentAt: new Date(), interviewToken: token },
    create: { applicationId, inviteSentAt: new Date(), interviewToken: token },
  })
  return token
}

// Look up an interview event by its booking token (used on the booking page).
export async function getByInterviewToken(token: string) {
  return db.interviewEvent.findUnique({
    where: { interviewToken: token },
    include: {
      application: {
        include: {
          applicant: { select: { firstName: true, lastName: true } },
          position: { select: { title: true } },
        },
      },
    },
  })
}

// Called by the GHL webhook (or manual mark) when the applicant books a slot.
export async function recordInterviewScheduled(params: {
  applicationId: string
  calendlyEventId: string
  scheduledAt: Date
}) {
  await db.$transaction([
    db.interviewEvent.update({
      where: { applicationId: params.applicationId },
      data: {
        calendlyEventId: params.calendlyEventId,
        scheduledAt: params.scheduledAt,
      },
    }),
    db.application.update({
      where: { id: params.applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    }),
  ])

  await writeAuditLog({
    action: 'INTERVIEW_SCHEDULED',
    entityType: 'Application',
    entityId: params.applicationId,
    metadata: { eventId: params.calendlyEventId },
  })
}

// Fetch interview event for an application.
export async function getInterviewEvent(applicationId: string) {
  return db.interviewEvent.findUnique({
    where: { applicationId },
    include: { survey: true },
  })
}

// Look up an application by its GHL appointment ID (used in webhook handler).
export async function getApplicationByCalendlyEvent(calendlyEventId: string) {
  const event = await db.interviewEvent.findFirst({
    where: { calendlyEventId },
    include: {
      application: {
        include: { applicant: true, position: { select: { title: true } } },
      },
    },
  })
  return event?.application ?? null
}
