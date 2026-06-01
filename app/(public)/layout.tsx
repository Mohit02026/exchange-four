import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <>
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/positions" className="text-sm font-semibold tracking-tight text-gray-900">
            Exchange Four Personnel Desk
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/positions" className="text-gray-500 hover:text-gray-900 transition-colors">
              Positions
            </Link>
            {session?.user ? (
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/login' })
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1 bg-white">{children}</div>
    </>
  )
}
