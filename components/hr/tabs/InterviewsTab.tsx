'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InterviewsTabProps {
  applicationId: string
  applicationStatus?: string
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

export default function InterviewsTab({ applicationId, applicationStatus, interviewEvent }: InterviewsTabProps) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)
  const [hiring, setHiring] = useState(false)
  const [hireError, setHireError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [showHireForm, setShowHireForm] = useState(false)

  async function markAsHired() {
    setHiring(true)
    setHireError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startDate || undefined }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setHireError(body.error ?? 'Failed to mark as hired')
        return
      }
      router.refresh()
    } finally {
      setHiring(false)
    }
  }

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

      {/* Mark as Hired — only when INTERVIEW_SCHEDULED */}
      {applicationStatus === 'INTERVIEW_SCHEDULED' && (
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid #16a34a',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 10 }}>
            Ready to Hire
          </div>
          {!showHireForm ? (
            <button
              onClick={() => setShowHireForm(true)}
              style={{
                padding: '7px 16px', fontSize: 12, fontWeight: 600,
                background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              Mark as Hired
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Start Date (optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '6px 10px', fontSize: 13,
                    background: 'var(--surface-muted)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  }}
                />
              </div>
              {hireError && (
                <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{hireError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={markAsHired}
                  disabled={hiring}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 600,
                    background: hiring ? 'var(--surface-muted)' : '#16a34a',
                    color: hiring ? 'var(--text-muted)' : '#fff',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    cursor: hiring ? 'not-allowed' : 'pointer',
                  }}
                >
                  {hiring ? 'Processing…' : 'Confirm Hire'}
                </button>
                <button
                  onClick={() => { setShowHireForm(false); setHireError(null) }}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 600,
                    background: 'transparent', color: 'var(--text-muted)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
