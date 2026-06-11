import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateWeeklyReport } from '@/lib/services/reports'
import { sendWeeklyReport } from '@/lib/integrations/email'

// GET — generate and return the report JSON (no email)
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const report = await generateWeeklyReport()
  return NextResponse.json(report)
}

// POST — generate, email to Nicola + Avi, and return the report
// Trigger manually or via Railway cron (Monday mornings)
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const report = await generateWeeklyReport()

  try {
    await sendWeeklyReport({ report })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed'
    return NextResponse.json({ error: message, report }, { status: 500 })
  }

  return NextResponse.json({ sent: true, report })
}
