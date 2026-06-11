export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllCorrections, getOpenCorrectionCount, getPendingExecutiveApprovals } from '@/lib/services/corrections'
import Link from 'next/link'

const SEVERITY_COLOR: Record<string, string> = {
  MINOR: '#6b7280',
  MODERATE: '#d97706',
  SERIOUS: '#ea580c',
  CRITICAL: '#dc2626',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  RESOLVED: '#16a34a',
  ESCALATED: '#dc2626',
}

export default async function CorrectionsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const [corrections, openCount, pendingExec] = await Promise.all([
    getAllCorrections(),
    getOpenCorrectionCount(),
    getPendingExecutiveApprovals(),
  ])

  const serialized = JSON.parse(JSON.stringify(corrections))

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Corrections</h1>
        <Link href="/hr/corrections/new" style={{
          background: '#1a1a1a', color: '#fff', padding: '8px 20px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          + File Correction
        </Link>
      </div>

      {/* Alert banners */}
      {openCount > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8,
          padding: '12px 20px', marginBottom: 16, fontSize: 14, color: '#b45309',
        }}>
          ⚠ {openCount} open correction{openCount !== 1 ? 's' : ''} require attention
        </div>
      )}

      {pendingExec.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '12px 20px', marginBottom: 20, fontSize: 14, color: '#dc2626',
        }}>
          🔴 {pendingExec.length} correction{pendingExec.length !== 1 ? 's' : ''} awaiting executive approval:{' '}
          {pendingExec.map(c => c.employee.user.name).join(', ')}
        </div>
      )}

      {/* Table */}
      {serialized.length === 0 ? (
        <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '48px 0' }}>No corrections filed yet.</p>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Employee', 'Severity', 'Action', 'Status', 'Filed', 'Follow-up', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serialized.map((c: {
                id: string
                employee: { user: { name: string | null; email: string } }
                severity: string
                action: string | null
                status: string
                createdAt: string
                followUpDate: string | null
              }) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {c.employee.user.name ?? c.employee.user.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: SEVERITY_COLOR[c.severity] ?? '#6b7280', color: '#fff',
                    }}>{c.severity}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
                    {c.action ? c.action.replace(/_/g, ' ').toLowerCase() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: (STATUS_COLOR[c.status] ?? '#6b7280') + '22',
                      color: STATUS_COLOR[c.status] ?? '#6b7280',
                    }}>{c.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/hr/corrections/${c.id}`} style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
