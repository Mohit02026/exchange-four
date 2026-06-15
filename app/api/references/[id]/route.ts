export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { ReferenceStatus } from '@/lib/generated/prisma/client'
import { updateReference, sendReferenceRequest } from '@/lib/services/references'

const patchSchema = z.object({
  status: z.enum(['PENDING', 'REQUESTED', 'COMPLETED', 'UNREACHABLE', 'DECLINED']).optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  wouldRehire: z.boolean().optional(),
  sendRequest: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { sendRequest: shouldSend, status, ...rest } = parsed.data

  let ref = await updateReference(id, {
    ...rest,
    ...(status ? { status: status as ReferenceStatus } : {}),
  })

  if (shouldSend) {
    ref = await sendReferenceRequest(id).catch(() => ref)
  }

  return NextResponse.json(ref)
}
