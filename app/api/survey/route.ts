import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const surveySchema = z.object({
  howDidItGo: z.string().min(1),
  stillInterested: z.boolean(),
  whatWasClear: z.string().optional(),
  whatWasUnclear: z.string().optional(),
  openQuestions: z.string().optional(),
  excitementScore: z.number().int().min(1).max(10),
  anythingElse: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve applicant → application → interviewEvent
  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) {
    return NextResponse.json({ error: 'No applicant record' }, { status: 400 })
  }

  const application = await db.application.findFirst({
    where: { applicantId: applicant.id },
    include: { interviewEvent: { include: { survey: true } } },
    orderBy: { submittedAt: 'desc' },
  })

  if (!application?.interviewEvent) {
    return NextResponse.json({ error: 'No interview event found' }, { status: 400 })
  }

  if (application.interviewEvent.survey) {
    return NextResponse.json({ error: 'Survey already submitted' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = surveySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const survey = await db.interviewSurvey.create({
    data: {
      interviewEventId: application.interviewEvent.id,
      ...parsed.data,
    },
  })

  return NextResponse.json(survey, { status: 201 })
}
