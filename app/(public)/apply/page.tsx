import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import ApplicationForm from '@/components/applicant/ApplicationForm'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) redirect('/register')

  const existing = await db.application.findFirst({ where: { applicantId: applicant.id } })
  if (existing) redirect('/status')

  const params = await searchParams
  const positions = await db.position.findMany({
    where: { status: 'OPEN' },
    include: { orgBoardUnit: true },
    orderBy: { title: 'asc' },
  })

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Submit Application</h1>
      <p className="text-sm text-gray-400 mb-8">Exchange Four Personnel Desk</p>
      <ApplicationForm positions={positions} initialPositionId={params.position} />
    </main>
  )
}
