export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getAllHatPacks, getHatPack, upsertHatPack } from '@/lib/services/training'

const upsertSchema = z.object({
  postTitle: z.string().min(1),
  functions: z.array(z.string().min(1)),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const postTitle = searchParams.get('postTitle')

  if (postTitle) {
    const pack = await getHatPack(postTitle)
    return NextResponse.json({ pack })
  }

  const packs = await getAllHatPacks()
  return NextResponse.json({ packs })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const pack = await upsertHatPack(parsed.data.postTitle, parsed.data.functions)
  return NextResponse.json({ pack })
}
