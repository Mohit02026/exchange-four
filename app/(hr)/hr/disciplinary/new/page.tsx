export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import NewDisciplinaryForm from '@/components/hr/NewDisciplinaryForm'

export default async function NewDisciplinaryPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const employees = await db.employee.findMany({
    orderBy: { lastName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
  })

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        <a href="/hr/disciplinary" style={{ color: '#9ca3af', textDecoration: 'none' }}>Disciplinary</a> /
      </div>
      <h1 style={{ margin: '8px 0 32px', fontSize: 22, fontWeight: 700 }}>New Disciplinary Action</h1>
      <NewDisciplinaryForm employees={employees} />
    </div>
  )
}
