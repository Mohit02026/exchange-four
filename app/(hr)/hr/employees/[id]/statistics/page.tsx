export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getStatisticsForEmployee } from '@/lib/services/statistics'
import StatisticsManager from '@/components/hr/StatisticsManager'

export default async function EmployeeStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'HR') redirect('/login')

  const { id } = await params

  const [employee, stats] = await Promise.all([
    db.employee.findUnique({ where: { id }, select: { id: true, firstName: true, lastName: true } }),
    getStatisticsForEmployee(id),
  ])

  if (!employee) notFound()

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <a href="/hr/statistics" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
          ← Statistics Overview
        </a>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, marginBottom: 2 }}>
          {employee.firstName} {employee.lastName}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
          {stats.length} statistic{stats.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      <StatisticsManager employeeId={id} initialStats={stats} />
    </div>
  )
}
