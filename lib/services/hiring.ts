import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'
import { createApplicantFolder } from '@/lib/services/storage'

export async function markAsHired(applicationId: string, startDate?: string, hiredById?: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: { include: { user: true } },
      position: { select: { title: true } },
    },
  })

  if (!application) throw new Error('Application not found')
  if (application.status !== 'INTERVIEW_SCHEDULED') {
    throw new Error(`Cannot hire from status ${application.status}`)
  }

  const { applicant } = application
  const employeeName = `${applicant.lastName}-${applicant.firstName}`
  const parsedStartDate = startDate ? new Date(startDate) : null

  // Create employee folder in MinIO
  const folder = await createApplicantFolder(`employees/${employeeName}`).catch(() => null)

  const result = await db.$transaction(async (tx) => {
    // Update application status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'HIRED' },
    })

    // Create or update employee record
    const employee = await tx.employee.upsert({
      where: { userId: applicant.userId },
      create: {
        userId: applicant.userId,
        applicationId,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        startDate: parsedStartDate,
      },
      update: {
        applicationId,
        startDate: parsedStartDate ?? undefined,
      },
    })

    // Create onboarding plan if missing
    const plan = await tx.onboardingPlan.upsert({
      where: { employeeId: employee.id },
      create: { employeeId: employee.id },
      update: {},
    })

    return { employee, plan }
  })

  await writeAuditLog({
    action: 'HIRED',
    entityType: 'Application',
    entityId: applicationId,
    userId: hiredById,
    metadata: {
      employeeId: result.employee.id,
      startDate: parsedStartDate?.toISOString() ?? null,
      folderKey: folder?.folderId ?? null,
    },
  })

  return {
    employee: result.employee,
    plan: result.plan,
    applicantEmail: applicant.correspondenceEmail,
    applicantName: `${applicant.firstName} ${applicant.lastName}`,
    positionTitle: application.position?.title ?? null,
  }
}
