import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { createCorrection, getAllCorrections } from '@/lib/services/corrections'
import { sendCorrectionFiled, sendCorrectionExecutiveApproval } from '@/lib/integrations/email'
import { db } from '@/lib/db'
import { CorrectionAction } from '@/lib/generated/prisma/client'

const createSchema = z.object({
  employeeId: z.string(),
  incident: z.string().min(10),
  policyInvolved: z.string().optional(),
  correctionRequested: z.string().min(5),
  trainingAssigned: z.string().optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  action: z.nativeEnum(CorrectionAction).optional(),
  followUpDate: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const corrections = await getAllCorrections()
  return NextResponse.json({ corrections: JSON.parse(JSON.stringify(corrections)) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { followUpDate, ...rest } = parsed.data
  const correction = await createCorrection({
    ...rest,
    submittedById: session.user.id,
    followUpDate: followUpDate ? new Date(followUpDate) : undefined,
  })

  // Notify Nicola
  const employee = await db.employee.findUnique({
    where: { id: correction.employeeId },
    include: { user: { select: { name: true } } },
  })
  const name = employee?.user.name ?? 'Employee'

  sendCorrectionFiled({
    employeeName: name,
    severity: correction.severity,
    incident: correction.incident,
    correctionId: correction.id,
  }).catch(() => null)

  // Send exec approval email if required
  if (correction.requiresExecutiveApproval && correction.executiveToken && correction.action) {
    sendCorrectionExecutiveApproval({
      employeeName: name,
      action: correction.action,
      incident: correction.incident,
      token: correction.executiveToken,
    }).catch(() => null)
  }

  return NextResponse.json({ correction }, { status: 201 })
}
