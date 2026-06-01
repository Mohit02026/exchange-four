import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'FILLED', 'CLOSED']).optional(),
  purpose: z.string().optional(),
  valuableFinalProduct: z.string().optional(),
  requiredSkills: z.string().optional(),
  compensationRange: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const position = await db.position.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json(position)
}
