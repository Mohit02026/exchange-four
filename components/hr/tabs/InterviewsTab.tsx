'use client'

import { useState } from 'react'

interface InterviewsTabProps {
  applicationId: string
  interviewEvent: {
    interviewToken: string | null
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
      <dt style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</dt>
      <dd style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{String(value)}</dd>
    </div>
  )
}

export default function InterviewsTab({ applicationId, interviewEvent }: InterviewsTabProps) {
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)

  if (!interviewEvent) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No interview invite sent yet.</p>
  }

  const scheduledAt = interviewEvent.scheduledAt || (marked ? new Date().toISOString() : null)
  const bookingUrl = interviewEvent.interviewToken
    ? `/interview/${interviewEvent.interviewToken}`
    : null

  async function markBooked() {
    setMarking(true)
    try {
      await fetch('/api/interviews/mark-booked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      setMarked(true)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Booking status */}
      <div style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${scheduledAt ? '#059669' : 'var(--gold)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Interview Booking
        </div>
        <dl style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <dt style={{ color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>Invite sent:</dt>
            <dd style={{ margin: 0, color: 'var(--text-primary)' }}>
              {interviewEvent.inviteSentAt ? new Date(interviewEvent.inviteSentAt).toLocaleString() : '—'}
            </dd>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <dt style={{ color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>Scheduled:</dt>
            <dd style={{ margin: 0, color: scheduledAt ? '#059669' : 'var(--text-muted)', fontWeight: scheduledAt ? 600 : 400 }}>
              {scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Not booked yet'}
            </dd>
          </div>
          {bookingUrl && (
            <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <dt style={{ color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>Booking link:</dt>
              <dd style={{ margin: 0 }}>
                <a href={bookingUrl} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: 12, fontFamily: 'monospace' }}>
                  /interview/{interviewEvent.interviewToken?.slice(0, 16)}…
                </a>
              </dd>
            </div>
          )}
        </dl>

        {!scheduledAt && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={markBooked}
              disabled={marking}
              style={{
                padding: '7px 16px', fontSize: 12, fontWeight: 600,
                background: marking ? 'var(--surface-muted)' : 'var(--navy-900)',
                color: marking ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: marking ? 'not-allowed' : 'pointer',
              }}
            >
              {marking ? 'Saving…' : 'Mark as Booked'}
            </button>
            <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-muted)' }}>
              Use if applicant booked directly via GHL calendar
            </span>
          </div>
        )}
      </div>

      {/* Post-interview survey */}
      {interviewEvent.survey ? (
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
            Post-Interview Survey
            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
              · submitted {new Date(interviewEvent.survey.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SurveyField label="How did it go?" value={interviewEvent.survey.howDidItGo} />
            <SurveyField
              label="Still interested?"
              value={interviewEvent.survey.stillInterested == null ? null : interviewEvent.survey.stillInterested ? 'Yes' : 'No'}
            />
            {interviewEvent.survey.excitementScore != null && (
              <div>
                <dt style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Excitement score
                </dt>
                <dd style={{ margin: 0 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
                    {interviewEvent.survey.excitementScore}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/10</span>
                </dd>
              </div>
            )}
            <SurveyField label="What was clear?" value={interviewEvent.survey.whatWasClear} />
            <SurveyField label="What was unclear?" value={interviewEvent.survey.whatWasUnclear} />
            <SurveyField label="Open questions" value={interviewEvent.survey.openQuestions} />
            <SurveyField label="Anything else?" value={interviewEvent.survey.anythingElse} />
          </dl>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No survey submitted yet.</p>
      )}
    </div>
  )
}
