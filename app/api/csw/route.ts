import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { generateCSWDraft, getCSWByApplicationId } from '@/lib/services/csw'

const schema = z.object({ applicationId: z.string() })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { applicationId } = parsed.data

  try {
    const cswId = await generateCSWDraft(applicationId, session.user.id)
    return NextResponse.json({ id: cswId }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CSW generation failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const csw = await getCSWByApplicationId(applicationId)
  if (!csw) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(csw)
}
