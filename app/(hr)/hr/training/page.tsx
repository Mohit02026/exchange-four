export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllTrainingOverview } from '@/lib/services/training'
import Link from 'next/link'

export default async function HRTrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'HR') redirect('/login')

  const plans = await getAllTrainingOverview()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: '#111827' }}>
          Training &amp; Hatting
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0' }}>
          {plans.length} employee{plans.length !== 1 ? 's' : ''} with training plans
        </p>
      </div>

      {plans.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>
          No training plans created yet.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['Employee', 'Post', 'Passed', 'Total', '% Complete', 'Corrections'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const passed = plan.tasks.filter((t) => t.status === 'PASSED').length
              const total = plan.tasks.length
              const pct = total > 0 ? Math.round((passed / total) * 100) : 0
              const corrections = plan.tasks.filter((t) => t.status === 'CORRECTION_NEEDED').length

              return (
                <tr
                  key={plan.id}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <td style={{ padding: '12px 12px' }}>
                    <Link
                      href={`/hr/onboarding/${plan.employeeId}/training`}
                      style={{ color: '#111827', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {plan.employee.firstName} {plan.employee.lastName}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 12px', color: '#374151' }}>{plan.postTitle}</td>
                  <td style={{ padding: '12px 12px', color: '#10b981', fontWeight: 500 }}>{passed}</td>
                  <td style={{ padding: '12px 12px', color: '#6b7280' }}>{total}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '4px', background: '#f3f4f6', borderRadius: '2px' }}>
                        <div
                          style={{
                            height: '4px',
                            background: '#10b981',
                            borderRadius: '2px',
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <span style={{ color: '#374151' }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    {corrections > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>{corrections}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
