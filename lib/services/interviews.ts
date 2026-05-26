import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'

// Create an InterviewEvent record when Nicola approves and invite is sent.
export async function createInterviewInvite(applicationId: string) {
  return db.interviewEvent.upsert({
    where: { applicationId },
    update: { inviteSentAt: new Date() },
    create: { applicationId, inviteSentAt: new Date() },
  })
}

// Called by the Calendly webhook when the applicant books a slot.
export async function recordInterviewScheduled(params: {
  applicationId: string
  calendlyEventId: string
  scheduledAt: Date
  userId?: string
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
    metadata: { calendlyEventId: params.calendlyEventId },
  })
}

// Fetch interview event for an application.
export async function getInterviewEvent(applicationId: string) {
  return db.interviewEvent.findUnique({
    where: { applicationId },
    include: { survey: true },
  })
}

// Look up an application by its Calendly event ID (used in webhook handler).
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
