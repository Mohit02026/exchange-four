import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const positions = await db.position.findMany({
    where: { status: 'OPEN' },
    include: { orgBoardUnit: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(positions)
}
