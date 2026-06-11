import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAllReports, createReport } from '@/lib/services/ethics'

const createSchema = z.object({
  subjectEmployeeId: z.string().optional(),
  subjectApplicantId: z.string().optional(),
  subjectType: z.enum(['EMPLOYEE', 'APPLICANT']),
  category: z.string().min(1),
  description: z.string().min(10),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
  witnesses: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'SENSITIVE']),
  isSensitive: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { ethicsAccess: true },
  })

  const reports = await getAllReports(user?.ethicsAccess ?? false)
  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data
  // SENSITIVE severity always forces isSensitive = true
  const isSensitive = d.isSensitive || d.severity === 'SENSITIVE'

  const report = await createReport({
    reporterId: session.user.id,
    subjectEmployeeId: d.subjectEmployeeId,
    subjectApplicantId: d.subjectApplicantId,
    subjectType: d.subjectType,
    category: d.category,
    description: d.description,
    evidenceUrl: d.evidenceUrl || undefined,
    witnesses: d.witnesses,
    severity: d.severity,
    isSensitive,
  })

  return NextResponse.json(report, { status: 201 })
}
