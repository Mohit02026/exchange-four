import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { addEmployeeComments } from '@/lib/services/performanceReviews'

const schema = z.object({
  comments: z.string().min(1),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const review = await db.performanceReview.findUnique({
    where: { id },
    include: { employee: { select: { userId: true } } },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the employee who owns this review can add comments
  if (review.employee.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (review.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Can only comment on completed reviews' }, { status: 422 })
  }

  const updated = await addEmployeeComments(id, parsed.data.comments)
  return NextResponse.json(updated)
}
