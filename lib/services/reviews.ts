import { db } from '@/lib/db'
import type { ApplicationStatus } from '@/types'

export const REVIEW_SECTIONS = [
  'Resume Presentation',
  'Work History',
  'Job Stability',
  'Employment Gaps',
  'Skills Match',
  'Communication Impression',
  'Immediate Qualifications',
  'Position Fit',
  'Outpoints / Red Flags',
  'Strengths',
  'Missing Data',
] as const

export type ReviewSectionName = (typeof REVIEW_SECTIONS)[number]

export async function getApplicationQueue() {
  return db.application.findMany({
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      reference: true,
      status: true,
      submittedAt: true,
      isGeneralApplication: true,
      position: { select: { title: true } },
      applicant: { select: { firstName: true, lastName: true } },
      review: { select: { id: true, status: true } },
    },
  })
}

export async function getApplicationById(id: string) {
  return db.application.findUnique({
    where: { id },
    include: {
      applicant: { include: { user: { select: { email: true } } } },
      position: true,
      files: true,
      videos: true,
      review: { include: { sections: true } },
    },
  })
}

export async function upsertReview(params: {
  applicationId: string
  reviewerId: string
  sections: { section: string; rating: string | null; notes: string | null }[]
  notesForAvi: string | null
  privateNotes: string | null
}) {
  const existing = await db.applicantReview.findUnique({
    where: { applicationId: params.applicationId },
  })

  if (existing) {
    return db.applicantReview.update({
      where: { id: existing.id },
      data: {
        notesForAvi: params.notesForAvi,
        privateNotes: params.privateNotes,
        sections: {
          deleteMany: {},
          create: params.sections,
        },
      },
    })
  }

  return db.applicantReview.create({
    data: {
      applicationId: params.applicationId,
      reviewerId: params.reviewerId,
      notesForAvi: params.notesForAvi,
      privateNotes: params.privateNotes,
      sections: { create: params.sections },
    },
  })
}

export async function setApplicationStatus(id: string, status: ApplicationStatus) {
  return db.application.update({ where: { id }, data: { status } })
}

export async function getApplicationByReviewToken(token: string) {
  return db.application.findUnique({
    where: { reviewToken: token },
    select: { id: true, reviewTokenExpiry: true },
  })
}
