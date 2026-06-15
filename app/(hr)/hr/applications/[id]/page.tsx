import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import ApplicantHeader from '@/components/hr/ApplicantHeader'
import ProfileTabs from '@/components/hr/ProfileTabs'
import ApplicationTab from '@/components/hr/tabs/ApplicationTab'
import ReviewNotesTab from '@/components/hr/tabs/ReviewNotesTab'
import CSWApprovalTab from '@/components/hr/tabs/CSWApprovalTab'
import InterviewsTab from '@/components/hr/tabs/InterviewsTab'
import FilesTab from '@/components/hr/tabs/FilesTab'
import AuditLogTab from '@/components/hr/tabs/AuditLogTab'
import ReferencesPanel from '@/components/hr/ReferencesPanel'

export const dynamic = 'force-dynamic'

export default async function ApplicationProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const application = await db.application.findUnique({
    where: { id },
    include: {
      applicant: {
        include: { user: { select: { id: true, email: true, ethicsAccess: true } } },
      },
      position: true,
      files: true,
      videos: true,
      driveFolder: true,
      review: { include: { sections: true, notes: true } },
      csw: true,
      approvalRequest: { include: { decision: true } },
      interviewEvent: { include: { survey: true } },
      referenceChecks: true,
      backgroundCheck: true,
    },
  })

  if (!application) notFound()

  const auditLogs = await db.auditLog.findMany({
    where: { entityType: 'Application', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  const tabs = [
    { key: 'application', label: 'Application' },
    { key: 'review', label: 'Review Notes' },
    { key: 'csw', label: 'CSW / Approval' },
    { key: 'interviews', label: 'Interviews' },
    { key: 'references', label: 'References' },
    { key: 'files', label: 'Files' },
    { key: 'audit', label: 'Audit Log' },
  ]

  // Serialize dates for client components
  const serialized = JSON.parse(JSON.stringify(application))
  const serializedLogs = JSON.parse(JSON.stringify(auditLogs))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ApplicantHeader application={serialized} />

      <ProfileTabs tabs={tabs}>
        <ApplicationTab application={serialized} />
        <ReviewNotesTab review={serialized.review} />
        <CSWApprovalTab csw={serialized.csw} approvalRequest={serialized.approvalRequest} />
        <InterviewsTab applicationId={id} applicationStatus={serialized.status} interviewEvent={serialized.interviewEvent} />
        <ReferencesPanel
          applicationId={id}
          references={serialized.referenceChecks}
          bgCheck={serialized.backgroundCheck}
        />
        <FilesTab files={serialized.files} driveFolder={serialized.driveFolder} />
        <AuditLogTab auditLogs={serializedLogs} />
      </ProfileTabs>
    </div>
  )
}
