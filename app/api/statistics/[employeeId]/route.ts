export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { StatFrequency } from '@/lib/generated/prisma/client'
import { getStatisticsForEmployee, assignStatistic } from '@/lib/services/statistics'

const bodySchema = z.object({
  postTitle: z.string().min(1),
  name: z.string().min(1),
  definition: z.string().min(1),
  unit: z.string().min(1),
  frequency: z.nativeEnum(StatFrequency),
  target: z.number().optional(),
  seniorResponsible: z.string().optional(),
  dataSource: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { employeeId } = await params
  const stats = await getStatisticsForEmployee(employeeId)
  return NextResponse.json(stats)
}

export async function POST(
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

  const stat = await assignStatistic(employeeId, parsed.data)
  return NextResponse.json(stat, { status: 201 })
}
