import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import EthicsReportForm from '@/components/hr/EthicsReportForm'

export const dynamic = 'force-dynamic'

export default async function NewEthicsReportPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const [employees, applicants] = await Promise.all([
    db.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    }),
    db.applicant.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>File Ethics Report</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
          All fields marked * are required. Sensitive reports are restricted to ethics-access users.
        </p>
      </div>

      <EthicsReportForm employees={employees} applicants={applicants} />
    </div>
  )
}
