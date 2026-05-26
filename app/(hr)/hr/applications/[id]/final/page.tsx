import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getApplicationForFinal } from '@/lib/services/approvals'
import FinalDecisionPanel from '@/components/hr/FinalDecisionPanel'

export default async function ApplicationFinalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await getApplicationForFinal(id)
  if (!app) notFound()

  const allowedStatuses = ['EXECUTIVE_APPROVED', 'EXECUTIVE_DISAPPROVED', 'START_DATE_REQUESTED', 'REJECTED', 'FUTURE_PROSPECT']
  if (!allowedStatuses.includes(app.status)) {
    return (
      <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          This application has not yet received Avi&apos;s decision.{' '}
          <Link href={`/hr/applications/${id}`} style={{ color: '#2563eb' }}>Back to review</Link>
        </p>
      </div>
    )
  }

  const applicantName = `${app.applicant.firstName} ${app.applicant.lastName}`
  const aviDecision = app.approvalRequest?.decision
    ? {
        decision: app.approvalRequest.decision.decision as string,
        reason: app.approvalRequest.decision.reason ?? null,
        notes: app.approvalRequest.decision.notes ?? null,
      }
    : null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <div style={{ marginBottom: 8 }}>
        <Link href={`/hr/applications/${id}`} style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
          ← Back to application
        </Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{applicantName}</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
        {app.position?.title ?? 'General Application'} · Ref: {app.reference}
      </p>

      <FinalDecisionPanel
        applicationId={app.id}
        applicantName={applicantName}
        reference={app.reference}
        positionTitle={app.position?.title ?? null}
        currentStatus={app.status}
        aviDecision={aviDecision}
        reviewNotesForAvi={app.review?.notesForAvi ?? null}
        reviewSections={
          app.review?.sections.map((s) => ({
            section: s.section,
            rating: s.rating ?? null,
            notes: s.notes ?? null,
          })) ?? []
        }
      />
    </div>
  )
}
