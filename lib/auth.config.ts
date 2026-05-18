import type { NextAuthConfig } from 'next-auth'

// Edge-safe auth config — no Prisma imports.
// Used in proxy.ts (middleware). Full config with credentials is in auth.ts.
export const authConfig: NextAuthConfig = {
  providers: [],

  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
    authorized({ auth, request }) {
      return !!auth?.user
    },
  },

  pages: {
    signIn: '/login',
  },

  session: { strategy: 'jwt' },
}
