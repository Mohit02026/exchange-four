'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AviDecision {
  decision: string
  reason: string | null
  notes: string | null
}

interface ReviewSection {
  section: string
  rating: string | null
  notes: string | null
}

interface FinalDecisionPanelProps {
  applicationId: string
  applicantName: string
  reference: string
  positionTitle: string | null
  currentStatus: string
  aviDecision: AviDecision | null
  reviewNotesForAvi: string | null
  reviewSections: ReviewSection[]
}

type Decision = 'approved' | 'rejected' | 'warm'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    EXECUTIVE_APPROVED: { label: 'Avi Approved', color: '#16a34a' },
    EXECUTIVE_DISAPPROVED: { label: 'Avi Disapproved', color: '#dc2626' },
    START_DATE_REQUESTED: { label: 'Approved — Awaiting Start Date', color: '#2563eb' },
    REJECTED: { label: 'Rejected', color: '#9ca3af' },
    FUTURE_PROSPECT: { label: 'Future Prospect', color: '#d97706' },
  }
  const s = map[status] ?? { label: status, color: '#6b7280' }
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  )
}

const decided = (status: string) =>
  ['START_DATE_REQUESTED', 'REJECTED', 'FUTURE_PROSPECT'].includes(status)

export default function FinalDecisionPanel({
  applicationId,
  applicantName,
  reference,
  positionTitle,
  currentStatus,
  aviDecision,
  reviewNotesForAvi,
  reviewSections,
}: FinalDecisionPanelProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(decided(currentStatus))
  const [finalStatus, setFinalStatus] = useState(currentStatus)

  async function submit(decision: Decision) {
    setSubmitting(decision)
    setError(null)
    try {
      const res = await fetch('/api/approvals/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, decision }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      const statusMap: Record<Decision, string> = {
        approved: 'START_DATE_REQUESTED',
        rejected: 'REJECTED',
        warm: 'FUTURE_PROSPECT',
      }
      setFinalStatus(statusMap[decision])
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div style={{ borderTop: '2px solid #1a1a1a', marginTop: 48, paddingTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Final Decision</h2>
        <StatusBadge status={finalStatus} />
      </div>

      {aviDecision && (
        <div style={{ background: aviDecision.decision === 'APPROVED' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${aviDecision.decision === 'APPROVED' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 6, padding: '16px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: aviDecision.decision === 'APPROVED' ? '#15803d' : '#dc2626', marginBottom: 4 }}>
            Avi: {aviDecision.decision === 'APPROVED' ? 'Approved ✓' : 'Disapproved ✗'}
          </p>
          {aviDecision.reason && (
            <p style={{ fontSize: 13, color: '#374151', marginTop: 6 }}><strong>Reason:</strong> {aviDecision.reason}</p>
          )}
          {aviDecision.notes && (
            <p style={{ fontSize: 13, color: '#374151', marginTop: 4 }}><strong>Notes:</strong> {aviDecision.notes}</p>
          )}
        </div>
      )}

      {reviewNotesForAvi && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Notes for Avi</p>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{reviewNotesForAvi}</p>
        </div>
      )}

      {reviewSections.length > 0 && (
        <details style={{ marginBottom: 24 }}>
          <summary style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', userSelect: 'none', marginBottom: 8 }}>
            Review scores
          </summary>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <tbody>
              {reviewSections.map((s) => (
                <tr key={s.section} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 8px', color: '#374151', width: '40%' }}>{s.section}</td>
                  <td style={{ padding: '5px 8px', color: '#6b7280' }}>{s.rating ?? '—'}</td>
                  <td style={{ padding: '5px 8px', color: '#9ca3af', fontSize: 12 }}>{s.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {done ? (
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Decision recorded. Status: <StatusBadge status={finalStatus} />
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            <strong>Fully Approved</strong> — sends start-date request email to {applicantName}.<br />
            <strong>Rejected</strong> — sends a kind rejection email.<br />
            <strong>Keep Warm</strong> — marks as future prospect, no email sent.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => submit('approved')}
              disabled={!!submitting}
              style={{ padding: '10px 24px', borderRadius: 6, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, background: '#16a34a', color: '#fff', opacity: submitting && submitting !== 'approved' ? 0.5 : 1 }}
            >
              {submitting === 'approved' ? 'Processing…' : 'Fully Approved'}
            </button>

            <button
              onClick={() => submit('warm')}
              disabled={!!submitting}
              style={{ padding: '10px 24px', borderRadius: 6, border: '1px solid #d97706', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, background: '#fff', color: '#d97706', opacity: submitting && submitting !== 'warm' ? 0.5 : 1 }}
            >
              {submitting === 'warm' ? 'Processing…' : 'Keep Warm'}
            </button>

            <button
              onClick={() => submit('rejected')}
              disabled={!!submitting}
              style={{ padding: '10px 24px', borderRadius: 6, border: '1px solid #dc2626', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, background: '#fff', color: '#dc2626', opacity: submitting && submitting !== 'rejected' ? 0.5 : 1 }}
            >
              {submitting === 'rejected' ? 'Processing…' : 'Rejected'}
            </button>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}
        </>
      )}
    </div>
  )
}
