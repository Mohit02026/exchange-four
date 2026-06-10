interface Survey {
  id: string
  type: string
  weekNumber: number
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
  q6: string
  q7: string | null
  q8: string | null
  ratingScore: number | null
  handlingNeeded: boolean
  submittedAt: string
}

interface SurveysTabProps {
  surveys: Survey[]
}

const NEW_HIRE_QUESTIONS = [
  'What did you accomplish this week?',
  'What did you find most valuable?',
  'Any confusions or gaps in understanding?',
  'Any handling issues or concerns to flag?',
  'What support do you need from your senior?',
  'How would you rate your integration so far (1–10)?',
  'What could be improved about the onboarding?',
  'Anything else you want to share?',
]

const SENIOR_QUESTIONS = [
  'How is the new hire performing overall?',
  'Key achievements or wins this week?',
  'Any areas where they are struggling?',
  'Any handling concerns or red flags?',
  'Training coverage this week?',
  'Overall performance rating (1–10)?',
  'Recommended next steps?',
]

export default function SurveysTab({ surveys }: SurveysTabProps) {
  if (surveys.length === 0) {
    return <p className="text-sm text-gray-500">No surveys submitted yet.</p>
  }

  return (
    <div className="space-y-4">
      {surveys.map(s => {
        const questions = s.type === 'NEW_HIRE' ? NEW_HIRE_QUESTIONS : SENIOR_QUESTIONS
        const answers = [s.q1, s.q2, s.q3, s.q4, s.q5, s.q6, s.q7, s.q8].filter(Boolean) as string[]

        return (
          <details key={s.id} className={`border rounded-lg ${s.handlingNeeded ? 'border-red-300' : 'border-gray-200'}`}>
            <summary className="cursor-pointer p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  Week {s.weekNumber} — {s.type === 'NEW_HIRE' ? 'New Hire' : 'Senior'}
                </span>
                {s.handlingNeeded && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                    Handling needed
                  </span>
                )}
                {s.ratingScore != null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {s.ratingScore}/10
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">{new Date(s.submittedAt).toLocaleDateString()}</span>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {answers.map((answer, i) => (
                <div key={i}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{questions[i]}</dt>
                  <dd className={`mt-1 text-sm whitespace-pre-wrap ${
                    s.handlingNeeded && (i === 2 || i === 3) ? 'text-red-700' : 'text-gray-800'
                  }`}>{answer}</dd>
                </div>
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}
