export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDisciplinaryActions } from '@/lib/services/disciplinary'
import Link from 'next/link'
import type { DisciplinaryStatus } from '@/lib/generated/prisma/client'

const TYPE_COLOR: Record<string, string> = {
  VERBAL_WARNING: '#d97706',
  WRITTEN_WARNING: '#ea580c',
  FINAL_WARNING: '#dc2626',
  PERFORMANCE_IMPROVEMENT_PLAN: '#2563eb',
  SUSPENSION: '#7c3aed',
  TERMINATION: '#7f1d1d',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#d97706',
  ACKNOWLEDGED: '#2563eb',
  APPEALED: '#7c3aed',
  CLOSED: '#16a34a',
  EXPUNGED: '#6b7280',
}

const TYPE_LABEL: Record<string, string> = {
  VERBAL_WARNING: 'Verbal Warning',
  WRITTEN_WARNING: 'Written Warning',
  FINAL_WARNING: 'Final Warning',
  PERFORMANCE_IMPROVEMENT_PLAN: 'PIP',
  SUSPENSION: 'Suspension',
  TERMINATION: 'Termination',
}

const VALID_STATUSES: DisciplinaryStatus[] = ['OPEN', 'ACKNOWLEDGED', 'APPEALED', 'CLOSED', 'EXPUNGED']

export default async function DisciplinaryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { status: rawStatus } = await searchParams
  const statusFilter = VALID_STATUSES.includes(rawStatus as DisciplinaryStatus)
    ? (rawStatus as DisciplinaryStatus)
    : undefined

  const actions = await getDisciplinaryActions(statusFilter ? { status: statusFilter } : undefined)
  const serialized = JSON.parse(JSON.stringify(actions))

  const openCount = (actions as { status: string }[]).filter(
    a => a.status === 'OPEN' || a.status === 'APPEALED'
  ).length

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Disciplinary Actions</h1>
        <Link href="/hr/disciplinary/new" style={{
          background: '#1a1a1a', color: '#fff', padding: '8px 20px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14,
        }}>
          + New Action
        </Link>
      </div>

      {openCount > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '12px 20px', marginBottom: 16, fontSize: 14, color: '#dc2626',
        }}>
          {openCount} open disciplinary action{openCount !== 1 ? 's' : ''} require attention
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['', ...VALID_STATUSES] as const).map(s => (
          <Link
            key={s}
            href={s ? `/hr/disciplinary?status=${s}` : '/hr/disciplinary'}
            style={{
              fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, textDecoration: 'none',
              background: (statusFilter ?? '') === s ? '#1a1a1a' : '#f3f4f6',
              color: (statusFilter ?? '') === s ? '#fff' : '#374151',
            }}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      {serialized.length === 0 ? (
        <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '48px 0' }}>
          No disciplinary actions found.
        </p>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Employee', 'Type', 'Incident Date', 'Status', 'Filed', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serialized.map((a: {
                id: string
                employee: { firstName: string; lastName: string }
                type: string
                status: string
                incidentDate: string
                createdAt: string
              }) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {a.employee.firstName} {a.employee.lastName}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: TYPE_COLOR[a.type] ?? '#6b7280', color: '#fff',
                    }}>
                      {TYPE_LABEL[a.type] ?? a.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(a.incidentDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: (STATUS_COLOR[a.status] ?? '#6b7280') + '22',
                      color: STATUS_COLOR[a.status] ?? '#6b7280',
                      border: `1px solid ${STATUS_COLOR[a.status] ?? '#6b7280'}44`,
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/hr/disciplinary/${a.id}`} style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                      View →
                    </Link>
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
