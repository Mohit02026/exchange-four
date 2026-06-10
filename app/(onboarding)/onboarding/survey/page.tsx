import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import SurveyForm from '@/components/onboarding/SurveyForm'

export const dynamic = 'force-dynamic'

export default async function SurveyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const employee = await db.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      newHireSurveys: {
        where: { type: 'NEW_HIRE' },
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!employee) redirect('/status')

  const startDate = employee.startDate ? new Date(employee.startDate) : new Date()
  const daysIn = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const weekNumber = Math.max(1, Math.ceil((daysIn + 1) / 7))

  const lastSurvey = employee.newHireSurveys[0]
  const alreadySubmittedThisWeek = lastSurvey
    ? lastSurvey.weekNumber === weekNumber
    : false

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          Weekly Survey
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Week {weekNumber} — {employee.firstName} {employee.lastName}
        </p>
      </div>

      {alreadySubmittedThisWeek ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>
            Already Submitted
          </h2>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
            You have already submitted your Week {weekNumber} survey. Check back next week.
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px' }}>
          <SurveyForm
            type="NEW_HIRE"
            weekNumber={weekNumber}
            employeeId={employee.id}
          />
        </div>
      )}
    </div>
  )
}
