import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HRNav from '@/components/hr/HRNav'

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 228,
          background: 'var(--navy-900)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/hr/dashboard" style={{ textDecoration: 'none' }}>
            {/* Bar mark + 4 */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 10 }}>
              <div style={{ width: 6, height: 10, background: '#5B93C5', borderRadius: '2px 2px 1px 1px', opacity: 0.8 }} />
              <div style={{ width: 6, height: 15, background: '#2E6BAD', borderRadius: '2px 2px 1px 1px', opacity: 0.9 }} />
              <div style={{ width: 6, height: 21, background: '#3B6BC4', borderRadius: '2px 2px 1px 1px' }} />
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-0.06em', marginLeft: 2 }}>
                4
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}>
                Exchange <span style={{ color: 'var(--gold)' }}>Four</span>
              </div>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>
                Personnel Desk
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <HRNav />

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            fontSize: 12,
            color: '#475569',
            marginBottom: 10,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {session.user.email}
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '7px 0',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#475569',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content — graph-paper grid + top navy fade */}
      <main
        style={{
          flex: 1,
          background: 'var(--bg)',
          backgroundImage: [
            'linear-gradient(180deg, rgba(15,30,53,0.07) 0%, transparent 300px)',
            'linear-gradient(rgba(27,58,107,0.13) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(27,58,107,0.13) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: 'auto, 44px 44px, 44px 44px',
          overflowY: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  )
}
