export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import AcknowledgeForm from './AcknowledgeForm'

export default async function AcknowledgePage({
  params,
}: {
  params: Promise<{ employeeId: string }>
}) {
  const { employeeId } = await params

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      onboardingPlan: {
        select: { ndaSigned: true, contractSigned: true, policiesRead: true },
      },
    },
  })

  if (!employee || !employee.onboardingPlan) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '40px 48px', maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>
          Exchange Four Personnel Desk
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Welcome, {employee.firstName}</h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: '#6b7280' }}>
          Please read and acknowledge the following documents to complete your onboarding.
        </p>

        <AcknowledgeForm
          employeeId={employee.id}
          initial={{
            ndaSigned: employee.onboardingPlan.ndaSigned,
            contractSigned: employee.onboardingPlan.contractSigned,
            policiesRead: employee.onboardingPlan.policiesRead,
          }}
        />
      </div>
    </div>
  )
}
