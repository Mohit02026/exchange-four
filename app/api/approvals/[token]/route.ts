import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  return NextResponse.json({})
}

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  return NextResponse.json({})
}
