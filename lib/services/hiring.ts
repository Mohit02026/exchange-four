import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'
import { createApplicantFolder } from '@/lib/services/storage'
import { generateNDA, generateContract, generatePolicies } from '@/lib/documents/generate'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

  // Generate onboarding documents async — non-blocking so PDF failure doesn't block hiring
  generateAndUploadDocuments(result.employee.id, result.plan.id, {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    positionTitle: application.position?.title ?? 'Not specified',
    startDate: parsedStartDate?.toLocaleDateString('en-GB') ?? 'To be confirmed',
  }).catch(() => null)

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

function getS3Client(): S3Client | null {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) return null
  return new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

const BUCKET = process.env.MINIO_BUCKET ?? 'exchange-four'

async function uploadToMinIO(key: string, buffer: Buffer): Promise<void> {
  const client = getS3Client()
  if (!client) return
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  )
}

async function generateAndUploadDocuments(
  employeeId: string,
  planId: string,
  {
    firstName,
    lastName,
    positionTitle,
    startDate,
  }: { firstName: string; lastName: string; positionTitle: string; startDate: string }
): Promise<void> {
  const slug = `${lastName}-${firstName}`
  const employeeName = `${firstName} ${lastName}`
  const base = `employees/${slug}/3-onboarding-paperwork`

  const [ndaBuf, contractBuf, policiesBuf] = await Promise.all([
    generateNDA({ employeeName, position: positionTitle, startDate }),
    generateContract({ employeeName, position: positionTitle, startDate }),
    generatePolicies({ employeeName }),
  ])

  const ndaKey = `${base}/nda.pdf`
  const contractKey = `${base}/contract.pdf`
  const policiesKey = `${base}/policies.pdf`

  await Promise.all([
    uploadToMinIO(ndaKey, ndaBuf),
    uploadToMinIO(contractKey, contractBuf),
    uploadToMinIO(policiesKey, policiesBuf),
  ])

  await db.onboardingPlan.update({
    where: { id: planId },
    data: {
      ndaDocumentKey: ndaKey,
      contractDocumentKey: contractKey,
      policiesDocumentKey: policiesKey,
    },
  })
}
