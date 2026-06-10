import { db } from '@/lib/db'
import { TrainingStatus } from '@/lib/generated/prisma/client'

export async function getTrainingPlan(employeeId: string) {
  return db.trainingPlan.findUnique({
    where: { employeeId },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function createTrainingPlan(employeeId: string, postTitle: string) {
  return db.trainingPlan.upsert({
    where: { employeeId },
    create: { employeeId, postTitle },
    update: {},
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function addTrainingTask(
  planId: string,
  data: { functionName: string; policyRef?: string; trainerId?: string }
) {
  return db.trainingTask.create({
    data: {
      planId,
      functionName: data.functionName,
      policyRef: data.policyRef ?? null,
      trainerId: data.trainerId ?? null,
      status: TrainingStatus.IN_PROGRESS,
      dateStarted: new Date(),
    },
  })
}

export async function updateTaskStatus(
  taskId: string,
  status: TrainingStatus,
  notes?: { qualityCheckNotes?: string; correctionNotes?: string }
) {
  return db.trainingTask.update({
    where: { id: taskId },
    data: {
      status,
      datePassed: status === TrainingStatus.PASSED ? new Date() : undefined,
      qualityCheckNotes: notes?.qualityCheckNotes ?? undefined,
      correctionNotes: notes?.correctionNotes ?? undefined,
    },
  })
}

export async function getHatPack(postTitle: string) {
  return db.hatPack.findUnique({ where: { postTitle } })
}

export async function upsertHatPack(postTitle: string, functions: string[]) {
  return db.hatPack.upsert({
    where: { postTitle },
    create: { postTitle, functions },
    update: { functions },
  })
}

export async function getAllTrainingOverview() {
  return db.trainingPlan.findMany({
    include: {
      tasks: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllHatPacks() {
  return db.hatPack.findMany({ orderBy: { postTitle: 'asc' } })
}
