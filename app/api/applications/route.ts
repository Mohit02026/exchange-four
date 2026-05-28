import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateReference, saveUpload, createApplication } from '@/lib/services/applications'
import { generateReviewToken } from '@/lib/utils/tokens'
import { writeAuditLog } from '@/lib/utils/audit'
import { sendApplicantConfirmation, sendNicolaNotification } from '@/lib/integrations/email'
import { notifyApplicationSubmitted } from '@/lib/integrations/slack'
import { getApplicationQueue } from '@/lib/services/reviews'
import { createApplicantFolder, uploadFileToDrive, deleteLocalUploads, mimeTypeForFile } from '@/lib/services/drive'

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

  // Email errors are non-fatal — application is already created; log null resendId.
  // Cap at 8 s so a slow/unavailable Resend endpoint never blocks the 201 response.
  function withEmailTimeout<T>(p: Promise<T>): Promise<T | null> {
    return Promise.race([
      p.catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ])
  }

  const [applicantEmailId, nicolaEmailId] = await Promise.all([
    withEmailTimeout(sendApplicantConfirmation({
      to: applicant.correspondenceEmail,
      name: applicantName,
      reference: application.reference,
    })),
    withEmailTimeout(sendNicolaNotification({
      applicantName,
      reference: application.reference,
      positionTitle,
      reviewToken,
    })),
  ])

  await Promise.all([
    // Audit log is best-effort — FK violation can occur in test environments where the
    // session JWT outlives the test user record. Never block a successful submission.
    writeAuditLog({
      action: 'APPLICATION_SUBMITTED',
      entityType: 'Application',
      entityId: application.id,
      userId: session.user.id,
      metadata: { reference: application.reference },
    }).catch((err) => console.error('[audit log] APPLICATION_SUBMITTED failed:', err.message)),
    // Email events are best-effort — never block the 201 response.
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
    }).catch((err) => console.error('[email events] APPLICATION_SUBMITTED failed:', err.message)),
  ])

  // Slack notification (non-fatal)
  notifyApplicationSubmitted({
    applicantName: applicantName,
    reference: application.reference,
    positionTitle,
  }).catch(() => null)

  // Drive upload runs in the background — do NOT await it before returning 201.
  // JWT auth + Google API calls can take 10-15 s, which would block the applicant's
  // browser long enough to time out the form redirect.  The application is already
  // persisted; Drive is best-effort.
  // SKIP_DRIVE_UPLOAD=true in .env.test prevents the background JWT auth from
  // running during E2E tests, which otherwise crashes the dev server.
  const driveAppId   = application.id
  const driveRef     = reference
  const driveVideoName = video.name
  if (!process.env.SKIP_DRIVE_UPLOAD) setImmediate(() => {
    void (async () => {
      try {
        const folderName = `${driveRef} — ${applicantName}`
        const folder = await createApplicantFolder(folderName)
        if (folder) {
          const cvFile     = await db.applicationFile.findFirst({ where: { applicationId: driveAppId, type: 'CV' } })
          const photoFile  = await db.applicationFile.findFirst({ where: { applicationId: driveAppId, type: 'PHOTO' } })
          const videoRecord = await db.applicantVideo.findFirst({ where: { applicationId: driveAppId } })

          const [cvDriveId, photoDriveId, videoDriveId] = await Promise.all([
            cvFile     ? uploadFileToDrive(cvFile.fileUrl,    cvFile.fileName,    mimeTypeForFile(cvFile.fileName),    folder.folderId) : null,
            photoFile  ? uploadFileToDrive(photoFile.fileUrl, photoFile.fileName, mimeTypeForFile(photoFile.fileName), folder.folderId) : null,
            videoRecord ? uploadFileToDrive(videoRecord.url,  driveVideoName,     mimeTypeForFile(driveVideoName),     folder.folderId) : null,
          ])

          await Promise.all([
            db.driveFolder.create({ data: { applicationId: driveAppId, folderId: folder.folderId, folderUrl: folder.folderUrl, type: 'APPLICANT' } }),
            cvFile    && cvDriveId    ? db.applicationFile.update({ where: { id: cvFile.id    }, data: { driveFileId: cvDriveId    } }) : null,
            photoFile && photoDriveId ? db.applicationFile.update({ where: { id: photoFile.id }, data: { driveFileId: photoDriveId } }) : null,
            videoRecord && videoDriveId ? db.applicantVideo.update({ where: { id: videoRecord.id }, data: { driveFileId: videoDriveId } }) : null,
          ].filter(Boolean))

          deleteLocalUploads(driveRef)
        }
      } catch (driveErr) {
        console.error('[Drive upload error]', driveErr)
      }
    })()
  })

  return NextResponse.json({ reference: application.reference }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/applications]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
