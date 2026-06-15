import { db } from '@/lib/db'
import crypto from 'crypto'
import type { DisciplinaryType, DisciplinaryStatus } from '@/lib/generated/prisma/client'

export async function getDisciplinaryActions(filters?: {
  employeeId?: string
  status?: DisciplinaryStatus
  type?: DisciplinaryType
}) {
  return db.disciplinaryAction.findMany({
    where: {
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDisciplinaryAction(id: string) {
  return db.disciplinaryAction.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
    },
  })
}

export async function createDisciplinaryAction(data: {
  employeeId: string
  type: DisciplinaryType
  incidentDate: string
  incidentDescription: string
  actionTaken: string
  outcome?: string
  witnessName?: string
  createdBy: string
}) {
  return db.disciplinaryAction.create({
    data: {
      employeeId: data.employeeId,
      type: data.type,
      incidentDate: new Date(data.incidentDate),
      incidentDescription: data.incidentDescription,
      actionTaken: data.actionTaken,
      outcome: data.outcome,
      witnessName: data.witnessName,
      createdBy: data.createdBy,
    },
  })
}

export async function updateDisciplinaryAction(
  id: string,
  data: {
    status?: DisciplinaryStatus
    outcome?: string
    appealNotes?: string
    appealOutcome?: string
    resolvedAt?: Date
    resolvedBy?: string
  }
) {
  return db.disciplinaryAction.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
      ...(data.appealNotes !== undefined ? { appealNotes: data.appealNotes } : {}),
      ...(data.appealOutcome !== undefined ? { appealOutcome: data.appealOutcome } : {}),
      ...(data.resolvedAt !== undefined ? { resolvedAt: data.resolvedAt } : {}),
      ...(data.resolvedBy !== undefined ? { resolvedBy: data.resolvedBy } : {}),
    },
  })
}

export async function recordAppeal(
  id: string,
  appealNotes: string
): Promise<{ action: Awaited<ReturnType<typeof db.disciplinaryAction.update>>; token: string }> {
  const token = crypto.randomUUID()
  const action = await db.disciplinaryAction.update({
    where: { id },
    data: {
      status: 'APPEALED',
      appealedAt: new Date(),
      appealNotes,
      appealToken: token,
      appealTokenUsed: false,
    },
  })
  return { action, token }
}

export async function acknowledgeByEmployee(id: string): Promise<void> {
  const existing = await db.disciplinaryAction.findUnique({ where: { id }, select: { status: true } })
  await db.disciplinaryAction.update({
    where: { id },
    data: {
      employeeAcknowledged: true,
      employeeAcknowledgedAt: new Date(),
      ...(existing?.status === 'OPEN' ? { status: 'ACKNOWLEDGED' } : {}),
    },
  })
}

export async function getOpenDisciplinaryCount(): Promise<number> {
  return db.disciplinaryAction.count({
    where: { status: { in: ['OPEN', 'APPEALED'] } },
  })
}
