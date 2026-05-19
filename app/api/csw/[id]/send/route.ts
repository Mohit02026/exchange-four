import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { approveAndSend } from '@/lib/services/csw'
import { sendAviCSW } from '@/lib/integrations/email'
import { db } from '@/lib/db'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  try {
    const { token, applicantName, reference, positionTitle } = await approveAndSend(id, session.user.id)

    const emailId = await sendAviCSW({ applicantName, reference, positionTitle, approveToken: token })

    await db.emailEvent.create({
      data: {
        type: 'AVI_CSW',
        to: 'avi@exchangefour.com',
        subject: `CSW Ready for Review — ${applicantName} — ${reference}`,
        resendId: emailId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send CSW'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
