import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
export { generateApplicationReference as generateReference } from '@/lib/utils/references'

export async function saveUpload(file: File, reference: string, label: string): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads', reference)
  fs.mkdirSync(dir, { recursive: true })
  const ext = path.extname(file.name)
  const filename = `${label}${ext}`
  fs.writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${reference}/${filename}`
}

export async function createApplication(params: {
  reference: string
  applicantId: string
  positionId?: string
  bio: string
  skills: string
  hobbies: string
  careerGoals: string
  whyExchangeFour: string
  cvUrl: string
  cvName: string
  photoUrl: string
  photoName: string
  videoUrl: string
  videoName: string
}) {
  return db.application.create({
    data: {
      reference: params.reference,
      applicantId: params.applicantId,
      positionId: params.positionId ?? null,
      isGeneralApplication: !params.positionId,
      bio: params.bio,
      skills: params.skills,
      hobbies: params.hobbies,
      careerGoals: params.careerGoals,
      whyExchangeFour: params.whyExchangeFour,
      status: 'SUBMITTED',
      files: {
        create: [
          { type: 'CV', fileName: params.cvName, fileUrl: params.cvUrl },
          { type: 'PHOTO', fileName: params.photoName, fileUrl: params.photoUrl },
        ],
      },
      videos: {
        create: [{ url: params.videoUrl, type: 'UPLOAD' }],
      },
    },
  })
}
