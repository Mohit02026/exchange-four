import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { submitNewHireSurvey, submitSeniorSurvey, getSurveysForEmployee } from '@/lib/services/surveys'

export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  type: z.enum(['NEW_HIRE', 'SENIOR']),
  weekNumber: z.number().int().min(1),
  q1: z.string().min(1),
  q2: z.string().min(1),
  q3: z.string().min(1),
  q4: z.string().min(1),
  q5: z.string().min(1),
  q6: z.string().min(1),
  q7: z.string().optional(),
  q8: z.string().optional(),
  ratingScore: z.number().int().min(1).max(10).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const employee = await db.employee.findUnique({ where: { userId: session.user.id } })
  if (!employee) {
    return NextResponse.json({ error: 'Employee record not found' }, { status: 403 })
  }

  const parsed = submitSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { type, weekNumber, q1, q2, q3, q4, q5, q6, q7, q8, ratingScore } = parsed.data

  if (type === 'SENIOR') {
    if (ratingScore === undefined) {
      return NextResponse.json({ error: 'ratingScore required for SENIOR survey' }, { status: 400 })
    }
    const survey = await submitSeniorSurvey(employee.id, weekNumber, { q1, q2, q3, q4, q5, q6, q7 }, ratingScore)
    return NextResponse.json(survey, { status: 201 })
  }

  const survey = await submitNewHireSurvey(employee.id, weekNumber, { q1, q2, q3, q4, q5, q6, q7, q8 })
  return NextResponse.json(survey, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'HR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const employeeId = req.nextUrl.searchParams.get('employeeId')
  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId query param required' }, { status: 400 })
  }

  const surveys = await getSurveysForEmployee(employeeId)
  return NextResponse.json(surveys)
}
