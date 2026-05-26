import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'

const bodySchema = z.object({
  field: z.enum(['ndaSigned', 'contractSigned', 'policiesRead']),
  value: z.boolean(),
})

export async function PATCH(
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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const plan = await db.onboardingPlan.findUnique({ where: { employeeId } })
  if (!plan) return NextResponse.json({ error: 'Onboarding plan not found' }, { status: 404 })

  const updated = await db.onboardingPlan.update({
    where: { employeeId },
    data: { [parsed.data.field]: parsed.data.value },
  })

  return NextResponse.json({ plan: updated })
}
