export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getTrainingPlan, createTrainingPlan } from '@/lib/services/training'

const createSchema = z.object({ postTitle: z.string().min(1) })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId } = await params
  const plan = await getTrainingPlan(employeeId)
  return NextResponse.json({ plan })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const plan = await createTrainingPlan(employeeId, parsed.data.postTitle)
  return NextResponse.json({ plan })
}
