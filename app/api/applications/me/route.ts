import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) return NextResponse.json(null)

  const application = await db.application.findFirst({
    where: { applicantId: applicant.id },
    include: { position: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json(application)
}
