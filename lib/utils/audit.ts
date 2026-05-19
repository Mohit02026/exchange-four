import { db } from '@/lib/db'

interface AuditParams {
  action: string
  entityType: string
  entityId: string
  userId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await db.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId ?? null,
      metadata: params.metadata ?? {},
    },
  })
}
