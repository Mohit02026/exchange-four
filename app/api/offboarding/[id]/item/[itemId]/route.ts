import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { completeChecklistItem, uncompleteChecklistItem } from '@/lib/services/offboarding'

const patchSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { itemId } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const item = parsed.data.completed
    ? await completeChecklistItem(itemId, session.user.id, parsed.data.notes)
    : await uncompleteChecklistItem(itemId)

  return NextResponse.json({ item: JSON.parse(JSON.stringify(item)) })
}
