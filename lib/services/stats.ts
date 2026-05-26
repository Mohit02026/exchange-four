import { db } from '@/lib/db'

const PIPELINE_ORDER = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CSW_GENERATED',
  'SENT_TO_AVI',
  'EXECUTIVE_APPROVED',
  'EXECUTIVE_DISAPPROVED',
  'INTERVIEW_SCHEDULED',
  'START_DATE_REQUESTED',
  'HIRED',
  'REJECTED',
  'FUTURE_PROSPECT',
] as const

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'In Review',
  CSW_GENERATED: 'CSW Generated',
  SENT_TO_AVI: 'Sent to Avi',
  EXECUTIVE_APPROVED: 'Exec Approved',
  EXECUTIVE_DISAPPROVED: 'Exec Disapproved',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  START_DATE_REQUESTED: 'Start Date Requested',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  FUTURE_PROSPECT: 'Future Prospect',
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#2563eb',
  UNDER_REVIEW: '#d97706',
  CSW_GENERATED: '#7c3aed',
  SENT_TO_AVI: '#0891b2',
  EXECUTIVE_APPROVED: '#059669',
  EXECUTIVE_DISAPPROVED: '#dc2626',
  INTERVIEW_SCHEDULED: '#16a34a',
  START_DATE_REQUESTED: '#ca8a04',
  HIRED: '#15803d',
  REJECTED: '#b91c1c',
  FUTURE_PROSPECT: '#6b7280',
}

export type HRStats = {
  total: number
  newThisWeek: number
  newLastWeek: number
  pipeline: { status: string; label: string; count: number; color: string }[]
  cswGenerated: number
  approvals: { approved: number; disapproved: number }
  interviewsScheduled: number
  onboarding: { employees: number; tasksTotal: number; tasksComplete: number }
  topPositions: { title: string; count: number }[]
}

export async function getHRStats(): Promise<HRStats> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    statusGroups,
    newThisWeek,
    newLastWeek,
    cswGenerated,
    interviewsScheduled,
    totalEmployees,
    totalTasks,
    completeTasks,
    approvedCount,
    disapprovedCount,
    positionGroups,
  ] = await Promise.all([
    db.application.groupBy({ by: ['status'], _count: true }),
    db.application.count({ where: { submittedAt: { gte: sevenDaysAgo } } }),
    db.application.count({ where: { submittedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    db.cSWReport.count(),
    db.interviewEvent.count({ where: { scheduledAt: { not: null } } }),
    db.employee.count(),
    db.onboardingTask.count(),
    db.onboardingTask.count({ where: { status: 'COMPLETE' } }),
    db.approvalDecision.count({ where: { decision: 'APPROVED' } }),
    db.approvalDecision.count({ where: { decision: 'DISAPPROVED' } }),
    db.application.groupBy({ by: ['positionId'], _count: true }),
  ])

  // Build status map from groupBy results
  const statusMap = new Map(statusGroups.map((g) => [g.status as string, g._count as number]))
  const total = Array.from(statusMap.values()).reduce((a, b) => a + b, 0)

  const pipeline = PIPELINE_ORDER
    .map((s) => ({
      status: s,
      label: STATUS_LABELS[s] ?? s,
      count: statusMap.get(s) ?? 0,
      color: STATUS_COLORS[s] ?? '#6b7280',
    }))
    .filter((s) => s.count > 0)

  // Resolve position titles for top positions
  const positionIds = positionGroups
    .map((g) => g.positionId)
    .filter((id): id is string => !!id)

  const positions =
    positionIds.length > 0
      ? await db.position.findMany({
          where: { id: { in: positionIds } },
          select: { id: true, title: true },
        })
      : []

  const positionMap = new Map(positions.map((p) => [p.id, p.title]))

  const topPositions = positionGroups
    .map((g) => ({
      title: g.positionId
        ? (positionMap.get(g.positionId) ?? 'Unknown Position')
        : 'General Application',
      count: g._count as number,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return {
    total,
    newThisWeek,
    newLastWeek,
    pipeline,
    cswGenerated,
    approvals: { approved: approvedCount, disapproved: disapprovedCount },
    interviewsScheduled,
    onboarding: {
      employees: totalEmployees,
      tasksTotal: totalTasks,
      tasksComplete: completeTasks,
    },
    topPositions,
  }
}
