import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CompletenessRing from '@/components/hr/CompletenessRing'
import { computeCompletenessInline } from '@/lib/services/completeness'
import type { PerfReviewType } from '@/lib/generated/prisma/client'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const employees = await db.employee.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      user: { select: { email: true } },
      onboardingPlan: { select: { ndaSigned: true, contractSigned: true, policiesRead: true } },
      dailyCheckins: { take: 1, select: { id: true } },
      trainingPlan: { include: { tasks: { take: 1, select: { id: true } } } },
      statistics: { take: 1, select: { id: true } },
      performanceReviews: { where: { status: 'COMPLETED' }, select: { type: true } },
    },
  })

  const withScores = employees.map(e => ({
    ...e,
    score: computeCompletenessInline({
      ...e,
      user: e.user,
      performanceReviews: e.performanceReviews as { type: PerfReviewType }[],
    }),
  }))

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1080 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Employees
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            {employees.length} active staff member{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/hr/org" style={{
          padding: '8px 16px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
        }}>
          Org Board →
        </Link>
      </div>

      {employees.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}>
          No employees yet. Hire someone from the applications pipeline.
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                {['Employee', 'Department', 'Start Date', 'Profile'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withScores.map((e, i) => {
                const initials = `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()
                return (
                  <tr key={e.id} style={{
                    borderBottom: i < withScores.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--navy-800)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'var(--gold)',
                          flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div>
                          <Link href={`/hr/employees/${e.id}`} style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontSize: 13,
                          }}>
                            {e.firstName} {e.lastName}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {e.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {e.department ?? <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {e.startDate
                        ? new Date(e.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span style={{ opacity: 0.4 }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CompletenessRing score={e.score} size={40} strokeWidth={4} />
                        <Link href={`/hr/employees/${e.id}`} style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          textDecoration: 'none',
                        }}>
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
