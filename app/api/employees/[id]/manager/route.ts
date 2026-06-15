import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { updateEmployeeManager } from '@/lib/services/org'
import { db } from '@/lib/db'

const schema = z.object({
  managerId: z.string().nullable(),
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

  // Guard against circular manager assignment
  if (parsed.data.managerId === id) {
    return NextResponse.json({ error: 'Employee cannot be their own manager' }, { status: 400 })
  }

  await updateEmployeeManager(id, parsed.data.managerId)

  const updated = await db.employee.findUnique({ where: { id } })
  return NextResponse.json(updated)
}
