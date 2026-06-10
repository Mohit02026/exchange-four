export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getStatsAlerts, type TrendDirection } from '@/lib/services/statistics'
import { computeTrend } from '@/lib/utils/statistics'

type AlertsResult = Awaited<ReturnType<typeof getStatsAlerts>>
type MissingEmployee = AlertsResult['missingStats'][number]
type StatItem = AlertsResult['staleStats'][number]

export default async function StatisticsOverviewPage() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'HR') redirect('/login')

  const [{ missingStats, staleStats, declining }, employees] = await Promise.all([
    getStatsAlerts(),
    db.employee.findMany({
      include: {
        statistics: {
          include: { entries: { orderBy: { enteredAt: 'desc' }, take: 3 } },
        },
      },
      orderBy: { lastName: 'asc' },
    }),
  ])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Statistics</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>
        {employees.length} employee{employees.length !== 1 ? 's' : ''}
      </p>

      {/* Alert banners */}
      {missingStats.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
          <strong style={{ fontSize: 13 }}>⚠ {missingStats.length} employee{missingStats.length !== 1 ? 's' : ''} have no statistics assigned</strong>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
            {missingStats.map((e: MissingEmployee) => `${e.firstName} ${e.lastName}`).join(', ')}
          </div>
        </div>
      )}

      {staleStats.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
          <strong style={{ fontSize: 13 }}>⚠ {staleStats.length} statistic{staleStats.length !== 1 ? 's' : ''} are stale (no recent entry)</strong>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
            {staleStats.map((s: StatItem) => s.name).join(', ')}
          </div>
        </div>
      )}

      {declining.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <strong style={{ fontSize: 13, color: '#dc2626' }}>↓ {declining.length} statistic{declining.length !== 1 ? 's' : ''} are declining</strong>
          <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
            {declining.map((s: StatItem) => s.name).join(', ')}
          </div>
        </div>
      )}

      {/* Employee table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Employee</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Stats</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151' }}>Declining</th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}></th>
          </tr>
        </thead>
        <tbody>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(employees as any[]).map((emp) => {
            const decCount = (emp.statistics as { entries: { value: number }[] }[]).filter(
              (s) => computeTrend(s.entries) === 'DOWN'
            ).length
            return (
              <tr key={emp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                  {emp.firstName} {emp.lastName}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: emp.statistics.length === 0 ? '#9ca3af' : '#111' }}>
                  {emp.statistics.length}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {decCount > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{decCount} ↓</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <Link
                    href={`/hr/employees/${emp.id}/statistics`}
                    style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none' }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
