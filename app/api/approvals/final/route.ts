import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { finalApprove, finalReject, keepWarm } from '@/lib/services/approvals'
import { sendApplicantApproved, sendApplicantRejected, sendInterviewInvite } from '@/lib/integrations/email'
import { createInterviewInvite } from '@/lib/services/interviews'
import { db } from '@/lib/db'

const bodySchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(['approved', 'rejected', 'warm']),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      const calendlyUrl = process.env.CALENDLY_EVENT_URL ?? ''

      const [approvedEmailId, inviteEmailId] = await Promise.all([
        sendApplicantApproved({
          to: result.applicantEmail,
          name: result.applicantName,
          reference: result.reference,
          positionTitle: null,
        }).catch(() => null),
        calendlyUrl
          ? sendInterviewInvite({
              to: result.applicantEmail,
              name: result.applicantName,
              reference: result.reference,
              calendlyUrl,
            }).catch(() => null)
          : Promise.resolve(null),
      ])

      await Promise.all([
        createInterviewInvite(applicationId),
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

  return NextResponse.json({ success: true })
}
