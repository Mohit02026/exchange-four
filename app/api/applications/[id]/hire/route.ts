import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { markAsHired } from '@/lib/services/hiring'
import { sendOfferLetter, sendHireConfirmationToNicola } from '@/lib/integrations/email'

const schema = z.object({
  startDate: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const result = await markAsHired(id, parsed.data.startDate, session.user.id)

    await Promise.allSettled([
      sendOfferLetter({
        to: result.applicantEmail,
        name: result.applicantName,
        reference: id,
        positionTitle: result.positionTitle,
        startDate: parsed.data.startDate ?? null,
        employeeId: result.employee.id,
      }),
      sendHireConfirmationToNicola({
        applicantName: result.applicantName,
        positionTitle: result.positionTitle,
        employeeId: result.employee.id,
        startDate: parsed.data.startDate ?? null,
      }),
    ])

    return NextResponse.json({
      employee: result.employee,
      plan: result.plan,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark as hired'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
