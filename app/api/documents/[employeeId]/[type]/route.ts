import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateNDA, generateContract, generatePolicies } from '@/lib/documents/generate'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['nda', 'contract', 'policies'] as const
type DocType = typeof VALID_TYPES[number]

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

async function uploadBuffer(key: string, buffer: Buffer): Promise<void> {
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

async function downloadBuffer(key: string): Promise<Buffer | null> {
  const client = getS3Client()
  if (!client) return null
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    if (!res.Body) return null
    const chunks: Uint8Array[] = []
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch {
    return null
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string; type: string }> }
) {
  const { employeeId, type } = await params

  if (!VALID_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }
  const docType = type as DocType

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: {
      onboardingPlan: true,
    },
  })

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  // Resolve position title
  let positionTitle = 'Not specified'
  if (employee.positionId) {
    const position = await db.position.findUnique({
      where: { id: employee.positionId },
      select: { title: true },
    })
    if (position) positionTitle = position.title
  }

  const employeeName = `${employee.firstName} ${employee.lastName}`
  const startDate = employee.startDate?.toLocaleDateString('en-GB') ?? 'To be confirmed'
  const plan = employee.onboardingPlan

  // Key map
  const keyField: Record<DocType, 'ndaDocumentKey' | 'contractDocumentKey' | 'policiesDocumentKey'> = {
    nda: 'ndaDocumentKey',
    contract: 'contractDocumentKey',
    policies: 'policiesDocumentKey',
  }
  const field = keyField[docType]
  const existingKey = plan?.[field] ?? null

  // If cached in MinIO, serve from there
  if (existingKey) {
    const cached = await downloadBuffer(existingKey)
    if (cached) {
      return new Response(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${docType}.pdf"`,
        },
      })
    }
  }

  // Generate on the fly
  const slug = `${employee.lastName}-${employee.firstName}`
  const objectKey = `employees/${slug}/3-onboarding-paperwork/${docType}.pdf`

  let buffer: Buffer
  if (docType === 'nda') {
    buffer = await generateNDA({ employeeName, position: positionTitle, startDate })
  } else if (docType === 'contract') {
    buffer = await generateContract({ employeeName, position: positionTitle, startDate })
  } else {
    buffer = await generatePolicies({ employeeName })
  }

  // Upload and persist key (non-blocking on upload failure)
  try {
    await uploadBuffer(objectKey, buffer)
    if (plan) {
      await db.onboardingPlan.update({
        where: { id: plan.id },
        data: { [field]: objectKey },
      })
    }
  } catch {
    // Upload failure should not block PDF delivery
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${docType}.pdf"`,
    },
  })
}
