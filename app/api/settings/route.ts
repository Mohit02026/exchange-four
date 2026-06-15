import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getEmailProvider, setEmailProvider } from '@/lib/services/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const emailProvider = await getEmailProvider()
  return NextResponse.json({ emailProvider })
}

const schema = z.object({
  emailProvider: z.enum(['resend', 'ghl']),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  await setEmailProvider(parsed.data.emailProvider)
  return NextResponse.json({ emailProvider: parsed.data.emailProvider })
}
