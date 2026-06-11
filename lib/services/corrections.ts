import { db } from '@/lib/db'
import { CorrectionStatus, CorrectionAction } from '@/lib/generated/prisma/client'
import { randomUUID } from 'crypto'

export async function createCorrection(params: {
  employeeId: string
  submittedById: string
  incident: string
  policyInvolved?: string
  correctionRequested: string
  trainingAssigned?: string
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL'
  action?: CorrectionAction
  followUpDate?: Date
}) {
  const requiresExec = params.action != null && [
    'SUSPENSION',
    'TERMINATION_RECOMMENDATION',
    'TRANSFER_DEMOTION_PROMOTION',
  ].includes(params.action)

  const executiveToken = requiresExec ? `EX4-CORRECTION-${randomUUID()}` : null

  return db.correctionHandling.create({
    data: {
      ...params,
      requiresExecutiveApproval: requiresExec,
      executiveToken,
    },
  })
}

export async function getCorrectionsForEmployee(employeeId: string) {
  return db.correctionHandling.findMany({
    where: { employeeId },
    include: {
      submittedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllCorrections() {
  return db.correctionHandling.findMany({
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      submittedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCorrectionById(id: string) {
  return db.correctionHandling.findUnique({
    where: { id },
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      submittedBy: { select: { name: true, email: true } },
    },
  })
}

export async function updateCorrection(
  id: string,
  data: {
    status?: CorrectionStatus
    hrNotes?: string
    employeeResponse?: string
    resolution?: string
    followUpDate?: Date | null
    action?: CorrectionAction
    trainingAssigned?: string
  }
) {
  const requiresExec = data.action != null && [
    'SUSPENSION',
    'TERMINATION_RECOMMENDATION',
    'TRANSFER_DEMOTION_PROMOTION',
  ].includes(data.action)

  return db.correctionHandling.update({
    where: { id },
    data: {
      ...data,
      requiresExecutiveApproval: requiresExec || undefined,
      updatedAt: new Date(),
    },
  })
}

export async function recordExecutiveDecision(
  token: string,
  decision: 'APPROVED' | 'REJECTED'
) {
  const correction = await db.correctionHandling.findUnique({
    where: { executiveToken: token },
  })
  if (!correction || correction.executiveTokenUsed) return null

  return db.correctionHandling.update({
    where: { id: correction.id },
    data: {
      executiveDecision: decision,
      executiveDecidedAt: new Date(),
      executiveTokenUsed: true,
      status: decision === 'APPROVED' ? 'IN_PROGRESS' : 'OPEN',
      updatedAt: new Date(),
    },
  })
}

export async function getOpenCorrectionCount() {
  return db.correctionHandling.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
  })
}

export async function getPendingExecutiveApprovals() {
  return db.correctionHandling.findMany({
    where: {
      requiresExecutiveApproval: true,
      executiveDecision: null,
      executiveTokenUsed: false,
    },
    include: {
      employee: { include: { user: { select: { name: true } } } },
    },
  })
}
