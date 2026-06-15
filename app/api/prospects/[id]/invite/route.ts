import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Resend } from 'resend'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const prospect = await db.prospect.findUnique({ where: { id } })
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  if (prospect.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Cannot invite an archived prospect' }, { status: 400 })
  }
  if (!prospect.email) {
    return NextResponse.json({ error: 'Prospect has no email address' }, { status: 400 })
  }

  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const applyUrl = `${baseUrl}/positions`
  const name = `${prospect.firstName} ${prospect.lastName}`

  // Send invite — non-fatal if email fails, still update status
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com',
      to: prospect.email,
      subject: "We'd love for you to apply at Exchange Four",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
          <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">
            Hi ${prospect.firstName},
          </h2>
          <p style="margin:0 0 16px;line-height:1.6;color:#334155">
            We've been following your work and think you'd be a great fit for the Exchange Four team.
            We'd love for you to take a look at our open positions and apply.
          </p>
          <a
            href="${applyUrl}"
            style="
              display:inline-block;
              padding:12px 28px;
              background:#2563eb;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              font-weight:600;
              font-size:15px;
              margin-bottom:24px;
            "
          >
            View Open Positions
          </a>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
            If you have any questions, reply directly to this email.
            We look forward to hearing from you.
          </p>
          <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0" />
          <p style="margin:0;font-size:12px;color:#94a3b8">
            Exchange Four · Personnel Desk
          </p>
        </div>
      `,
    })
  } catch {
    // Email failure is non-fatal — status still updates
  }

  const updated = await db.prospect.update({
    where: { id },
    data: { status: 'INVITE_SENT', inviteSentAt: new Date() },
  })

  return NextResponse.json(updated)
}
