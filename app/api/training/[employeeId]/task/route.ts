export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getTrainingPlan, addTrainingTask } from '@/lib/services/training'

const taskSchema = z.object({
  functionName: z.string().min(1),
  policyRef: z.string().optional(),
  trainerId: z.string().optional(),
})

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

  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const plan = await getTrainingPlan(employeeId)
  if (!plan) return NextResponse.json({ error: 'No training plan found' }, { status: 404 })

  const task = await addTrainingTask(plan.id, parsed.data)
  return NextResponse.json({ task })
}
