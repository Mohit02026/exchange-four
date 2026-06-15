export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  getReferencesForApplication,
  createReference,
  sendReferenceRequest,
  getBGCheck,
} from '@/lib/services/references'

const createSchema = z.object({
  refereeName: z.string().min(1),
  refereeEmail: z.string().email(),
  relationship: z.string().min(1),
  refereeTitle: z.string().optional(),
  refereeCompany: z.string().optional(),
  refereePhone: z.string().optional(),
  sendRequest: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const application = await db.application.findUnique({ where: { id }, select: { id: true } })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [references, bgCheck] = await Promise.all([
    getReferencesForApplication(id),
    getBGCheck(id),
  ])

  return NextResponse.json({ references, bgCheck })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const application = await db.application.findUnique({ where: { id }, select: { id: true } })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { sendRequest: shouldSend, ...refData } = parsed.data

  const ref = await createReference({ applicationId: id, ...refData })

  if (shouldSend) {
    await sendReferenceRequest(ref.id).catch(() => null)
  }

  return NextResponse.json(ref, { status: 201 })
}
