import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId } from '@/lib/services/onboarding'
import CheckinForm from '@/components/onboarding/CheckinForm'

export const dynamic = 'force-dynamic'

export default async function OnboardingCheckinPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) redirect('/status')

  const checkins = employee.dailyCheckins ?? []

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Daily Check-In</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Fill in your end-of-day check-in. Nicola receives a summary by email.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '28px', marginBottom: '32px' }}>
        <CheckinForm />
      </div>

      {checkins.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Previous Check-Ins</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checkins.map((c) => (
              <details
                key={c.id}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}
              >
                <summary style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  {new Date(c.submittedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>▾</span>
                </summary>
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f3f4f6' }}>
                  {[
                    ['Completed today', c.completedToday],
                    ['Studied today', c.studiedToday],
                    ['Product produced', c.productProduced],
                    ['What was unclear', c.whatWasUnclear],
                    ['Any blocks', c.anyBlocks],
                    ['Needs help', c.needsHelp],
                  ].map(([label, value]) => (
                    <div key={label} style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
