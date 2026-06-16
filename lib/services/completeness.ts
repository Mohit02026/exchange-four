import { db } from '@/lib/db'
import type { PerfReviewType } from '@/lib/generated/prisma/client'

export type CompletenessBreakdown = {
  field: string
  complete: boolean
  weight: number
}

export type CompletenessResult = {
  score: number
  breakdown: CompletenessBreakdown[]
  missing: string[]
}

export async function getProfileCompleteness(employeeId: string): Promise<CompletenessResult> {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: { select: { email: true } },
      onboardingPlan: { select: { ndaSigned: true, contractSigned: true, policiesRead: true } },
      dailyCheckins: { take: 1, select: { id: true } },
      trainingPlan: { include: { tasks: { take: 1, select: { id: true } } } },
      statistics: { take: 1, select: { id: true } },
      performanceReviews: {
        where: { status: 'COMPLETED' },
        select: { type: true },
      },
    },
  })

  if (!employee) throw new Error('Employee not found')

  const completedTypes = employee.performanceReviews.map(r => r.type)

  const breakdown: CompletenessBreakdown[] = [
    {
      field: 'Personal info',
      weight: 20,
      complete: !!(employee.firstName && employee.lastName && employee.user?.email),
    },
    { field: 'Start date', weight: 5, complete: !!employee.startDate },
    { field: 'Department', weight: 5, complete: !!employee.department },
    { field: 'Manager assigned', weight: 5, complete: !!employee.managerId },
    { field: 'NDA signed', weight: 10, complete: !!employee.onboardingPlan?.ndaSigned },
    { field: 'Contract signed', weight: 10, complete: !!employee.onboardingPlan?.contractSigned },
    { field: 'Policies read', weight: 10, complete: !!employee.onboardingPlan?.policiesRead },
    { field: 'Check-in submitted', weight: 5, complete: employee.dailyCheckins.length > 0 },
    { field: 'Training assigned', weight: 10, complete: (employee.trainingPlan?.tasks?.length ?? 0) > 0 },
    { field: 'Statistics recorded', weight: 5, complete: employee.statistics.length > 0 },
    {
      field: '30-day review',
      weight: 7.5,
      complete: completedTypes.includes('DAY_30' as PerfReviewType),
    },
    {
      field: '60-day review',
      weight: 7.5,
      complete: completedTypes.includes('DAY_60' as PerfReviewType),
    },
  ]

  const score = Math.round(
    breakdown.reduce((sum, c) => sum + (c.complete ? c.weight : 0), 0)
  )
  const missing = breakdown.filter(c => !c.complete).map(c => c.field)

  return { score, breakdown, missing }
}

export async function getAverageCompleteness(): Promise<number> {
  const employees = await db.employee.findMany({ select: { id: true } })
  if (employees.length === 0) return 0
  const scores = await Promise.all(
    employees.map(e => getProfileCompleteness(e.id).then(r => r.score).catch(() => 0))
  )
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// Inline completeness from already-fetched employee data (avoids extra DB queries for list pages)
export function computeCompletenessInline(employee: {
  firstName: string
  lastName: string
  startDate: Date | null
  department: string | null
  managerId: string | null
  user: { email: string } | null
  onboardingPlan: { ndaSigned: boolean; contractSigned: boolean; policiesRead: boolean } | null
  dailyCheckins: { id: string }[]
  trainingPlan: { tasks: { id: string }[] } | null
  statistics: { id: string }[]
  performanceReviews: { type: PerfReviewType }[]
}): number {
  const completedTypes = employee.performanceReviews.map(r => r.type as string)
  const weights = [20, 5, 5, 5, 10, 10, 10, 5, 10, 5, 7.5, 7.5]
  const checks = [
    !!(employee.firstName && employee.lastName && employee.user?.email),
    !!employee.startDate,
    !!employee.department,
    !!employee.managerId,
    !!employee.onboardingPlan?.ndaSigned,
    !!employee.onboardingPlan?.contractSigned,
    !!employee.onboardingPlan?.policiesRead,
    employee.dailyCheckins.length > 0,
    (employee.trainingPlan?.tasks?.length ?? 0) > 0,
    employee.statistics.length > 0,
    completedTypes.includes('DAY_30'),
    completedTypes.includes('DAY_60'),
  ]
  return Math.round(checks.reduce((sum, ok, i) => sum + (ok ? weights[i] : 0), 0))
}
