import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId, submitCheckin } from '@/lib/services/onboarding'
import { sendCheckinSummary } from '@/lib/integrations/email'

export const dynamic = 'force-dynamic'

const schema = z.object({
  completedToday: z.string().min(1),
  studiedToday: z.string().min(1),
  productProduced: z.string().min(1),
  whatWasUnclear: z.string().min(1),
  anyBlocks: z.string().min(1),
  needsHelp: z.string().min(1),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) return NextResponse.json({ error: 'No employee record found' }, { status: 404 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const checkin = await submitCheckin(employee.id, parsed.data)

  // Non-fatal — email Nicola the summary
  sendCheckinSummary({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    ...parsed.data,
    submittedAt: checkin.submittedAt,
  }).catch(() => null)

  return NextResponse.json(checkin, { status: 201 })
}
