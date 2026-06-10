import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const NEW_HIRE_LABELS: Record<string, string> = {
  q1: 'How often do you communicate with your senior?',
  q2: 'How do those conversations go?',
  q3: 'What is the biggest barrier to succeeding at your job?',
  q4: 'Is anyone making your work difficult?',
  q5: 'What part of your job needs clearing up?',
  q6: 'What orders did you not fully understand?',
  q7: 'What do you need to be more successful?',
  q8: 'Anything else?',
}

const SENIOR_LABELS: Record<string, string> = {
  q1: "Is anything about this person's space difficult to communicate with?",
  q2: 'How clear is their communication?',
  q3: 'Do they duplicate orders?',
  q4: 'Do they bring problems without solutions?',
  q5: 'What would you change?',
  q6: 'Rating (1–10)',
  q7: 'If below 10, what must be worked on?',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeSurveysPage({ params }: PageProps) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'HR') redirect('/hr/dashboard')

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      newHireSurveys: { orderBy: [{ weekNumber: 'asc' }, { submittedAt: 'asc' }] },
    },
  })

  if (!employee) notFound()

  // Group surveys by weekNumber
  const byWeek = new Map<number, typeof employee.newHireSurveys>()
  for (const s of employee.newHireSurveys) {
    const group = byWeek.get(s.weekNumber) ?? []
    group.push(s)
    byWeek.set(s.weekNumber, group)
  }

  const weeks = Array.from(byWeek.entries()).sort(([a], [b]) => a - b)
  const flagCount = employee.newHireSurveys.filter((s) => s.handlingNeeded).length

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <a href="/hr/onboarding" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
          ← Onboarding
        </a>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: '8px 0 4px' }}>
          Surveys — {employee.firstName} {employee.lastName}
        </h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
          <span>{employee.newHireSurveys.length} surveys total</span>
          {flagCount > 0 && (
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              {flagCount} flagged for handling
            </span>
          )}
        </div>
      </div>

      {weeks.length === 0 && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#6b7280' }}>
          No surveys submitted yet.
        </div>
      )}

      {weeks.map(([week, surveys]) => (
        <div key={week} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 12px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb' }}>
            Week {week}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {surveys.map((survey) => {
              const labels = survey.type === 'NEW_HIRE' ? NEW_HIRE_LABELS : SENIOR_LABELS
              const typeLabel = survey.type === 'NEW_HIRE' ? 'New Hire' : 'Senior'
              const answers: Record<string, string | null> = {
                q1: survey.q1, q2: survey.q2, q3: survey.q3, q4: survey.q4,
                q5: survey.q5, q6: survey.type === 'SENIOR' ? String(survey.ratingScore ?? '') : survey.q6,
                q7: survey.q7 ?? null, q8: survey.q8 ?? null,
              }

              return (
                <div
                  key={survey.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${survey.handlingNeeded ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    background: survey.handlingNeeded ? '#fef2f2' : '#f9fafb',
                    borderBottom: `1px solid ${survey.handlingNeeded ? '#fca5a5' : '#e5e7eb'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                      {typeLabel} Survey
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {survey.handlingNeeded && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                          HANDLING NEEDED
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(survey.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {Object.entries(labels).map(([key, question]) => {
                        const answer = answers[key]
                        if (!answer) return null
                        const isFlag = survey.handlingNeeded && (key === 'q3' || key === 'q4')
                        return (
                          <tr key={key}>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '13px', verticalAlign: 'top', width: '40%' }}>
                              {question}
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', verticalAlign: 'top', color: isFlag ? '#dc2626' : '#111', fontWeight: isFlag ? 500 : 400 }}>
                              {answer}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
