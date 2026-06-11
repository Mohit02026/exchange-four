export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import StartOffboardingForm from '@/components/hr/StartOffboardingForm'

export default async function NewOffboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { employeeId } = await searchParams

  const employees = await db.employee.findMany({
    where: {
      offboardingCase: null,
    },
    orderBy: { firstName: 'asc' },
  })

  const mapped = employees.map(e => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }))

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Offboarding
      </div>
      <h1 style={{ margin: '0 0 32px', fontSize: 22, fontWeight: 700 }}>Start Offboarding</h1>
      <StartOffboardingForm employees={mapped} preselectedEmployeeId={employeeId} />
    </div>
  )
}
