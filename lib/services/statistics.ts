import { db } from '@/lib/db'
import { StatFrequency } from '@/lib/generated/prisma/client'
import { computeTrend } from '@/lib/utils/statistics'

export { computeTrend } from '@/lib/utils/statistics'
export type { TrendDirection } from '@/lib/utils/statistics'

export async function getStatisticsForEmployee(employeeId: string) {
  return db.statistic.findMany({
    where: { employeeId },
    include: {
      entries: {
        orderBy: { enteredAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function assignStatistic(
  employeeId: string,
  data: {
    postTitle: string
    name: string
    definition: string
    unit: string
    frequency: StatFrequency
    target?: number
    seniorResponsible?: string
    dataSource?: string
  }
) {
  return db.statistic.create({
    data: { employeeId, ...data },
  })
}

export async function recordEntry(
  statisticId: string,
  value: number,
  period: string,
  enteredById?: string
) {
  return db.statisticEntry.create({
    data: { statisticId, value, period, enteredById },
  })
}

function staleCutoff(frequency: StatFrequency): Date {
  const now = new Date()
  const ms =
    frequency === 'DAILY' ? 86400000 :
    frequency === 'WEEKLY' ? 7 * 86400000 :
    30 * 86400000
  return new Date(now.getTime() - ms)
}

export async function getStatsAlerts() {
  const allEmployees = await db.employee.findMany({
    include: {
      statistics: {
        include: {
          entries: { orderBy: { enteredAt: 'desc' }, take: 3 },
        },
      },
    },
  })

  type EmployeeWithStats = (typeof allEmployees)[number]
  const missingStats = allEmployees.filter((e: EmployeeWithStats) => e.statistics.length === 0)

  const staleStats: (typeof allEmployees)[0]['statistics'] = []
  const declining: (typeof allEmployees)[0]['statistics'] = []

  for (const emp of allEmployees) {
    for (const stat of emp.statistics) {
      const latest = stat.entries[0]
      if (!latest || latest.enteredAt < staleCutoff(stat.frequency)) {
        staleStats.push(stat)
      }
      if (computeTrend(stat.entries) === 'DOWN') {
        declining.push(stat)
      }
    }
  }

  return { missingStats, staleStats, declining }
}
