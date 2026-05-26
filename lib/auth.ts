import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth.config'
import type { Role } from '@/types'

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        }
      },
    }),
  ],

  callbacks: {
    // Auto-create APPLICANT user + Applicant record on first Google sign-in
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existing = await db.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          const parts = (user.name ?? '').trim().split(/\s+/)
          const firstName = parts[0] ?? 'User'
          const lastName = parts.slice(1).join(' ') || '-'
          // Random unusable password — Google users can't sign in with email/password
          const password = await bcrypt.hash(randomBytes(32).toString('hex'), 10)

          await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? '',
              password,
              role: 'APPLICANT',
              applicant: {
                create: {
                  firstName,
                  lastName,
                  correspondenceEmail: user.email,
                },
              },
            },
          })
        }
      }
      return true
    },

    async jwt({ token, user, account }) {
      // Credentials sign-in: user object carries role
      if (user && (user as { role?: string }).role) {
        token.role = (user as { role: string }).role
      }

      // Google sign-in: look up DB record to get real ID + role
      if (account?.provider === 'google' && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.sub = dbUser.id
          token.role = dbUser.role
        }
      }

      return token
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = (token.role ?? 'APPLICANT') as Role
      }
      return session
    },
  },
})
