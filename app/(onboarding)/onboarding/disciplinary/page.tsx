export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import AcknowledgeDisciplinaryButton from '@/components/onboarding/AcknowledgeDisciplinaryButton'

const TYPE_LABEL: Record<string, string> = {
  VERBAL_WARNING: 'Verbal Warning',
  WRITTEN_WARNING: 'Written Warning',
  FINAL_WARNING: 'Final Warning',
  PERFORMANCE_IMPROVEMENT_PLAN: 'Performance Improvement Plan',
  SUSPENSION: 'Suspension',
  TERMINATION: 'Termination',
}

const TYPE_COLOR: Record<string, string> = {
  VERBAL_WARNING: '#d97706',
  WRITTEN_WARNING: '#ea580c',
  FINAL_WARNING: '#dc2626',
  PERFORMANCE_IMPROVEMENT_PLAN: '#2563eb',
  SUSPENSION: '#7c3aed',
  TERMINATION: '#7f1d1d',
}

export default async function EmployeeDisciplinaryPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const employee = await db.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      disciplinaryActions: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!employee) redirect('/login')

  const actions = JSON.parse(JSON.stringify(employee.disciplinaryActions))

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>Disciplinary Record</h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280' }}>
        Your formal disciplinary history. Actions marked Open require your acknowledgement.
      </p>

      {actions.length === 0 ? (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
          padding: '24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#16a34a', margin: 0, fontWeight: 500 }}>
            No disciplinary actions on record.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {actions.map((a: {
            id: string
            type: string
            status: string
            incidentDate: string
            incidentDescription: string
            actionTaken: string
            outcome: string | null
            employeeAcknowledged: boolean
            createdAt: string
          }) => (
            <div key={a.id} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: TYPE_COLOR[a.type] ?? '#6b7280', color: '#fff',
                  }}>
                    {TYPE_LABEL[a.type] ?? a.type}
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    Incident: {new Date(a.incidentDate).toLocaleDateString()}
                  </span>
                </div>
                {a.employeeAcknowledged ? (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Acknowledged</span>
                ) : (
                  <AcknowledgeDisciplinaryButton actionId={a.id} />
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>Incident</p>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.incidentDescription}</p>
              </div>

              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>Action Taken</p>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.actionTaken}</p>
              </div>

              {a.outcome && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>Expected Outcome</p>
                  <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.outcome}</p>
                </div>
              )}

              <p style={{ fontSize: 12, color: '#d1d5db', margin: '12px 0 0' }}>
                Filed {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
