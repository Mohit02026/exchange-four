import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { createOffboardingCase, getAllActiveCases } from '@/lib/services/offboarding'
import { sendOffboardingStarted, sendOffboardingCeoApproval } from '@/lib/integrations/email'
import { OffboardingReason } from '@/lib/generated/prisma/client'

const createSchema = z.object({
  employeeId: z.string(),
  reason: z.nativeEnum(OffboardingReason),
  finalDay: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cases = await getAllActiveCases()
  return NextResponse.json({ cases: JSON.parse(JSON.stringify(cases)) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { finalDay, ...rest } = parsed.data
  let offboardingCase
  try {
    offboardingCase = await createOffboardingCase({
      ...rest,
      finalDay: finalDay ? new Date(finalDay) : undefined,
      createdById: session.user.id,
    })
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'P2002') return NextResponse.json({ error: 'Employee already has an active offboarding case' }, { status: 409 })
    throw e
  }

  const empName = offboardingCase.employee.user.name ?? offboardingCase.employee.user.email

  sendOffboardingStarted({
    employeeName: empName,
    reason: offboardingCase.reason,
    finalDay: offboardingCase.finalDay
      ? new Date(offboardingCase.finalDay).toLocaleDateString()
      : null,
    caseId: offboardingCase.id,
  }).catch(() => null)

  if (offboardingCase.requiresCeoApproval && offboardingCase.ceoApprovalToken) {
    sendOffboardingCeoApproval({
      employeeName: empName,
      reason: offboardingCase.reason,
      token: offboardingCase.ceoApprovalToken,
    }).catch(() => null)
  }

  return NextResponse.json({ case: JSON.parse(JSON.stringify(offboardingCase)) }, { status: 201 })
}
