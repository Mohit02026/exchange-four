import { db } from '@/lib/db'

export interface WeeklyReport {
  generatedAt: string
  weekStart: string
  weekEnd: string

  pipeline: {
    submitted: number
    underReview: number
    cswGenerated: number
    sentToAvi: number
    execApproved: number
    execDisapproved: number
    interviewScheduled: number
    startDateRequested: number
    hired: number
    rejected: number
  }

  thisWeek: {
    newApplications: number
    newHires: number
    interviewsCompleted: number
  }

  awaitingAction: {
    pendingNicolaReview: number
    pendingAviApproval: number
    correctionsExecPending: number
    offboardingCeoPending: number
  }

  onboarding: {
    total: number
    behind: { name: string; completedPct: number; daysSinceHire: number }[]
  }

  training: {
    total: number
    incomplete: { name: string; completedPct: number }[]
  }

  ethics: {
    openReports: number
    subjectsAtThreshold: number
  }

  corrections: {
    open: number
    pendingExec: number
  }

  offboarding: {
    activeCases: number
    pendingCeo: number
  }
}

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  weekStart.setHours(0, 0, 0, 0)

  const [
    statusGroups,
    newApplications,
    newHires,
    interviewsCompleted,
    pendingNicolaReview,
    pendingAviApproval,
    correctionsExecPending,
    offboardingCeoPending,
    onboardingEmployees,
    trainingEmployees,
    openEthics,
    ethicsAlerts,
    openCorrections,
    activeOffboarding,
    offboardingCeoPendingCount,
  ] = await Promise.all([
    db.application.groupBy({ by: ['status'], _count: true }),
    db.application.count({ where: { submittedAt: { gte: weekStart } } }),
    db.employee.count({ where: { createdAt: { gte: weekStart } } }),
    db.interviewEvent.count({
      where: {
        scheduledAt: { gte: weekStart, lt: now },
      },
    }),
    db.application.count({ where: { status: 'SUBMITTED' } }),
    db.application.count({ where: { status: 'SENT_TO_AVI' } }),
    db.correctionHandling.count({
      where: { requiresExecutiveApproval: true, executiveDecision: null },
    }),
    db.offboardingCase.count({
      where: { requiresCeoApproval: true, ceoApproved: null },
    }),
    db.employee.findMany({
      select: {
        firstName: true,
        lastName: true,
        createdAt: true,
        onboardingPlan: {
          select: {
            tasks: { select: { status: true } },
          },
        },
      },
      where: { onboardingPlan: { isNot: null } },
    }),
    db.employee.findMany({
      select: {
        firstName: true,
        lastName: true,
        trainingPlan: {
          select: {
            tasks: { select: { status: true } },
          },
        },
      },
      where: { trainingPlan: { isNot: null } },
    }),
    db.ethicsReport.count({ where: { status: 'OPEN' } }),
    db.ethicsReport.groupBy({
      by: ['subjectEmployeeId'],
      _count: true,
      having: { subjectEmployeeId: { _count: { gte: 3 } } },
    }),
    db.correctionHandling.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    db.offboardingCase.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    db.offboardingCase.count({
      where: { requiresCeoApproval: true, ceoApproved: null },
    }),
  ])

  const statusMap = new Map(statusGroups.map((g) => [g.status as string, g._count as number]))

  // Onboarding — flag as behind if < 50% done and hired > 14 days ago
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const onboardingBehind = onboardingEmployees
    .filter((e) => {
      const tasks = e.onboardingPlan?.tasks ?? []
      if (tasks.length === 0) return false
      const done = tasks.filter((t) => t.status === 'COMPLETE').length
      const pct = Math.round((done / tasks.length) * 100)
      return pct < 50 && e.createdAt < fourteenDaysAgo
    })
    .map((e) => {
      const tasks = e.onboardingPlan?.tasks ?? []
      const done = tasks.filter((t) => t.status === 'COMPLETE').length
      const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
      const days = Math.floor((now.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return {
        name: `${e.firstName} ${e.lastName}`,
        completedPct: pct,
        daysSinceHire: days,
      }
    })

  // Training — flag as incomplete if any tasks remain
  const trainingIncomplete = trainingEmployees
    .filter((e) => {
      const tasks = e.trainingPlan?.tasks ?? []
      return tasks.some((t) => t.status !== 'PASSED')
    })
    .map((e) => {
      const tasks = e.trainingPlan?.tasks ?? []
      const done = tasks.filter((t) => t.status === 'PASSED').length
      const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
      return { name: `${e.firstName} ${e.lastName}`, completedPct: pct }
    })

  return {
    generatedAt: now.toISOString(),
    weekStart: weekStart.toISOString(),
    weekEnd: now.toISOString(),

    pipeline: {
      submitted: statusMap.get('SUBMITTED') ?? 0,
      underReview: statusMap.get('UNDER_REVIEW') ?? 0,
      cswGenerated: statusMap.get('CSW_GENERATED') ?? 0,
      sentToAvi: statusMap.get('SENT_TO_AVI') ?? 0,
      execApproved: statusMap.get('EXECUTIVE_APPROVED') ?? 0,
      execDisapproved: statusMap.get('EXECUTIVE_DISAPPROVED') ?? 0,
      interviewScheduled: statusMap.get('INTERVIEW_SCHEDULED') ?? 0,
      startDateRequested: statusMap.get('START_DATE_REQUESTED') ?? 0,
      hired: statusMap.get('HIRED') ?? 0,
      rejected: statusMap.get('REJECTED') ?? 0,
    },

    thisWeek: {
      newApplications,
      newHires,
      interviewsCompleted,
    },

    awaitingAction: {
      pendingNicolaReview,
      pendingAviApproval,
      correctionsExecPending,
      offboardingCeoPending,
    },

    onboarding: {
      total: onboardingEmployees.length,
      behind: onboardingBehind,
    },

    training: {
      total: trainingEmployees.length,
      incomplete: trainingIncomplete,
    },

    ethics: {
      openReports: openEthics,
      subjectsAtThreshold: ethicsAlerts.length,
    },

    corrections: {
      open: openCorrections,
      pendingExec: correctionsExecPending,
    },

    offboarding: {
      activeCases: activeOffboarding,
      pendingCeo: offboardingCeoPendingCount,
    },
  }
}
