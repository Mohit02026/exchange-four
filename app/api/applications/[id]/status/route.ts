import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { setApplicationStatus } from '@/lib/services/reviews'
import { writeAuditLog } from '@/lib/utils/audit'

const schema = z.object({
  status: z.enum(['UNDER_REVIEW', 'REJECTED', 'FUTURE_PROSPECT']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  await setApplicationStatus(id, parsed.data.status)
  await writeAuditLog({
    action: `STATUS_${parsed.data.status}`,
    entityType: 'Application',
    entityId: id,
    userId: session.user.id,
  })

  return NextResponse.json({ ok: true })
}
