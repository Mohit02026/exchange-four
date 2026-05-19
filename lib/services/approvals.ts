import { db } from '@/lib/db'
import { writeAuditLog } from '@/lib/utils/audit'

export async function getApprovalByToken(token: string) {
  return db.approvalRequest.findUnique({
    where: { token },
    include: {
      application: {
        include: {
          applicant: true,
          position: { select: { title: true } },
          review: { include: { sections: true } },
          csw: true,
          files: true,
        },
      },
      decision: true,
    },
  })
}

export async function recordTokenOpen(token: string, ip: string | null) {
  await writeAuditLog({
    action: 'APPROVAL_LINK_OPENED',
    entityType: 'ApprovalRequest',
    entityId: token,
    metadata: { ip: ip ?? 'unknown' },
  })
}

export async function submitAviDecision(params: {
  token: string
  decision: 'APPROVED' | 'DISAPPROVED'
  reason: string | null
  notes: string | null
  ip: string | null
}): Promise<{ applicationId: string; applicantName: string; reference: string; positionTitle: string | null }> {
  const request = await db.approvalRequest.findUnique({
    where: { token: params.token },
    include: {
      application: {
        include: { applicant: true, position: { select: { title: true } } },
      },
      decision: true,
    },
  })
  if (!request) throw new Error('Invalid token')
  if (request.tokenUsed) throw new Error('This approval link has already been used')
  if (request.tokenExpiry < new Date()) throw new Error('This approval link has expired')
  if (request.decision) throw new Error('A decision has already been recorded')
  if (params.decision === 'DISAPPROVED' && !params.reason?.trim()) {
    throw new Error('Reason is required when disapproving')
  }

  const newStatus = params.decision === 'APPROVED' ? 'EXECUTIVE_APPROVED' : 'EXECUTIVE_DISAPPROVED'

  await db.$transaction([
    db.approvalDecision.create({
      data: {
        approvalRequestId: request.id,
        decision: params.decision,
        reason: params.reason ?? null,
        notes: params.notes ?? null,
      },
    }),
    db.approvalRequest.update({
      where: { id: request.id },
      data: { tokenUsed: true },
    }),
    db.application.update({
      where: { id: request.applicationId },
      data: { status: newStatus },
    }),
  ])

  await writeAuditLog({
    action: `AVI_${params.decision}`,
    entityType: 'Application',
    entityId: request.applicationId,
    metadata: {
      approvalRequestId: request.id,
      hasReason: !!params.reason,
      ip: params.ip ?? 'unknown',
    },
  })

  const app = request.application
  return {
    applicationId: request.applicationId,
    applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
    reference: app.reference,
    positionTitle: app.position?.title ?? null,
  }
}
