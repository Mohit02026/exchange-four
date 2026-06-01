import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import SurveyForm from '@/components/applicant/SurveyForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SurveyPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) redirect('/register')

  const application = await db.application.findFirst({
    where: { applicantId: applicant.id },
    include: { interviewEvent: { include: { survey: true } } },
    orderBy: { submittedAt: 'desc' },
  })

  // No interview event — shouldn't be here
  if (!application?.interviewEvent) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4">
        <p className="text-sm text-gray-500">
          No interview on record.{' '}
          <Link href="/status" className="underline text-gray-900">
            Back to status
          </Link>
        </p>
      </main>
    )
  }

  // Already submitted
  if (application.interviewEvent.survey) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Post-Interview Survey</h1>
        <div className="mt-8 rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-2xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Already submitted</h2>
          <p className="text-sm text-gray-500">We have your feedback. Thank you!</p>
          <Link href="/status" className="mt-4 inline-block text-sm text-gray-600 underline">
            Back to application status
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Post-Interview Survey</h1>
      <p className="text-sm text-gray-400 mb-8">
        Your honest feedback helps us improve the process for everyone.
      </p>
      <SurveyForm />
    </main>
  )
}
