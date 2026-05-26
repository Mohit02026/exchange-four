import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateReference, saveUpload, createApplication } from '@/lib/services/applications'
import { generateReviewToken } from '@/lib/utils/tokens'
import { writeAuditLog } from '@/lib/utils/audit'
import { sendApplicantConfirmation, sendNicolaNotification } from '@/lib/integrations/email'
import { getApplicationQueue } from '@/lib/services/reviews'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const queue = await getApplicationQueue()
  return NextResponse.json(queue)
}

const CV_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])

export async function POST(req: NextRequest) {
  try {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'APPLICANT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const applicant = await db.applicant.findUnique({ where: { userId: session.user.id } })
  if (!applicant) return NextResponse.json({ error: 'Applicant profile not found' }, { status: 404 })

  const existing = await db.application.findFirst({ where: { applicantId: applicant.id } })
  if (existing) {
    return NextResponse.json(
      { error: 'You already have a submitted application', reference: existing.reference },
      { status: 409 }
    )
  }

  const form = await req.formData()
  const bio = (form.get('bio') as string | null)?.trim()
  const skills = (form.get('skills') as string | null)?.trim()
  const hobbies = (form.get('hobbies') as string | null)?.trim()
  const careerGoals = (form.get('careerGoals') as string | null)?.trim()
  const whyExchangeFour = (form.get('whyExchangeFour') as string | null)?.trim()
  const positionId = (form.get('positionId') as string | null)?.trim() || undefined

  if (!bio || !skills || !hobbies || !careerGoals || !whyExchangeFour) {
    return NextResponse.json({ error: 'All text fields are required' }, { status: 400 })
  }

  const cv = form.get('cv') as File | null
  const photo = form.get('photo') as File | null
  const video = form.get('video') as File | null

  if (!cv || !photo || !video) {
    return NextResponse.json({ error: 'CV, photo, and video are required' }, { status: 400 })
  }
  if (!CV_TYPES.has(cv.type)) {
    return NextResponse.json({ error: 'CV must be PDF, DOC, or DOCX' }, { status: 400 })
  }
  if (!PHOTO_TYPES.has(photo.type)) {
    return NextResponse.json({ error: 'Photo must be JPG, PNG, or WEBP' }, { status: 400 })
  }
  if (!VIDEO_TYPES.has(video.type)) {
    return NextResponse.json({ error: 'Video must be MP4 or MOV' }, { status: 400 })
  }

  let positionTitle: string | null = null
  if (positionId) {
    const pos = await db.position.findFirst({ where: { id: positionId, status: 'OPEN' } })
    if (!pos) return NextResponse.json({ error: 'Position not found or not open' }, { status: 400 })
    positionTitle = pos.title
  }

  const reference = await generateReference()

  const [cvUrl, photoUrl, videoUrl] = await Promise.all([
    saveUpload(cv, reference, 'cv'),
    saveUpload(photo, reference, 'photo'),
    saveUpload(video, reference, 'video'),
  ])

  const application = await createApplication({
    reference,
    applicantId: applicant.id,
    positionId,
    bio,
    skills,
    hobbies,
    careerGoals,
    whyExchangeFour,
    cvUrl,
    cvName: cv.name,
    photoUrl,
    photoName: photo.name,
    videoUrl,
    videoName: video.name,
  })

  const applicantName = `${applicant.firstName} ${applicant.lastName}`
  const reviewToken = await generateReviewToken(application.id)

  const [applicantEmailId, nicolaEmailId] = await Promise.all([
    sendApplicantConfirmation({
      to: applicant.correspondenceEmail,
      name: applicantName,
      reference: application.reference,
    }),
    sendNicolaNotification({
      applicantName,
      reference: application.reference,
      positionTitle,
      reviewToken,
    }),
  ])

  await Promise.all([
    writeAuditLog({
      action: 'APPLICATION_SUBMITTED',
      entityType: 'Application',
      entityId: application.id,
      userId: session.user.id,
      metadata: { reference: application.reference },
    }),
    db.emailEvent.createMany({
      data: [
        {
          applicationId: application.id,
          type: 'APPLICANT_CONFIRMATION',
          to: applicant.correspondenceEmail,
          subject: `Exchange Four Application Received - ${application.reference}`,
          resendId: applicantEmailId,
        },
        {
          applicationId: application.id,
          type: 'NICOLA_NOTIFICATION',
          to: 'nicola@exchangefour.com',
          subject: `New Application — ${applicantName} — ${application.reference}`,
          resendId: nicolaEmailId,
        },
      ],
    }),
  ])

  return NextResponse.json({ reference: application.reference }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/applications]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
