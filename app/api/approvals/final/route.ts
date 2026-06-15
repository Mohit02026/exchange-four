import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { finalApprove, finalReject, keepWarm } from '@/lib/services/approvals'
import { sendApplicantApproved, sendApplicantRejected, sendInterviewInvite } from '@/lib/integrations/email'
import { notifyFinalDecision } from '@/lib/integrations/slack'
import { createInterviewInvite } from '@/lib/services/interviews'
import { db } from '@/lib/db'

const bodySchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(['approved', 'rejected', 'warm']),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { applicationId, decision } = parsed.data
  const userId = session.user.id

  try {
    if (decision === 'approved') {
      const result = await finalApprove(applicationId, userId)
      const interviewToken = await createInterviewInvite(applicationId)
      const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ''
      const bookingUrl = baseUrl ? `${baseUrl}/interview/${interviewToken}` : ''

      const [approvedEmailId, inviteEmailId] = await Promise.all([
        sendApplicantApproved({
          to: result.applicantEmail,
          name: result.applicantName,
          reference: result.reference,
          positionTitle: null,
        }).catch(() => null),
        bookingUrl
          ? sendInterviewInvite({
              to: result.applicantEmail,
              name: result.applicantName,
              reference: result.reference,
              calendlyUrl: bookingUrl,
            }).catch(() => null)
          : Promise.resolve(null),
      ])

      await Promise.all([
        db.emailEvent.create({
          data: {
            applicationId,
            type: 'APPLICANT_APPROVED',
            to: result.applicantEmail,
            subject: `Congratulations — Exchange Four Application Update`,
            resendId: approvedEmailId,
          },
        }),
        inviteEmailId
          ? db.emailEvent.create({
              data: {
                applicationId,
                type: 'INTERVIEW_INVITE',
                to: result.applicantEmail,
                subject: `Interview Invitation — Exchange Four — ${result.reference}`,
                resendId: inviteEmailId,
              },
            })
          : null,
      ].filter(Boolean))
    } else if (decision === 'rejected') {
      const result = await finalReject(applicationId, userId)
      const emailId = await sendApplicantRejected({
        to: result.applicantEmail,
        name: result.applicantName,
        reference: result.reference,
        positionTitle: null,
      }).catch(() => null)
      await db.emailEvent.create({
        data: {
          applicationId,
          type: 'APPLICANT_REJECTED',
          to: result.applicantEmail,
          subject: `Exchange Four Application Update — ${result.reference}`,
          resendId: emailId,
        },
      })
    } else {
      await keepWarm(applicationId, userId)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  // Derive name/reference for Slack — best-effort, errors are non-fatal
  try {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      select: { reference: true, applicant: { select: { firstName: true, lastName: true } } },
    })
    if (app) {
      notifyFinalDecision({
        applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
        reference: app.reference,
        decision,
      }).catch(() => null)
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true })
}
