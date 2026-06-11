export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { recordCeoDecision } from '@/lib/services/offboarding'
import { notFound } from 'next/navigation'

export default async function OffboardingApprovalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ decision?: string }>
}) {
  const { token } = await params
  const { decision } = await searchParams

  const offboardingCase = await db.offboardingCase.findUnique({
    where: { ceoApprovalToken: token },
    include: { employee: { include: { user: { select: { name: true } } } } },
  })

  if (!offboardingCase) notFound()

  if (offboardingCase.ceoApprovalTokenUsed) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>Exchange Four Personnel Desk</p>
        <h2 style={{ marginTop: 8 }}>Already Decided</h2>
        <p style={{ color: '#374151' }}>
          This offboarding approval link has already been used.
          Decision: <strong>{offboardingCase.ceoApproved ? 'Approved' : 'Rejected'}</strong>
        </p>
      </div>
    )
  }

  const validDecision = decision === 'APPROVED' || decision === 'REJECTED' ? decision : null

  if (validDecision) {
    await recordCeoDecision(token, validDecision === 'APPROVED')
    const reasonLabel = offboardingCase.reason.charAt(0) + offboardingCase.reason.slice(1).toLowerCase()

    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>Exchange Four Personnel Desk</p>
        <h2 style={{ marginTop: 8, color: validDecision === 'APPROVED' ? '#16a34a' : '#dc2626' }}>
          {validDecision === 'APPROVED' ? 'Approved' : 'Rejected'}
        </h2>
        <p style={{ color: '#374151', fontSize: 15 }}>
          You have <strong>{validDecision === 'APPROVED' ? 'approved' : 'rejected'}</strong> the{' '}
          <em>{reasonLabel}</em> offboarding for{' '}
          <strong>{offboardingCase.employee.user.name}</strong>.
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 24 }}>HR has been notified. No further action required.</p>
      </div>
    )
  }

  const reasonLabel = offboardingCase.reason.charAt(0) + offboardingCase.reason.slice(1).toLowerCase()

  return (
    <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>Exchange Four Personnel Desk</p>
      <h2 style={{ marginTop: 8 }}>CEO Approval Required — Offboarding</h2>
      <p style={{ fontSize: 15, color: '#374151' }}>
        HR is requesting approval to proceed with offboarding{' '}
        <strong>{offboardingCase.employee.user.name}</strong>.
      </p>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', margin: '16px 0' }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Reason</div>
        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{reasonLabel}</div>
      </div>
      {offboardingCase.finalDay && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', margin: '16px 0' }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Final day</div>
          <div style={{ fontWeight: 600 }}>{new Date(offboardingCase.finalDay).toLocaleDateString()}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <a href={`/approve/offboarding/${token}?decision=APPROVED`}
          style={{ background: '#16a34a', color: '#fff', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Approve
        </a>
        <a href={`/approve/offboarding/${token}?decision=REJECTED`}
          style={{ background: '#dc2626', color: '#fff', padding: '10px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Reject
        </a>
      </div>
    </div>
  )
}
