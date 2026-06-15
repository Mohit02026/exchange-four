import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { updateEmployeeDepartment } from '@/lib/services/org'
import { db } from '@/lib/db'

const schema = z.object({
  department: z.string().min(1).max(100),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const employee = await db.employee.findUnique({ where: { id } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await updateEmployeeDepartment(id, parsed.data.department)

  const updated = await db.employee.findUnique({ where: { id } })
  return NextResponse.json(updated)
}
