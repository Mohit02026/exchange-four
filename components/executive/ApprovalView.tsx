'use client'

import { useState } from 'react'

interface ReviewSection {
  section: string
  rating: string | null
  notes: string | null
}

interface FileItem {
  id: string
  type: string
  url: string
  name: string
}

interface ApprovalData {
  alreadyDecided: boolean
  decision: { decision: string; reason: string | null; notes: string | null } | null
  applicant: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    location: string | null
    bio: string | null
    skills: string | null
    hobbies: string | null
    careerGoals: string | null
    whyExchangeFour: string | null
  }
  application: {
    id: string
    reference: string
    status: string
    positionTitle: string | null
    isGeneralApplication: boolean
    submittedAt: string
  }
  review: {
    status: string
    notesForAvi: string | null
    sections: ReviewSection[]
  } | null
  csw: { id: string; content: string; status: string } | null
  files: FileItem[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <p style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.6 }}>
      <span style={{ fontWeight: 600, color: '#374151' }}>{label}: </span>
      <span style={{ color: '#4b5563' }}>{value}</span>
    </p>
  )
}

export default function ApprovalView({ data, token }: { data: ApprovalData; token: string }) {
  const [decision, setDecision] = useState<'APPROVED' | 'DISAPPROVED' | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCSW, setShowCSW] = useState(false)

  const { applicant, application, review, csw, files } = data
  const cvFile = files.find((f) => f.type === 'CV')
  const photoFile = files.find((f) => f.type === 'PHOTO')
  const videoFile = files.find((f) => f.type === 'VIDEO')

  async function handleSubmit() {
    if (!decision) return
    if (decision === 'DISAPPROVED' && !reason.trim()) {
      setError('Please state the reason for disapproving.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/approvals/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: reason.trim() || null, notes: notes.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (data.alreadyDecided && data.decision) {
    const prev = data.decision
    return (
      <div style={{ maxWidth: 680, margin: '80px auto', padding: '0 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>Exchange Four</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Decision Already Recorded</h1>
        <p style={{ fontSize: 15 }}>
          A decision of <strong>{prev.decision === 'APPROVED' ? 'Approved' : 'Disapproved'}</strong> has already been recorded for this candidate.
        </p>
        {prev.reason && <p style={{ marginTop: 12, fontSize: 14 }}><strong>Reason:</strong> {prev.reason}</p>}
        {prev.notes && <p style={{ marginTop: 8, fontSize: 14 }}><strong>Notes:</strong> {prev.notes}</p>}
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 680, margin: '80px auto', padding: '0 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>Exchange Four</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 32 }}>
          {decision === 'APPROVED' ? 'Approved ✓' : 'Disapproved'}
        </h1>
        <p style={{ color: '#4b5563', marginTop: 16 }}>Your decision has been recorded and Nicola has been notified.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Exchange Four — Personnel Decision</p>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
        {applicant.firstName} {applicant.lastName}
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>
        {application.positionTitle ?? 'General Application'} · Ref: {application.reference}
      </p>

      <Section title="Applicant">
        <Field label="Email" value={applicant.email} />
        <Field label="Phone" value={applicant.phone} />
        <Field label="Location" value={applicant.location} />
      </Section>

      <Section title="About the Applicant">
        <Field label="Background" value={applicant.bio} />
        <Field label="Skills" value={applicant.skills} />
        <Field label="Hobbies" value={applicant.hobbies} />
        <Field label="Career goals" value={applicant.careerGoals} />
        <Field label="Why Exchange Four" value={applicant.whyExchangeFour} />
      </Section>

      {(photoFile || cvFile || videoFile) && (
        <Section title="Files">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {cvFile && (
              <a href={cvFile.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'underline' }}>
                Download CV
              </a>
            )}
            {photoFile && (
              <a href={photoFile.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'underline' }}>
                View Photo
              </a>
            )}
            {videoFile && (
              <a href={videoFile.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'underline' }}>
                Watch Video
              </a>
            )}
          </div>
        </Section>
      )}

      {review && (
        <Section title="Nicola's Review">
          {review.notesForAvi && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nicola's Notes</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{review.notesForAvi}</p>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 600 }}>Section</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 600 }}>Rating</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 600 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {review.sections.map((s) => (
                <tr key={s.section} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 8px', color: '#374151' }}>{s.section}</td>
                  <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.rating ?? '—'}</td>
                  <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {csw && (
        <Section title="Completed Staff Work">
          <button
            onClick={() => setShowCSW((v) => !v)}
            style={{ fontSize: 13, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginBottom: 12 }}
          >
            {showCSW ? 'Hide CSW' : 'Show Full CSW Document'}
          </button>
          {showCSW && (
            <pre style={{ fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px' }}>
              {csw.content}
            </pre>
          )}
        </Section>
      )}

      <Section title="Your Decision">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setDecision('APPROVED')}
            style={{
              padding: '12px 32px',
              borderRadius: 6,
              border: '2px solid',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              borderColor: decision === 'APPROVED' ? '#16a34a' : '#d1d5db',
              background: decision === 'APPROVED' ? '#16a34a' : '#fff',
              color: decision === 'APPROVED' ? '#fff' : '#374151',
            }}
          >
            Approved
          </button>
          <button
            onClick={() => setDecision('DISAPPROVED')}
            style={{
              padding: '12px 32px',
              borderRadius: 6,
              border: '2px solid',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              borderColor: decision === 'DISAPPROVED' ? '#dc2626' : '#d1d5db',
              background: decision === 'DISAPPROVED' ? '#dc2626' : '#fff',
              color: decision === 'DISAPPROVED' ? '#fff' : '#374151',
            }}
          >
            Disapproved
          </button>
        </div>

        {decision === 'DISAPPROVED' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="State the reason for disapproving…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'Georgia, serif', lineHeight: 1.6, resize: 'vertical' }}
            />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Notes for Nicola (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'Georgia, serif', lineHeight: 1.6, resize: 'vertical' }}
          />
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!decision || submitting}
          style={{
            padding: '12px 40px',
            borderRadius: 6,
            border: 'none',
            cursor: decision && !submitting ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            background: decision ? '#1a1a1a' : '#d1d5db',
            color: '#fff',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Decision'}
        </button>
      </Section>
    </div>
  )
}
