import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getReportsForSubject } from '@/lib/services/ethics'
import { getCorrectionsForEmployee } from '@/lib/services/corrections'
import EmployeeHeader from '@/components/hr/EmployeeHeader'
import ProfileTabs from '@/components/hr/ProfileTabs'
import OnboardingTab from '@/components/hr/tabs/OnboardingTab'
import TrainingTab from '@/components/hr/tabs/TrainingTab'
import StatisticsProfileTab from '@/components/hr/tabs/StatisticsProfileTab'
import SurveysTab from '@/components/hr/tabs/SurveysTab'
import FilesTab from '@/components/hr/tabs/FilesTab'
import AuditLogTab from '@/components/hr/tabs/AuditLogTab'
import EthicsTab from '@/components/hr/tabs/EthicsTab'
import CorrectionsTab from '@/components/hr/tabs/CorrectionsTab'

export const dynamic = 'force-dynamic'

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, ethicsAccess: true } },
      onboardingPlan: { include: { tasks: true } },
      dailyCheckins: { orderBy: { submittedAt: 'desc' }, take: 10 },
      newHireSurveys: { orderBy: { weekNumber: 'asc' } },
      trainingPlan: { include: { tasks: true } },
      statistics: { include: { entries: { orderBy: { enteredAt: 'desc' }, take: 5 } } },
    },
  })

  if (!employee) notFound()

  const application = employee.applicationId
    ? await db.application.findUnique({
        where: { id: employee.applicationId },
        include: {
          files: { where: { type: 'PHOTO' } },
          position: { select: { title: true } },
          driveFolder: true,
        },
      })
    : null

  const auditLogs = await db.auditLog.findMany({
    where: { entityType: 'Employee', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  // Check if current HR user has ethics access
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { ethicsAccess: true },
  })
  const hasEthicsAccess = currentUser?.ethicsAccess ?? false

  const [ethicsReports, corrections] = await Promise.all([
    getReportsForSubject({ subjectEmployeeId: id, hasEthicsAccess }),
    getCorrectionsForEmployee(id),
  ])

  const serialized = JSON.parse(JSON.stringify(employee))
  const serializedApp = application ? JSON.parse(JSON.stringify(application)) : null
  const serializedLogs = JSON.parse(JSON.stringify(auditLogs))
  const serializedEthics = JSON.parse(JSON.stringify(ethicsReports))
  const serializedCorrections = JSON.parse(JSON.stringify(corrections))

  const openCorrections = corrections.filter(c => c.status !== 'RESOLVED').length

  const tabs = [
    { key: 'onboarding', label: 'Onboarding' },
    { key: 'surveys', label: 'Surveys' },
    { key: 'training', label: 'Training' },
    { key: 'statistics', label: 'Statistics' },
    { key: 'corrections', label: `Corrections${openCorrections > 0 ? ` (${openCorrections})` : ''}` },
    { key: 'files', label: 'Files' },
    { key: 'ethics', label: 'Ethics File', hidden: !hasEthicsAccess },
    { key: 'audit', label: 'Audit Log' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <EmployeeHeader employee={serialized} application={serializedApp} />

      <ProfileTabs tabs={tabs}>
        <OnboardingTab
          onboardingPlan={serialized.onboardingPlan}
          dailyCheckins={serialized.dailyCheckins}
        />
        <SurveysTab surveys={serialized.newHireSurveys} />
        <TrainingTab trainingPlan={serialized.trainingPlan} employeeId={id} />
        <StatisticsProfileTab statistics={serialized.statistics} />
        <CorrectionsTab corrections={serializedCorrections} employeeId={id} />
        <FilesTab
          files={serializedApp?.files ?? []}
          driveFolder={serializedApp?.driveFolder ?? null}
        />
        <EthicsTab reports={serializedEthics} employeeId={id} />
        <AuditLogTab auditLogs={serializedLogs} />
      </ProfileTabs>
    </div>
  )
}
