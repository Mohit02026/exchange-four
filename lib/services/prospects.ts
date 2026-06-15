import { db } from '@/lib/db'
import type { ProspectStatus } from '@/lib/generated/prisma/client'

export async function getProspects() {
  return db.prospect.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      position: { select: { title: true } },
    },
  })
}

export async function createProspect(data: {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  linkedinUrl?: string | null
  source?: string
  notes?: string | null
  positionId?: string | null
  createdBy: string
}) {
  return db.prospect.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      source: (data.source as never) ?? 'MANUAL',
      notes: data.notes ?? null,
      positionId: data.positionId ?? null,
      createdBy: data.createdBy,
    },
  })
}

export async function updateProspect(
  id: string,
  data: {
    status?: ProspectStatus
    notes?: string | null
    positionId?: string | null
    inviteSentAt?: Date | null
  }
) {
  return db.prospect.update({
    where: { id },
    data,
  })
}

export async function archiveProspect(id: string) {
  return db.prospect.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })
}

export async function linkProspectToApplication(email: string, applicationId: string) {
  const prospect = await db.prospect.findFirst({ where: { email } })
  if (!prospect) return null
  return db.prospect.update({
    where: { id: prospect.id },
    data: {
      status: 'APPLIED',
      appliedAt: new Date(),
      applicationId,
    },
  })
}
