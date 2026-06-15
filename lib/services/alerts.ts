import { db } from '@/lib/db'

export type Alert = {
  type: 'NO_ACKNOWLEDGMENT' | 'NO_CHECKIN' | 'OVERDUE_TASK' | 'STALLED_TRAINING'
  employeeId: string
  employeeName: string
  detail: string
  daysSince: number
  onboardingPlanId?: string
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000)
}

export async function getOnboardingAlerts(): Promise<Alert[]> {
  const now = new Date()
  const alerts: Alert[] = []

  const employees = await db.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      startDate: true,
      createdAt: true,
      onboardingPlan: {
        select: {
          id: true,
          ndaSigned: true,
          contractSigned: true,
          policiesRead: true,
          createdAt: true,
          tasks: {
            select: { id: true, status: true, dueDay: true, createdAt: true },
          },
        },
      },
      dailyCheckins: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: { submittedAt: true },
      },
      trainingPlan: {
        select: {
          tasks: {
            where: { status: 'IN_PROGRESS' },
            select: { id: true, functionName: true, status: true, updatedAt: true },
          },
        },
      },
    },
  })

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`
    const plan = emp.onboardingPlan

    // NO_ACKNOWLEDGMENT: any document not signed and plan > 3 days old
    if (plan) {
      const planAge = daysBetween(plan.createdAt, now)
      if (planAge > 3 && (!plan.ndaSigned || !plan.contractSigned || !plan.policiesRead)) {
        const missing: string[] = []
        if (!plan.ndaSigned) missing.push('NDA')
        if (!plan.contractSigned) missing.push('Contract')
        if (!plan.policiesRead) missing.push('Policies')
        alerts.push({
          type: 'NO_ACKNOWLEDGMENT',
          employeeId: emp.id,
          employeeName: name,
          detail: `Unsigned: ${missing.join(', ')}`,
          daysSince: planAge,
          onboardingPlanId: plan.id,
        })
      }
    }

    // NO_CHECKIN: last check-in > 2 days ago, or no check-ins and hired > 3 days ago
    const hireDate = emp.startDate ?? emp.createdAt
    const lastCheckin = emp.dailyCheckins[0]
    if (lastCheckin) {
      const daysSince = daysBetween(lastCheckin.submittedAt, now)
      if (daysSince > 2) {
        alerts.push({
          type: 'NO_CHECKIN',
          employeeId: emp.id,
          employeeName: name,
          detail: `Last check-in was ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`,
          daysSince,
        })
      }
    } else {
      const daysSinceHire = daysBetween(hireDate, now)
      if (daysSinceHire > 3) {
        alerts.push({
          type: 'NO_CHECKIN',
          employeeId: emp.id,
          employeeName: name,
          detail: 'No check-ins submitted yet',
          daysSince: daysSinceHire,
        })
      }
    }

    // OVERDUE_TASK: task not complete and past its dueDay from plan creation
    if (plan) {
      for (const task of plan.tasks) {
        if (task.status !== 'COMPLETE' && task.dueDay !== null && task.dueDay !== undefined) {
          const dueDate = new Date(plan.createdAt.getTime() + task.dueDay * 86400000)
          if (now > dueDate) {
            const daysOverdue = daysBetween(dueDate, now)
            alerts.push({
              type: 'OVERDUE_TASK',
              employeeId: emp.id,
              employeeName: name,
              detail: `Task overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
              daysSince: daysOverdue,
              onboardingPlanId: plan.id,
            })
          }
        }
      }
    }

    // STALLED_TRAINING: IN_PROGRESS training task with updatedAt > 7 days ago
    if (emp.trainingPlan) {
      for (const task of emp.trainingPlan.tasks) {
        const daysSince = daysBetween(task.updatedAt, now)
        if (daysSince > 7) {
          alerts.push({
            type: 'STALLED_TRAINING',
            employeeId: emp.id,
            employeeName: name,
            detail: `"${task.functionName}" stalled for ${daysSince} day${daysSince !== 1 ? 's' : ''}`,
            daysSince,
          })
        }
      }
    }
  }

  return alerts
}
