import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId } from '@/lib/services/onboarding'
import TaskList from '@/components/onboarding/TaskList'

export const dynamic = 'force-dynamic'

export default async function OnboardingTasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) redirect('/status')

  const rawTasks = employee.onboardingPlan?.tasks ?? []
  const tasks = JSON.parse(JSON.stringify(rawTasks))

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Onboarding Tasks</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Check off tasks as you complete them. Nicola can see your progress.
        </p>
      </div>
      <TaskList initialTasks={tasks} />
    </div>
  )
}
