import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import NewReviewForm from '@/components/hr/NewReviewForm'

export const dynamic = 'force-dynamic'

export default async function NewReviewPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const employees = await db.employee.findMany({
    orderBy: { lastName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      startDate: true,
    },
  })

  const serialized = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    startDate: e.startDate ? e.startDate.toISOString() : null,
  }))

  return (
    <div style={{ padding: '32px 40px', maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>
          Schedule Review
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Create a new performance review for an employee
        </p>
      </div>
      <NewReviewForm employees={serialized} />
    </div>
  )
}
