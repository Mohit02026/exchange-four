import { db } from '@/lib/db'
import { OffboardingReason, OffboardingStatus } from '@/lib/generated/prisma/client'
import { randomUUID } from 'crypto'

const CEO_APPROVAL_REASONS: OffboardingReason[] = ['TERMINATION', 'TRANSFER']

// Default checklist items per owner role
const DEFAULT_CHECKLIST: { owner: 'HR' | 'SENIOR' | 'IT' | 'ADMIN' | 'TREASURY' | 'SECURITY'; item: string }[] = [
  { owner: 'HR', item: 'Final day confirmed with employee' },
  { owner: 'HR', item: 'Employee file reviewed and complete' },
  { owner: 'HR', item: 'Disciplinary / correction records checked' },
  { owner: 'HR', item: 'Exit summary written' },
  { owner: 'HR', item: 'Payroll removal / final pay processed' },
  { owner: 'SENIOR', item: 'Project handover documented' },
  { owner: 'SENIOR', item: 'Client handover documented' },
  { owner: 'SENIOR', item: 'Knowledge transfer completed' },
  { owner: 'IT', item: 'Slack account removed' },
  { owner: 'IT', item: 'Email removed or converted to shared mailbox' },
  { owner: 'IT', item: 'Google Drive access removed' },
  { owner: 'IT', item: 'LastPass / password manager access removed' },
  { owner: 'IT', item: 'All software access removed' },
  { owner: 'ADMIN', item: 'Company property returned' },
  { owner: 'ADMIN', item: 'Keys / fobs returned' },
  { owner: 'TREASURY', item: 'Final expense claims settled' },
  { owner: 'TREASURY', item: 'Benefits / pension notified' },
  { owner: 'SECURITY', item: 'Building access deactivated' },
  { owner: 'SECURITY', item: 'Security clearance revoked (if applicable)' },
]

export async function createOffboardingCase(params: {
  employeeId: string
  reason: OffboardingReason
  finalDay?: Date
  createdById: string
}) {
  const requiresCeo = CEO_APPROVAL_REASONS.includes(params.reason)
  const ceoApprovalToken = requiresCeo ? `EX4-OFFBOARD-${randomUUID()}` : null

  const caseRecord = await db.offboardingCase.create({
    data: {
      employeeId: params.employeeId,
      reason: params.reason,
      finalDay: params.finalDay,
      requiresCeoApproval: requiresCeo,
      ceoApprovalToken,
      status: 'OPEN',
      createdById: params.createdById,
      items: {
        create: DEFAULT_CHECKLIST.map(c => ({ owner: c.owner, item: c.item })),
      },
    },
    include: { items: true, employee: { include: { user: { select: { name: true, email: true } } } } },
  })

  return caseRecord
}

export async function getAllActiveCases() {
  return db.offboardingCase.findMany({
    where: { status: { not: 'COMPLETE' } },
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCaseById(id: string) {
  return db.offboardingCase.findUnique({
    where: { id },
    include: {
      employee: { include: { user: { select: { name: true, email: true } } } },
      items: {
        include: { completedBy: { select: { name: true } } },
        orderBy: [{ owner: 'asc' }, { createdAt: 'asc' }],
      },
      createdBy: { select: { name: true, email: true } },
    },
  })
}

export async function getCaseByEmployeeId(employeeId: string) {
  return db.offboardingCase.findUnique({
    where: { employeeId },
    include: {
      items: {
        include: { completedBy: { select: { name: true } } },
        orderBy: [{ owner: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
}

export async function completeChecklistItem(itemId: string, completedById: string, notes?: string) {
  const item = await db.offboardingChecklistItem.update({
    where: { id: itemId },
    data: { completedAt: new Date(), completedById, notes: notes ?? null },
  })

  // Auto-advance case status based on completion
  const allItems = await db.offboardingChecklistItem.findMany({ where: { caseId: item.caseId } })
  const allDone = allItems.every(i => i.completedAt != null)
  const anyDone = allItems.some(i => i.completedAt != null)

  await db.offboardingCase.update({
    where: { id: item.caseId },
    data: {
      status: allDone ? 'COMPLETE' : anyDone ? 'IN_PROGRESS' : 'OPEN',
      updatedAt: new Date(),
    },
  })

  return item
}

export async function uncompleteChecklistItem(itemId: string) {
  const item = await db.offboardingChecklistItem.update({
    where: { id: itemId },
    data: { completedAt: null, completedById: null, notes: null },
  })

  await db.offboardingCase.update({
    where: { id: item.caseId },
    data: { status: 'IN_PROGRESS', updatedAt: new Date() },
  })

  return item
}

export async function updateCase(
  id: string,
  data: { finalDay?: Date | null; exitSummary?: string; status?: OffboardingStatus }
) {
  return db.offboardingCase.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  })
}

export async function recordCeoDecision(token: string, approved: boolean) {
  const c = await db.offboardingCase.findUnique({ where: { ceoApprovalToken: token } })
  if (!c || c.ceoApprovalTokenUsed) return null

  return db.offboardingCase.update({
    where: { id: c.id },
    data: {
      ceoApproved: approved,
      ceoDecidedAt: new Date(),
      ceoApprovalTokenUsed: true,
      status: approved ? 'IN_PROGRESS' : 'OPEN',
      updatedAt: new Date(),
    },
  })
}

export async function getActiveCaseCount() {
  return db.offboardingCase.count({ where: { status: { not: 'COMPLETE' } } })
}
