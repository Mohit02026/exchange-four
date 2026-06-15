import { db } from '@/lib/db'
import type { PerfReviewType, PerfReviewStatus } from '@/lib/generated/prisma/client'

export async function getReviews(filters?: { employeeId?: string; status?: PerfReviewStatus }) {
  return db.performanceReview.findMany({
    where: {
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReview(id: string) {
  return db.performanceReview.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, userId: true, startDate: true } },
    },
  })
}

export async function createReview(data: {
  employeeId: string
  type: PerfReviewType
  dueDate?: string
}) {
  return db.performanceReview.create({
    data: {
      employeeId: data.employeeId,
      type: data.type,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export async function updateReview(
  id: string,
  data: {
    status?: PerfReviewStatus
    ratings?: object
    summary?: string
    goalsSet?: string
    conductedAt?: Date
    conductedById?: string
  },
) {
  return db.performanceReview.update({
    where: { id },
    data,
  })
}

export async function addEmployeeComments(id: string, comments: string) {
  return db.performanceReview.update({
    where: { id },
    data: { employeeComments: comments },
  })
}

export function suggestReviewDates(startDate: Date): { DAY_30: Date; DAY_60: Date; DAY_90: Date } {
  return {
    DAY_30: new Date(startDate.getTime() + 30 * 86400000),
    DAY_60: new Date(startDate.getTime() + 60 * 86400000),
    DAY_90: new Date(startDate.getTime() + 90 * 86400000),
  }
}
