import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

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
        select: { ndaSigned: true, contractSigned: true, policiesRead: true },
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

  const plan = await db.onboardingPlan.findUnique({ where: { employeeId } })
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only allow setting flags to true (acknowledged), never retract via this public endpoint
  const data: Record<string, boolean> = {}
  if (parsed.data.ndaSigned === true) data.ndaSigned = true
  if (parsed.data.contractSigned === true) data.contractSigned = true
  if (parsed.data.policiesRead === true) data.policiesRead = true

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No flags to set' }, { status: 400 })
  }

  const updated = await db.onboardingPlan.update({
    where: { employeeId },
    data,
  })

  return NextResponse.json({ plan: updated })
}
