import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  getDisciplinaryAction,
  updateDisciplinaryAction,
  recordAppeal,
} from '@/lib/services/disciplinary'
import { sendDisciplinaryAppealToAvi } from '@/lib/integrations/email'

const updateSchema = z.object({
  outcome: z.string().optional(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'APPEALED', 'CLOSED', 'EXPUNGED']).optional(),
  appealNotes: z.string().optional(),
  appealOutcome: z.string().optional(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const action = await getDisciplinaryAction(id)
  if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(action)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await getDisciplinaryAction(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Special case: recording an appeal
  if (parsed.data.appealNotes && parsed.data.status === 'APPEALED') {
    const { action, token } = await recordAppeal(id, parsed.data.appealNotes)

    try {
      const empName = `${existing.employee.firstName} ${existing.employee.lastName}`
      await sendDisciplinaryAppealToAvi({
        employeeName: empName,
        type: existing.type,
        appealNotes: parsed.data.appealNotes,
        token,
      })
    } catch {
      // non-fatal
    }

    return NextResponse.json({ action })
  }

  const action = await updateDisciplinaryAction(id, {
    status: parsed.data.status,
    outcome: parsed.data.outcome,
    appealNotes: parsed.data.appealNotes,
    appealOutcome: parsed.data.appealOutcome,
    resolvedAt: parsed.data.resolvedAt ? new Date(parsed.data.resolvedAt) : undefined,
    resolvedBy: parsed.data.resolvedBy,
  })

  return NextResponse.json({ action })
}
