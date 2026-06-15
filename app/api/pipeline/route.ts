import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type PipelineCard = {
  id: string
  applicantName: string
  position: string | null
  daysInStage: number
  status: string
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const applications = await db.application.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      applicant: { select: { firstName: true, lastName: true } },
      position: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const grouped: Record<string, PipelineCard[]> = {}

  for (const app of applications) {
    const card: PipelineCard = {
      id: app.id,
      applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
      position: app.position?.title ?? null,
      daysInStage: Math.floor((Date.now() - app.updatedAt.getTime()) / 86400000),
      status: app.status,
    }
    if (!grouped[app.status]) grouped[app.status] = []
    grouped[app.status].push(card)
  }

  return NextResponse.json(grouped)
}
