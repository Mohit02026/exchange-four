import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEmployeeByUserId } from '@/lib/services/onboarding'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const employee = await getEmployeeByUserId(session.user.id)
  if (!employee) redirect('/status')

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
      }}>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>
          Exchange Four &mdash; Onboarding
        </span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/onboarding/dashboard" style={{ fontSize: '14px', color: '#374151', textDecoration: 'none' }}>Dashboard</a>
          <a href="/onboarding/tasks" style={{ fontSize: '14px', color: '#374151', textDecoration: 'none' }}>Tasks</a>
          <a href="/onboarding/checkin" style={{ fontSize: '14px', color: '#374151', textDecoration: 'none' }}>Daily Check-In</a>
          <form action={async () => {
            'use server'
            const { signOut } = await import('@/lib/auth')
            await signOut({ redirectTo: '/login' })
          }}>
            <button type="submit" style={{ fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Sign Out
            </button>
          </form>
        </div>
      </nav>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
