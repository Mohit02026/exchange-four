import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import type { ApplicationStatus } from '@/types'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Application Received',
  UNDER_REVIEW: 'Under Review',
  CSW_GENERATED: 'Under Review',
  SENT_TO_AVI: 'Under Review',
  EXECUTIVE_APPROVED: 'Moving Forward',
  EXECUTIVE_DISAPPROVED: 'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  START_DATE_REQUESTED: 'Moving Forward',
  HIRED: 'Hired',
  REJECTED: 'Thank You for Applying',
  FUTURE_PROSPECT: 'Thank You for Applying',
}

export default async function StatusPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) redirect('/register')

  const application = await db.application.findFirst({
    where: { applicantId: applicant.id },
    include: { position: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' },
  })

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Application Status</h1>
      <p className="text-sm text-gray-400 mb-8">Exchange Four Personnel Desk</p>

      {!application ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
          No application on file.{' '}
          <Link href="/apply" className="text-gray-900 underline">
            Apply now
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          <Row label="Reference" value={<span className="font-mono text-sm">{application.reference}</span>} />
          {application.position ? (
            <Row label="Position" value={application.position.title} />
          ) : (
            <Row label="Type" value="General Application" />
          )}
          <Row
            label="Submitted"
            value={new Date(application.submittedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">Status</span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
              {STATUS_LABELS[application.status as ApplicationStatus] ?? application.status}
            </span>
          </div>
        </div>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
