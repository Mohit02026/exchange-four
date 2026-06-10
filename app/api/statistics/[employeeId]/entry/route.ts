export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { recordEntry } from '@/lib/services/statistics'

const bodySchema = z.object({
  statisticId: z.string().min(1),
  value: z.number(),
  period: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // employeeId used for URL consistency — entry is tied to statisticId
  await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { statisticId, value, period } = parsed.data
  const entry = await recordEntry(statisticId, value, period, session.user.id)
  return NextResponse.json(entry, { status: 201 })
}
