export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { updateTaskStatus } from '@/lib/services/training'
import { TrainingStatus } from '@/lib/generated/prisma/client'

const patchSchema = z.object({
  status: z.nativeEnum(TrainingStatus),
  qualityCheckNotes: z.string().optional(),
  correctionNotes: z.string().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { taskId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { status, qualityCheckNotes, correctionNotes } = parsed.data
  const task = await updateTaskStatus(taskId, status, { qualityCheckNotes, correctionNotes })
  return NextResponse.json({ task })
}
