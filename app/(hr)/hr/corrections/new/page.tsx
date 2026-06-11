export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import CorrectionForm from '@/components/hr/CorrectionForm'

export default async function NewCorrectionPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { employeeId } = await searchParams

  const employees = await db.employee.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { firstName: 'asc' },
  })

  const submittedById = session.user.id

  const mapped = employees.map(e => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
  }))

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Corrections
      </div>
      <h1 style={{ margin: '0 0 32px', fontSize: 22, fontWeight: 700 }}>File Correction</h1>
      <CorrectionForm
        employees={mapped}
        currentEmployeeId={employeeId}
        submittedById={submittedById}
      />
    </div>
  )
}
