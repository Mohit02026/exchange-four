import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{
        width: 220,
        background: '#111',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>
            Exchange Four
          </div>
          <div style={{ fontSize: 13, color: '#ccc' }}>Personnel Desk</div>
        </div>
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {[
            { href: '/hr/dashboard', label: 'Dashboard' },
            { href: '/hr/applications', label: 'Applications' },
            { href: '/hr/positions', label: 'Positions' },
            { href: '/hr/onboarding', label: 'Onboarding' },
            { href: '/hr/training', label: 'Training' },
            { href: '/hr/statistics', label: 'Statistics' },
            { href: '/hr/ethics', label: 'Ethics' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '10px 24px',
                color: '#ccc',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #333' }}>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>{session.user.email}</div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '7px 0',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: 4,
                color: '#888',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main style={{ flex: 1, background: '#f9f9f9', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
