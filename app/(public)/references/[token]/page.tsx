export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import ReferenceForm from './ReferenceForm'

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const ref = await db.referenceCheck.findUnique({
    where: { token },
    include: {
      application: {
        include: {
          applicant: { select: { firstName: true, lastName: true } },
          position: { select: { title: true } },
        },
      },
    },
  })

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '40px 48px', maxWidth: 560, width: '100%' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 24 }}>
          Exchange Four Personnel Desk
        </div>
        {children}
      </div>
    </div>
  )

  if (!ref || !ref.tokenExpiry || ref.tokenExpiry < new Date()) {
    return shell(
      <>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Link Not Valid</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          This reference link has expired or does not exist. Please contact the Exchange Four personnel team if you believe this is an error.
        </p>
      </>
    )
  }

  if (ref.status === 'COMPLETED') {
    return shell(
      <>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Already Submitted</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Thank you — your reference has already been submitted. No further action is needed.
        </p>
      </>
    )
  }

  const applicantName = `${ref.application.applicant.firstName} ${ref.application.applicant.lastName}`
  const positionTitle = ref.application.position?.title ?? ''

  return shell(
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Reference Form</h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280' }}>
        Complete the form below at your earliest convenience.
      </p>
      <ReferenceForm
        token={token}
        refereeName={ref.refereeName}
        applicantName={applicantName}
        positionTitle={positionTitle}
      />
    </>
  )
}
