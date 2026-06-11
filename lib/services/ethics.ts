import { db } from '@/lib/db'
import { sendEthicsThresholdAlert } from '@/lib/integrations/email'

const THRESHOLD = 5

export async function createReport(params: {
  reporterId: string
  subjectEmployeeId?: string
  subjectApplicantId?: string
  subjectType: 'EMPLOYEE' | 'APPLICANT'
  category: string
  description: string
  evidenceUrl?: string
  witnesses?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SENSITIVE'
  isSensitive: boolean
}) {
  const report = await db.ethicsReport.create({ data: params })

  // Check threshold — count reports for this subject
  const countWhere = params.subjectType === 'EMPLOYEE'
    ? { subjectEmployeeId: params.subjectEmployeeId }
    : { subjectApplicantId: params.subjectApplicantId }

  const count = await db.ethicsReport.count({ where: countWhere })

  if (count >= THRESHOLD) {
    // Non-fatal — fire and forget
    sendEthicsThresholdAlert({ subjectType: params.subjectType, count }).catch(() => null)
  }

  return report
}

export async function getReportsForSubject(params: {
  subjectEmployeeId?: string
  subjectApplicantId?: string
  hasEthicsAccess: boolean
}) {
  const where = params.subjectEmployeeId
    ? { subjectEmployeeId: params.subjectEmployeeId }
    : { subjectApplicantId: params.subjectApplicantId }

  const reports = await db.ethicsReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { name: true, email: true } },
      assignedHandler: { select: { name: true, email: true } },
    },
  })

  // Filter out sensitive reports unless user has ethics access
  return params.hasEthicsAccess ? reports : reports.filter(r => !r.isSensitive)
}

export async function getAllReports(hasEthicsAccess: boolean) {
  const reports = await db.ethicsReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { name: true, email: true } },
      assignedHandler: { select: { name: true, email: true } },
      subjectEmployee: { select: { firstName: true, lastName: true } },
      subjectApplicant: { select: { firstName: true, lastName: true } },
    },
  })

  return hasEthicsAccess ? reports : reports.filter(r => !r.isSensitive)
}

export async function getReportById(id: string, hasEthicsAccess: boolean) {
  const report = await db.ethicsReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true, email: true } },
      assignedHandler: { select: { name: true, email: true } },
      subjectEmployee: { select: { firstName: true, lastName: true } },
      subjectApplicant: { select: { firstName: true, lastName: true } },
    },
  })

  if (!report) return null
  if (report.isSensitive && !hasEthicsAccess) return null
  return report
}

export async function updateReport(
  id: string,
  hasEthicsAccess: boolean,
  data: {
    status?: 'OPEN' | 'UNDER_INVESTIGATION' | 'CLOSED' | 'FILED'
    triageNotes?: string
    assignedHandlerId?: string
    outcome?: string
    fileDestination?: string
  }
) {
  const existing = await db.ethicsReport.findUnique({ where: { id } })
  if (!existing) return null
  if (existing.isSensitive && !hasEthicsAccess) return null

  return db.ethicsReport.update({ where: { id }, data })
}

export async function getEthicsAlerts() {
  // Returns subjects with 5+ reports
  const employees = await db.ethicsReport.groupBy({
    by: ['subjectEmployeeId'],
    where: { subjectEmployeeId: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gte: THRESHOLD } } },
  })

  const applicants = await db.ethicsReport.groupBy({
    by: ['subjectApplicantId'],
    where: { subjectApplicantId: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gte: THRESHOLD } } },
  })

  return {
    employeeAlerts: employees.map(e => ({ id: e.subjectEmployeeId!, count: e._count.id })),
    applicantAlerts: applicants.map(a => ({ id: a.subjectApplicantId!, count: a._count.id })),
  }
}

export async function getOpenCount() {
  return db.ethicsReport.count({ where: { status: 'OPEN' } })
}
