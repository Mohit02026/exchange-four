import { db } from '@/lib/db'
import { sendSurveyHandlingAlert } from '@/lib/integrations/email'

export async function getSurveysForEmployee(employeeId: string) {
  return db.newHireSurvey.findMany({
    where: { employeeId },
    orderBy: [{ weekNumber: 'asc' }, { submittedAt: 'asc' }],
  })
}

function isTrivial(s: string): boolean {
  return s.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(s.trim())
}

function needsHandling(q3: string, q4: string): boolean {
  return !isTrivial(q3) || !isTrivial(q4)
}

export async function submitNewHireSurvey(
  employeeId: string,
  weekNumber: number,
  answers: { q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7?: string; q8?: string }
) {
  const flagged = needsHandling(answers.q3, answers.q4)

  const survey = await db.newHireSurvey.create({
    data: {
      employeeId,
      type: 'NEW_HIRE' as const,
      weekNumber,
      ...answers,
      handlingNeeded: flagged,
    },
    include: { employee: true },
  })

  if (flagged) {
    const flaggedAnswers = [
      { question: 'What is the biggest barrier to succeeding at your job?', answer: answers.q3 },
      { question: 'Is anyone making your work difficult?', answer: answers.q4 },
    ].filter((a) => !isTrivial(a.answer))

    await sendSurveyHandlingAlert({
      employeeName: `${survey.employee.firstName} ${survey.employee.lastName}`,
      weekNumber,
      type: 'NEW_HIRE',
      flaggedAnswers,
    })
  }

  return survey
}

export async function submitSeniorSurvey(
  employeeId: string,
  weekNumber: number,
  answers: { q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7?: string },
  ratingScore: number
) {
  const survey = await db.newHireSurvey.create({
    data: {
      employeeId,
      type: 'SENIOR' as const,
      weekNumber,
      ...answers,
      ratingScore,
      handlingNeeded: ratingScore < 7,
    },
  })

  return survey
}
