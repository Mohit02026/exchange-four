export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import OnboardingProgress from '@/components/hr/OnboardingProgress'

export default async function EmployeeOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      onboardingPlan: { include: { tasks: true } },
      dailyCheckins: { orderBy: { submittedAt: 'desc' }, take: 5 },
      newHireSurveys: true,
      trainingPlan: { include: { tasks: true } },
    },
  })
  if (!employee) notFound()

  const plan = employee.onboardingPlan
  const tasks = plan?.tasks ?? []
  const tasksComplete = tasks.filter(t => t.status === 'COMPLETE').length
  const trainingTasks = employee.trainingPlan?.tasks ?? []
  const trainingPassed = trainingTasks.filter(t => t.status === 'PASSED').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/hr/onboarding" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Onboarding
        </Link>
        <h1 style={{ margin: '8px 0 4px', fontSize: 24, fontWeight: 700 }}>
          {employee.firstName} {employee.lastName}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          {employee.user.email}
          {employee.startDate && ` · Started ${new Date(employee.startDate).toLocaleDateString('en-GB')}`}
        </p>
      </div>

      {/* Progress */}
      {plan && (
        <div style={{ marginBottom: 28 }}>
          <OnboardingProgress
            ndaSigned={plan.ndaSigned}
            contractSigned={plan.contractSigned}
            policiesRead={plan.policiesRead}
            tasksTotal={tasks.length}
            tasksComplete={tasksComplete}
            trainingTotal={trainingTasks.length}
            trainingPassed={trainingPassed}
            surveysSubmitted={employee.newHireSurveys.length}
          />
        </div>
      )}

      {/* Quick nav to sub-pages */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { href: `/hr/onboarding/${id}/surveys`, label: 'Surveys' },
          { href: `/hr/onboarding/${id}/training`, label: 'Training' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: '8px 18px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Recent check-ins */}
      {employee.dailyCheckins.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Check-ins</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {employee.dailyCheckins.map(c => (
              <div key={c.id} style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {new Date(c.submittedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong>Completed:</strong> {c.completedToday}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
