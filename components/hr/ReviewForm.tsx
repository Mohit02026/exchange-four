'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReviewSection from './ReviewSection'
import VideoPlayer from '@/components/shared/VideoPlayer'

const REVIEW_SECTIONS = [
  'Resume Presentation',
  'Work History',
  'Job Stability',
  'Employment Gaps',
  'Skills Match',
  'Communication Impression',
  'Immediate Qualifications',
  'Position Fit',
  'Outpoints / Red Flags',
  'Strengths',
  'Missing Data',
] as const

type SectionState = { rating: 'Yes' | 'No' | 'Maybe' | null; notes: string }

type ApplicationData = {
  id: string
  reference: string
  status: string
  bio: string | null
  skills: string | null
  hobbies: string | null
  careerGoals: string | null
  whyExchangeFour: string | null
  isGeneralApplication: boolean
  position: { title: string } | null
  applicant: {
    firstName: string
    lastName: string
    correspondenceEmail: string
    phone: string | null
    location: string | null
    user: { email: string }
  }
  files: { id: string; type: string; fileName: string; fileUrl: string; driveFileId: string | null }[]
  videos: { id: string; url: string; driveFileId: string | null }[]
  driveFolder: { folderId: string; folderUrl: string } | null
  interviewEvent: { scheduledAt: Date | null; inviteSentAt: Date | null } | null
  review: {
    id: string
    notesForAvi: string | null
    privateNotes: string | null
    sections: { section: string; rating: string | null; notes: string | null }[]
  } | null
}

function initSections(review: ApplicationData['review']): Record<string, SectionState> {
  return Object.fromEntries(
    REVIEW_SECTIONS.map((s) => {
      const existing = review?.sections.find((r) => r.section === s)
      return [s, { rating: (existing?.rating as SectionState['rating']) ?? null, notes: existing?.notes ?? '' }]
    })
  )
}

export default function ReviewForm({ application }: { application: ApplicationData }) {
  const router = useRouter()
  const [sections, setSections] = useState<Record<string, SectionState>>(() => initSections(application.review))
  const [notesForAvi, setNotesForAvi] = useState(application.review?.notesForAvi ?? '')
  const [privateNotes, setPrivateNotes] = useState(application.review?.privateNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [message, setMessage] = useState('')

  const cv = application.files.find((f) => f.type === 'CV')
  const video = application.videos[0]

  async function saveDraft() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          sections: REVIEW_SECTIONS.map((s) => ({
            section: s,
            rating: sections[s].rating,
            notes: sections[s].notes || null,
          })),
          notesForAvi: notesForAvi || null,
          privateNotes: privateNotes || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setMessage('Draft saved.')
      router.refresh()
    } catch {
      setMessage('Error saving draft.')
    } finally {
      setSaving(false)
    }
  }

  async function generateCSW() {
    setActionLoading('CSW')
    setMessage('')
    try {
      await saveDraft()
      const res = await fetch('/api/csw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'CSW generation failed')
      router.push(`/hr/csw/${data.id}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error generating CSW.')
    } finally {
      setActionLoading('')
    }
  }

  async function updateStatus(status: string) {
    setActionLoading(status)
    setMessage('')
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Action failed')
      router.refresh()
    } catch {
      setMessage('Error updating status.')
    } finally {
      setActionLoading('')
    }
  }

  async function markHired() {
    setActionLoading('HIRED')
    setMessage('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create employee record')
      router.push(`/hr/onboarding`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error marking as hired.')
    } finally {
      setActionLoading('')
    }
  }

  const isRejected = application.status === 'REJECTED'
  const canHire = ['INTERVIEW_SCHEDULED', 'START_DATE_REQUESTED'].includes(application.status)

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: '100vh' }}>
      {/* Left: Applicant Profile */}
      <div style={{ width: 340, borderRight: '1px solid #e5e7eb', padding: 28, flexShrink: 0, background: '#fff' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
          {application.reference}
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>
          {application.applicant.firstName} {application.applicant.lastName}
        </h2>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          {application.position?.title ?? 'General Application'}
        </div>

        <Section label="Contact">
          <Field label="Email" value={application.applicant.correspondenceEmail} />
          {application.applicant.phone && <Field label="Phone" value={application.applicant.phone} />}
          {application.applicant.location && <Field label="Location" value={application.applicant.location} />}
        </Section>

        {application.bio && <Section label="Bio"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{application.bio}</p></Section>}
        {application.skills && <Section label="Skills"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{application.skills}</p></Section>}
        {application.hobbies && <Section label="Hobbies"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{application.hobbies}</p></Section>}
        {application.careerGoals && <Section label="Career Goals"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{application.careerGoals}</p></Section>}
        {application.whyExchangeFour && <Section label="Why Exchange Four"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{application.whyExchangeFour}</p></Section>}

        {application.driveFolder && (
          <Section label="Storage">
            <a href={application.driveFolder.folderUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>
              Open Files ↗
            </a>
          </Section>
        )}

        {application.interviewEvent && (
          <Section label="Interview">
            {application.interviewEvent.scheduledAt ? (
              <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>
                Scheduled — {new Date(application.interviewEvent.scheduledAt).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            ) : application.interviewEvent.inviteSentAt ? (
              <span style={{ fontSize: 13, color: '#6b7280' }}>Invite sent — awaiting booking</span>
            ) : null}
          </Section>
        )}

        {cv && (
          <Section label="CV">
            <a
              href={cv.fileUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: '#2563eb' }}
            >
              {cv.fileName}
            </a>
          </Section>
        )}

        {video && (
          <Section label="Video Introduction">
            <VideoPlayer url={video.url} />
          </Section>
        )}
      </div>

      {/* Right: Review Form */}
      <div style={{ flex: 1, padding: 28, maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Review</h3>
          <StatusBadge status={application.status} />
        </div>

        {REVIEW_SECTIONS.map((s) => (
          <ReviewSection
            key={s}
            section={s}
            rating={sections[s].rating}
            notes={sections[s].notes}
            onChange={(rating, notes) => setSections((prev) => ({ ...prev, [s]: { rating, notes } }))}
          />
        ))}

        <div style={{ marginTop: 24 }}>
          <Label>Notes for Avi</Label>
          <textarea
            value={notesForAvi}
            onChange={(e) => setNotesForAvi(e.target.value)}
            rows={3}
            placeholder="Summary to include in the CSW for Avi's review..."
            style={textareaStyle}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Label>Private HR Notes</Label>
          <textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes — not visible to Avi..."
            style={textareaStyle}
          />
        </div>

        {message && (
          <div style={{ marginTop: 12, fontSize: 13, color: message.startsWith('Error') ? '#dc2626' : '#16a34a' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <ActionBtn onClick={saveDraft} disabled={saving} primary>
            {saving ? 'Saving...' : 'Save Draft'}
          </ActionBtn>
          <ActionBtn onClick={() => updateStatus('REJECTED')} disabled={!!actionLoading || isRejected} danger>
            {actionLoading === 'REJECTED' ? 'Rejecting...' : 'Reject Applicant'}
          </ActionBtn>
          <ActionBtn onClick={generateCSW} disabled={!!actionLoading} accent>
            {actionLoading === 'CSW' ? 'Generating...' : 'Generate CSW'}
          </ActionBtn>
          {(application.status === 'EXECUTIVE_APPROVED' || application.status === 'EXECUTIVE_DISAPPROVED') && (
            <ActionBtn onClick={() => router.push(`/hr/applications/${application.id}/final`)} accent>
              Final Decision →
            </ActionBtn>
          )}
          {canHire && (
            <ActionBtn onClick={markHired} disabled={!!actionLoading}>
              {actionLoading === 'HIRED' ? 'Creating record…' : '✓ Mark as Hired'}
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: '#9ca3af', minWidth: 60 }}>{label}</span>
      <span style={{ color: '#111' }}>{value}</span>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{children}</div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SUBMITTED: '#2563eb', UNDER_REVIEW: '#d97706', REJECTED: '#dc2626', HIRED: '#16a34a',
  }
  const labels: Record<string, string> = {
    SUBMITTED: 'New', UNDER_REVIEW: 'In Review', REJECTED: 'Rejected', HIRED: 'Hired',
  }
  const color = colors[status] ?? '#6b7280'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: `${color}18`, color, letterSpacing: 0.5 }}>
      {labels[status] ?? status}
    </span>
  )
}

function ActionBtn({ children, onClick, disabled, primary, danger, accent, title }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  danger?: boolean
  accent?: boolean
  title?: string
}) {
  const bg = primary ? '#111' : danger ? '#dc2626' : accent ? '#2563eb' : '#e5e7eb'
  const color = primary || danger || accent ? '#fff' : '#374151'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '9px 18px',
        borderRadius: 5,
        border: 'none',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: bg,
        color,
      }}
    >
      {children}
    </button>
  )
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'sans-serif',
  resize: 'vertical',
  boxSizing: 'border-box',
}
