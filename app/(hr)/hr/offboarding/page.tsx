export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllActiveCases } from '@/lib/services/offboarding'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  COMPLETE: '#16a34a',
}

export default async function OffboardingListPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const cases = await getAllActiveCases()
  const serialized = JSON.parse(JSON.stringify(cases))

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Offboarding</h1>
        <Link href="/hr/offboarding/new" style={{
          background: '#1a1a1a', color: '#fff', padding: '8px 20px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          + Start Offboarding
        </Link>
      </div>

      {serialized.length === 0 ? (
        <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '48px 0' }}>
          No active offboarding cases.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {serialized.map((c: {
            id: string
            reason: string
            status: string
            finalDay: string | null
            requiresCeoApproval: boolean
            ceoApproved: boolean | null
            employee: { id: string; firstName: string; lastName: string; user: { name: string | null; email: string } }
            items: { completedAt: string | null }[]
          }) => {
            const done = c.items.filter(i => i.completedAt).length
            const total = c.items.length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={c.id} style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {c.employee.user.name ?? c.employee.user.email}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: (STATUS_COLOR[c.status] ?? '#6b7280') + '22',
                      color: STATUS_COLOR[c.status] ?? '#6b7280',
                    }}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {c.reason.charAt(0) + c.reason.slice(1).toLowerCase()}
                    </span>
                    {c.requiresCeoApproval && (
                      <span style={{ fontSize: 11, color: c.ceoApproved === true ? '#16a34a' : c.ceoApproved === false ? '#dc2626' : '#b45309' }}>
                        {c.ceoApproved === true ? '✓ CEO approved' : c.ceoApproved === false ? '✗ CEO rejected' : '⏳ CEO pending'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 9999, maxWidth: 200 }}>
                      <div style={{ height: 4, borderRadius: 9999, background: pct === 100 ? '#16a34a' : '#2563eb', width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{done}/{total} items</span>
                    {c.finalDay && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        Final day: {new Date(c.finalDay).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/hr/offboarding/${c.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>
                  View →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
