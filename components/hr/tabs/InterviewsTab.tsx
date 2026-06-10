interface InterviewsTabProps {
  interviewEvent: {
    calendlyEventId: string | null
    scheduledAt: string | null
    inviteSentAt: string | null
    survey: {
      howDidItGo: string | null
      stillInterested: boolean | null
      whatWasClear: string | null
      whatWasUnclear: string | null
      openQuestions: string | null
      excitementScore: number | null
      anythingElse: string | null
      submittedAt: string
    } | null
  } | null
}

function SurveyField({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{String(value)}</dd>
    </div>
  )
}

export default function InterviewsTab({ interviewEvent }: InterviewsTabProps) {
  if (!interviewEvent) {
    return <p className="text-sm text-gray-500">No interview scheduled yet.</p>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Calendly Event</h3>
        <dl className="space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-32">Scheduled:</dt>
            <dd>{interviewEvent.scheduledAt ? new Date(interviewEvent.scheduledAt).toLocaleString() : '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-32">Invite sent:</dt>
            <dd>{interviewEvent.inviteSentAt ? new Date(interviewEvent.inviteSentAt).toLocaleString() : '—'}</dd>
          </div>
          {interviewEvent.calendlyEventId && (
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32">Event ID:</dt>
              <dd className="font-mono text-xs">{interviewEvent.calendlyEventId}</dd>
            </div>
          )}
        </dl>
      </div>

      {interviewEvent.survey ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Post-Interview Survey
            <span className="ml-2 text-xs font-normal text-gray-400">
              submitted {new Date(interviewEvent.survey.submittedAt).toLocaleDateString()}
            </span>
          </h3>
          <dl className="space-y-3">
            <SurveyField label="How did it go?" value={interviewEvent.survey.howDidItGo} />
            <SurveyField
              label="Still interested?"
              value={interviewEvent.survey.stillInterested == null ? null : interviewEvent.survey.stillInterested ? 'Yes' : 'No'}
            />
            {interviewEvent.survey.excitementScore != null && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Excitement score</dt>
                <dd className="mt-1 text-2xl font-bold text-blue-600">{interviewEvent.survey.excitementScore}<span className="text-sm font-normal text-gray-400">/10</span></dd>
              </div>
            )}
            <SurveyField label="What was clear?" value={interviewEvent.survey.whatWasClear} />
            <SurveyField label="What was unclear?" value={interviewEvent.survey.whatWasUnclear} />
            <SurveyField label="Open questions" value={interviewEvent.survey.openQuestions} />
            <SurveyField label="Anything else?" value={interviewEvent.survey.anythingElse} />
          </dl>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No survey submitted yet.</p>
      )}
    </div>
  )
}
