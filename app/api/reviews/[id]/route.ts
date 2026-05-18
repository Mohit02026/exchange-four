import { NextResponse } from 'next/server'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({})
}
