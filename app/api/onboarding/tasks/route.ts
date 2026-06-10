import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId, completeTask, uncompleteTask } from '@/lib/services/onboarding'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) return NextResponse.json({ error: 'No employee record found' }, { status: 404 })

  return NextResponse.json(employee.onboardingPlan?.tasks ?? [])
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) return NextResponse.json({ error: 'No employee record found' }, { status: 404 })

  const { taskId, complete } = await req.json()
  if (!taskId || typeof complete !== 'boolean') {
    return NextResponse.json({ error: 'taskId and complete required' }, { status: 400 })
  }

  // Verify task belongs to this employee
  const task = employee.onboardingPlan?.tasks.find((t) => t.id === taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const updated = complete
    ? await completeTask(taskId, session.user.id)
    : await uncompleteTask(taskId)

  return NextResponse.json(updated)
}
