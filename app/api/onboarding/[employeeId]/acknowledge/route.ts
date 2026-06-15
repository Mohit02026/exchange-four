import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendAcknowledgmentComplete } from '@/lib/integrations/email'

const bodySchema = z.object({
  ndaSigned: z.boolean().optional(),
  contractSigned: z.boolean().optional(),
  policiesRead: z.boolean().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      startDate: true,
      onboardingPlan: {
        select: {
          ndaSigned: true,
          contractSigned: true,
          policiesRead: true,
          ndaSignedAt: true,
          contractSignedAt: true,
          policiesReadAt: true,
        },
      },
    },
  })

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ employee })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const plan = await db.onboardingPlan.findUnique({
    where: { employeeId },
    include: { employee: { select: { firstName: true, lastName: true } } },
  })
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only allow setting flags to true — never retract via this public endpoint
  const now = new Date()
  const data: Record<string, boolean | Date> = {}
  if (parsed.data.ndaSigned === true && !plan.ndaSigned) {
    data.ndaSigned = true
    data.ndaSignedAt = now
  }
  if (parsed.data.contractSigned === true && !plan.contractSigned) {
    data.contractSigned = true
    data.contractSignedAt = now
  }
  if (parsed.data.policiesRead === true && !plan.policiesRead) {
    data.policiesRead = true
    data.policiesReadAt = now
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No flags to set' }, { status: 400 })
  }

  const updated = await db.onboardingPlan.update({
    where: { employeeId },
    data,
  })

  // Fire notification when all three are now complete
  const allComplete = updated.ndaSigned && updated.contractSigned && updated.policiesRead
  const wasAlreadyComplete = plan.ndaSigned && plan.contractSigned && plan.policiesRead
  if (allComplete && !wasAlreadyComplete) {
    const name = `${plan.employee.firstName} ${plan.employee.lastName}`
    sendAcknowledgmentComplete({ employeeName: name, employeeId }).catch(() => null)
  }

  return NextResponse.json({ plan: updated })
}
