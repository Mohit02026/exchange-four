import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { completeTask, uncompleteTask } from '@/lib/services/onboarding'

const bodySchema = z.object({ complete: z.boolean() })

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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const task = parsed.data.complete
    ? await completeTask(taskId, session.user.id)
    : await uncompleteTask(taskId)

  return NextResponse.json({ task })
}
