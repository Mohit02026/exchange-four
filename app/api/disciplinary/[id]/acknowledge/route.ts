import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDisciplinaryAction, acknowledgeByEmployee } from '@/lib/services/disciplinary'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const action = await getDisciplinaryAction(id)
  if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify this action belongs to the authenticated employee
  if (action.employee.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await acknowledgeByEmployee(id)
  return NextResponse.json({ ok: true })
}
