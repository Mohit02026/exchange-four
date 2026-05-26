import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getApprovalByToken, recordTokenOpen, submitAviDecision } from '@/lib/services/approvals'
import { sendNicolaAviDecision } from '@/lib/integrations/email'
import { notifyAviDecision } from '@/lib/integrations/slack'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const request = await getApprovalByToken(token)
  if (!request) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (request.tokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This approval link has expired' }, { status: 410 })
  }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? null
  await recordTokenOpen(token, ip)

  const app = request.application
  return NextResponse.json({
    alreadyDecided: !!request.decision,
    decision: request.decision ?? null,
    applicant: {
      firstName: app.applicant.firstName,
      lastName: app.applicant.lastName,
      email: app.applicant.correspondenceEmail,
      phone: app.applicant.phone,
      location: app.applicant.location,
      bio: app.bio,
      skills: app.skills,
      hobbies: app.hobbies,
      careerGoals: app.careerGoals,
      whyExchangeFour: app.whyExchangeFour,
    },
    application: {
      id: app.id,
      reference: app.reference,
      status: app.status,
      positionTitle: app.position?.title ?? null,
      isGeneralApplication: app.isGeneralApplication,
      submittedAt: app.submittedAt,
    },
    review: app.review
      ? {
          status: app.review.status,
          notesForAvi: app.review.notesForAvi,
          sections: app.review.sections,
        }
      : null,
    csw: app.csw ? { id: app.csw.id, content: app.csw.content, status: app.csw.status } : null,
    files: app.files.map((f) => ({ id: f.id, type: f.type, url: f.fileUrl, name: f.fileName })),
  })
}

const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'DISAPPROVED']),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = decisionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { decision, reason = null, notes = null } = parsed.data

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? null

  let result: Awaited<ReturnType<typeof submitAviDecision>>
  try {
    result = await submitAviDecision({ token, decision, reason: reason ?? null, notes: notes ?? null, ip })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg.includes('already') || msg.includes('expired') || msg.includes('Invalid') ? 409 : 422
    return NextResponse.json({ error: msg }, { status })
  }

  const emailId = await sendNicolaAviDecision({
    ...result,
    decision,
    reason: reason ?? null,
    notes: notes ?? null,
  }).catch(() => null)

  await db.emailEvent.create({
    data: {
      applicationId: result.applicationId,
      type: decision === 'APPROVED' ? 'AVI_APPROVED' : 'AVI_DISAPPROVED',
      to: 'nicola@exchangefour.com',
      subject: decision === 'APPROVED'
        ? `Avi Approved — ${result.applicantName} — ${result.reference}`
        : `Avi Disapproved — ${result.applicantName} — ${result.reference}`,
      resendId: emailId,
    },
  })

  notifyAviDecision({
    applicantName: result.applicantName,
    reference: result.reference,
    decision,
    reason: reason ?? null,
  }).catch(() => null)

  return NextResponse.json({ success: true })
}
