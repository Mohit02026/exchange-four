import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getDisciplinaryActions, createDisciplinaryAction } from '@/lib/services/disciplinary'
import { sendDisciplinaryNotice } from '@/lib/integrations/email'
import { db } from '@/lib/db'

const createSchema = z.object({
  employeeId: z.string(),
  type: z.enum([
    'VERBAL_WARNING',
    'WRITTEN_WARNING',
    'FINAL_WARNING',
    'PERFORMANCE_IMPROVEMENT_PLAN',
    'SUSPENSION',
    'TERMINATION',
  ]),
  incidentDate: z.string(),
  incidentDescription: z.string().min(10),
  actionTaken: z.string().min(5),
  outcome: z.string().optional(),
  witnessName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId') ?? undefined

  const actions = await getDisciplinaryActions(employeeId ? { employeeId } : undefined)
  return NextResponse.json(actions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const action = await createDisciplinaryAction({
    ...parsed.data,
    createdBy: session.user.id,
  })

  // Send notice email — non-fatal
  try {
    const emp = await db.employee.findUnique({
      where: { id: parsed.data.employeeId },
      select: { firstName: true, lastName: true, user: { select: { email: true } } },
    })
    if (emp?.user?.email) {
      await sendDisciplinaryNotice({
        employeeEmail: emp.user.email,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        type: parsed.data.type,
        incidentDate: parsed.data.incidentDate,
        actionId: action.id,
      })
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({ action }, { status: 201 })
}
