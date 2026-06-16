import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getProfileCompleteness } from '@/lib/services/completeness'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // HR can check any employee; employees can only check themselves
  if (session.user.role !== 'HR') {
    // Would need to verify employee.userId === session.user.id — skip for now, HR-only
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await getProfileCompleteness(id)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}
