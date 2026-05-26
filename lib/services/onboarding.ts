import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'

// Default 30-day onboarding task list.
// dueDay = number of working days from start date.
const DEFAULT_TASKS = [
  { title: 'Sign NDA', description: 'Read and sign the Non-Disclosure Agreement.', dueDay: 1 },
  { title: 'Read Employee Handbook', description: 'Review the full employee handbook and company policies.', dueDay: 1 },
  { title: 'Acknowledge Policies', description: 'Confirm you have read and understood all company policies.', dueDay: 2 },
  { title: 'Workspace Setup', description: 'Set up email, Slack, and all required tools.', dueDay: 3 },
  { title: 'Meet Your Team', description: 'Introduction call with immediate team members and manager.', dueDay: 3 },
  { title: 'Review Job Description', description: 'Review full responsibilities and key performance indicators for your role.', dueDay: 5 },
  { title: 'System Access', description: 'Confirm access to all required systems and platforms.', dueDay: 5 },
  { title: 'Complete Performia Assessment', description: 'Complete the Performia personality and aptitude assessment.', dueDay: 7 },
  { title: '1-Week Check-In', description: 'Scheduled check-in with HR to review first week and address any questions.', dueDay: 7 },
  { title: 'Goals & Expectations Meeting', description: 'Meet with manager to set 30/60/90-day goals.', dueDay: 10 },
  { title: '2-Week Progress Review', description: 'Review progress against initial goals and expectations.', dueDay: 14 },
  { title: 'Training Completion', description: 'Complete all mandatory training modules.', dueDay: 21 },
  { title: '30-Day Review', description: 'Formal 30-day performance and onboarding review with HR and manager.', dueDay: 30 },
]

export async function createEmployee(params: {
  applicationId: string
  userId: string
  firstName: string
  lastName: string
  positionId?: string | null
  startDate?: Date | null
  hrUserId: string
}) {
  const employee = await db.employee.create({
    data: {
      userId: params.userId,
      applicationId: params.applicationId,
      firstName: params.firstName,
      lastName: params.lastName,
      positionId: params.positionId ?? null,
      startDate: params.startDate ?? null,
      onboardingPlan: {
        create: {
          tasks: {
            create: DEFAULT_TASKS.map((t) => ({
              title: t.title,
              description: t.description,
              dueDay: t.dueDay,
            })),
          },
        },
      },
    },
    include: { onboardingPlan: { include: { tasks: true } } },
  })

  await db.application.update({
    where: { id: params.applicationId },
    data: { status: 'HIRED' },
  })

  await writeAuditLog({
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: employee.id,
    userId: params.hrUserId,
    metadata: { applicationId: params.applicationId },
  })

  return employee
}

export async function getOnboardingList() {
  return db.employee.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      onboardingPlan: {
        include: { tasks: { orderBy: { dueDay: 'asc' } } },
      },
    },
  })
}

export async function getEmployeeWithPlan(employeeId: string) {
  return db.employee.findUnique({
    where: { id: employeeId },
    include: {
      onboardingPlan: {
        include: { tasks: { orderBy: { dueDay: 'asc' } } },
      },
    },
  })
}

export async function completeTask(taskId: string, userId: string) {
  const task = await db.onboardingTask.update({
    where: { id: taskId },
    data: { status: 'COMPLETE', completedAt: new Date() },
  })

  await writeAuditLog({
    action: 'ONBOARDING_TASK_COMPLETED',
    entityType: 'OnboardingTask',
    entityId: taskId,
    userId,
    metadata: { taskTitle: task.title },
  })

  return task
}

export async function uncompleteTask(taskId: string) {
  return db.onboardingTask.update({
    where: { id: taskId },
    data: { status: 'PENDING', completedAt: null },
  })
}

// Check if an employee record already exists for an application.
export async function getEmployeeByApplication(applicationId: string) {
  return db.employee.findUnique({ where: { applicationId } })
}
