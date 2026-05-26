import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { recordInterviewScheduled } from '@/lib/services/interviews'
import { sendInterviewConfirmation } from '@/lib/integrations/email'

// Verify Calendly webhook signature.
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const secret = process.env.CALENDLY_WEBHOOK_SECRET

  // Verify signature if secret is configured
  if (secret) {
    const signature = req.headers.get('calendly-webhook-signature') ?? ''
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: { event: string; payload: Record<string, unknown> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle invitee.created — that means someone booked a slot
  if (payload.event !== 'invitee.created') {
    return NextResponse.json({ received: true })
  }

  const eventPayload = payload.payload
  const calendlyEventUri = eventPayload.event as string
  const inviteeEmail = (eventPayload.email as string | undefined) ?? ''
  const startTime = eventPayload.scheduled_event
    ? ((eventPayload.scheduled_event as Record<string, unknown>).start_time as string | undefined)
    : undefined

  if (!calendlyEventUri || !startTime) {
    return NextResponse.json({ error: 'Missing event data' }, { status: 400 })
  }

  // Extract a short event ID from the full URI
  const calendlyEventId = calendlyEventUri.split('/').pop() ?? calendlyEventUri
  const scheduledAt = new Date(startTime)

  // Find the application by matching the invitee email to a correspondence email
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
    // Could not match — log and return 200 to prevent Calendly retries
    console.warn('[Calendly webhook] No matching application for', inviteeEmail)
    return NextResponse.json({ received: true })
  }

  await recordInterviewScheduled({
    applicationId: application.id,
    calendlyEventId,
    scheduledAt,
  })

  // Send confirmation to applicant and Nicola
  const applicantName = applicant ? `${applicant.firstName} ${applicant.lastName}` : inviteeEmail
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

  return NextResponse.json({ received: true })
}
