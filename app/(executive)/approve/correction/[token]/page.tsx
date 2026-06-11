export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { recordExecutiveDecision } from '@/lib/services/corrections'
import { notFound } from 'next/navigation'

export default async function CorrectionApprovalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ decision?: string }>
}) {
  const { token } = await params
  const { decision } = await searchParams

  const correction = await db.correctionHandling.findUnique({
    where: { executiveToken: token },
    include: {
      employee: { include: { user: { select: { name: true } } } },
    },
  })

  if (!correction) notFound()

  if (correction.executiveTokenUsed) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>
          Exchange Four Personnel Desk
        </p>
        <h2 style={{ marginTop: 8 }}>Already Decided</h2>
        <p style={{ color: '#374151' }}>
          This correction approval link has already been used.
          Decision: <strong>{correction.executiveDecision}</strong>
        </p>
      </div>
    )
  }

  const validDecision = decision === 'APPROVED' || decision === 'REJECTED' ? decision : null

  if (validDecision) {
    await recordExecutiveDecision(token, validDecision)
    const actionLabel = (correction.action ?? '').replace(/_/g, ' ').toLowerCase()

    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>
          Exchange Four Personnel Desk
        </p>
        <h2 style={{ marginTop: 8, color: validDecision === 'APPROVED' ? '#16a34a' : '#dc2626' }}>
          {validDecision === 'APPROVED' ? 'Approved' : 'Rejected'}
        </h2>
        <p style={{ color: '#374151', fontSize: 15 }}>
          You have <strong>{validDecision === 'APPROVED' ? 'approved' : 'rejected'}</strong> the
          proposed <em>{actionLabel}</em> for{' '}
          <strong>{correction.employee.user.name}</strong>.
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 24 }}>
          HR has been notified. No further action required.
        </p>
      </div>
    )
  }

  // No decision in query string — show confirmation page
  const actionLabel = (correction.action ?? '').replace(/_/g, ' ').toLowerCase()
  return (
    <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>
        Exchange Four Personnel Desk
      </p>
      <h2 style={{ marginTop: 8 }}>Correction Approval Required</h2>
      <p style={{ fontSize: 15, color: '#374151' }}>
        HR is requesting approval for the following action against{' '}
        <strong>{correction.employee.user.name}</strong>:
      </p>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', margin: '16px 0' }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Proposed action</div>
        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{actionLabel}</div>
      </div>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', margin: '16px 0' }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Incident</div>
        <div style={{ fontSize: 14, color: '#374151' }}>{correction.incident}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <a
          href={`/approve/correction/${token}?decision=APPROVED`}
          style={{ background: '#16a34a', color: '#fff', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
        >
          Approve
        </a>
        <a
          href={`/approve/correction/${token}?decision=REJECTED`}
          style={{ background: '#dc2626', color: '#fff', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
        >
          Reject
        </a>
      </div>
    </div>
  )
}
