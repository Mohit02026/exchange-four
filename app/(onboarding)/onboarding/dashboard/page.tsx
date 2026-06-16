import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId } from '@/lib/services/onboarding'
import { getProfileCompleteness } from '@/lib/services/completeness'

export const dynamic = 'force-dynamic'

export default async function OnboardingDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) redirect('/status')

  const plan = employee.onboardingPlan
  const tasks = plan?.tasks ?? []
  const completed = tasks.filter((t) => t.status === 'COMPLETE').length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const startDate = employee.startDate ? new Date(employee.startDate) : null
  const daysIn = startDate
    ? Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null

  const checkins = employee.dailyCheckins ?? []
  const completeness = await getProfileCompleteness(employee.id).catch(() => null)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>
          Welcome back, {employee.firstName}
        </h1>
        {daysIn !== null && (
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            Day {daysIn} of your onboarding
          </p>
        )}
      </div>

      {/* Profile completeness */}
      {completeness && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderLeft: `4px solid ${completeness.score >= 80 ? '#10b981' : completeness.score >= 50 ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800,
              color: completeness.score >= 80 ? '#10b981' : completeness.score >= 50 ? '#f59e0b' : '#ef4444',
            }}>
              {completeness.score}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Profile Completeness</div>
            {completeness.missing.length > 0 ? (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Still needed: {completeness.missing.slice(0, 3).join(', ')}{completeness.missing.length > 3 ? ` +${completeness.missing.length - 3} more` : ''}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Everything complete ✓</div>
            )}
          </div>
        </div>
      )}

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatusCard label="NDA" value={plan?.ndaSigned ? 'Signed' : 'Pending'} ok={!!plan?.ndaSigned} />
        <StatusCard label="Contract" value={plan?.contractSigned ? 'Signed' : 'Pending'} ok={!!plan?.contractSigned} />
        <StatusCard label="Policies" value={plan?.policiesRead ? 'Complete' : 'Pending'} ok={!!plan?.policiesRead} />
        <StatusCard label="Tasks" value={`${completed} / ${tasks.length}`} ok={progress === 100} />
        <StatusCard label="Check-ins" value={`${checkins.length} this week`} ok={checkins.length > 0} />
      </div>

      {/* Progress bar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>Onboarding Progress</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>{progress}%</span>
        </div>
        <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', borderRadius: '5px', transition: 'width 0.4s' }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
          {completed} of {tasks.length} tasks complete
        </div>
      </div>

      {/* Recent check-ins */}
      {checkins.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px' }}>Recent Check-Ins</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checkins.map((c) => (
              <div key={c.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                  {new Date(c.submittedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  <strong>Completed:</strong> {c.completedToday}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkins.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#92400e' }}>No check-ins submitted yet.</div>
          <a
            href="/onboarding/checkin"
            style={{ display: 'inline-block', marginTop: '10px', fontSize: '14px', color: '#111', fontWeight: 500 }}
          >
            Submit today&apos;s check-in →
          </a>
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
    }}>
      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{value}</span>
      </div>
    </div>
  )
}
