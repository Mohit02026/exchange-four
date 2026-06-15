import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getOnboardingAlerts } from '@/lib/services/alerts'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const alerts = await getOnboardingAlerts()
  return NextResponse.json({ alerts })
}
