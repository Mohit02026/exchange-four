import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getReview, updateReview } from '@/lib/services/performanceReviews'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  ratings: z
    .array(
      z.object({
        category: z.string(),
        score: z.number().min(1).max(5),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  summary: z.string().optional(),
  goalsSet: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const review = await getReview(id)
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.user.role === 'HR') return NextResponse.json(review)

  // APPLICANT: verify this review belongs to the session user's employee
  const employee = await db.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!employee || review.employeeId !== employee.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(review)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updateData: Parameters<typeof updateReview>[1] = { ...parsed.data }

  if (parsed.data.status === 'COMPLETED') {
    updateData.conductedAt = new Date()
    updateData.conductedById = session.user.id
  }

  const review = await updateReview(id, updateData)
  return NextResponse.json(review)
}
