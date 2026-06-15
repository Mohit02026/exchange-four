import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <>
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/positions"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
              }}
            >
              Exchange{' '}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--gold-dark)',
              }}
            >
              Four
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--text-muted)',
                marginLeft: 8,
              }}
            >
              Personnel Desk
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/positions"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                transition: 'color var(--duration-fast) var(--ease-out)',
              }}
            >
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
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                >
                  Sign Out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-inverse)',
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 14px',
                  textDecoration: 'none',
                  transition: 'background var(--duration-fast) var(--ease-out)',
                }}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div style={{ flex: 1 }}>{children}</div>
    </>
  )
}
