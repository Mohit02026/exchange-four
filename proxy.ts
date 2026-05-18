import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const { auth } = NextAuth(authConfig)

export default auth((req: NextAuthRequest) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/hr')) {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url))
    if (session.user.role !== 'HR') return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/approve')) {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url))
    if (session.user.role !== 'EXECUTIVE') return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/onboarding')) {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname === '/apply' || pathname === '/status') {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/hr/:path*', '/approve/:path*', '/onboarding/:path*', '/apply', '/status'],
}
