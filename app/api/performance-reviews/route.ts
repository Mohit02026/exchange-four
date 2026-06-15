import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { createReview, getReviews } from '@/lib/services/performanceReviews'
import { sendReviewScheduled } from '@/lib/integrations/email'
import type { PerfReviewStatus } from '@/lib/generated/prisma/client'

const createSchema = z.object({
  employeeId: z.string(),
  type: z.enum(['DAY_30', 'DAY_60', 'DAY_90', 'ANNUAL']),
  dueDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') as PerfReviewStatus | null
  const employeeIdParam = searchParams.get('employeeId')

  if (session.user.role === 'HR') {
    const reviews = await getReviews({
      ...(statusParam ? { status: statusParam } : {}),
      ...(employeeIdParam ? { employeeId: employeeIdParam } : {}),
    })
    return NextResponse.json(reviews)
  }

  // APPLICANT role: only their own employee record's reviews
  const { db } = await import('@/lib/db')
  const employee = await db.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!employee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reviews = await getReviews({ employeeId: employee.id })
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const review = await createReview(parsed.data)

  try {
    await sendReviewScheduled({
      employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
      reviewType: parsed.data.type,
      dueDate: parsed.data.dueDate ?? 'TBD',
      reviewId: review.id,
    })
  } catch {
    // email failure is non-fatal
  }

  return NextResponse.json(review, { status: 201 })
}
