import { db } from '@/lib/db'

export type OrgEmployee = {
  id: string
  firstName: string
  lastName: string
  department: string | null
  managerId: string | null
  startDate: string | null
  positionId: string | null
  positionTitle: string | null
  tenureDays: number
  isOnboarding: boolean
}

export async function getOrgData(): Promise<OrgEmployee[]> {
  const employees = await db.employee.findMany({
    where: {
      OR: [
        { offboardingCase: null },
        { offboardingCase: { status: { not: 'COMPLETE' } } },
      ],
    },
    include: {
      onboardingPlan: true,
      offboardingCase: { select: { status: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const positionIds = employees
    .map((e) => e.positionId)
    .filter((id): id is string => id !== null)

  const positions =
    positionIds.length > 0
      ? await db.position.findMany({
          where: { id: { in: positionIds } },
          select: { id: true, title: true },
        })
      : []

  const positionMap = new Map(positions.map((p) => [p.id, p.title]))

  return employees.map((e) => {
    const tenureDays =
      e.startDate !== null
        ? Math.floor((Date.now() - e.startDate.getTime()) / 86400000)
        : 0

    const plan = e.onboardingPlan
    const isOnboarding = plan !== null
      ? !(plan.ndaSigned && plan.contractSigned && plan.policiesRead)
      : false

    return {
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      department: e.department,
      managerId: e.managerId,
      startDate: e.startDate !== null ? e.startDate.toISOString() : null,
      positionId: e.positionId,
      positionTitle: e.positionId ? (positionMap.get(e.positionId) ?? null) : null,
      tenureDays,
      isOnboarding,
    }
  })
}

export async function getHeadcountByDepartment(
  employees: OrgEmployee[]
): Promise<{ department: string; count: number }[]> {
  const counts = new Map<string, number>()
  for (const e of employees) {
    const key = e.department ?? 'Unassigned'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
}

export async function updateEmployeeDepartment(
  id: string,
  department: string
): Promise<void> {
  await db.employee.update({ where: { id }, data: { department } })
}

export async function updateEmployeeManager(
  id: string,
  managerId: string | null
): Promise<void> {
  await db.employee.update({ where: { id }, data: { managerId } })
}
