import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAllReports, getEthicsAlerts } from '@/lib/services/ethics'

export const dynamic = 'force-dynamic'

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f0fdf4', text: '#166534' },
  MEDIUM: { bg: '#fffbeb', text: '#92400e' },
  HIGH: { bg: '#fff1f2', text: '#be123c' },
  SENSITIVE: { bg: '#1e1b4b', text: '#e0e7ff' },
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#dc2626',
  UNDER_INVESTIGATION: '#d97706',
  CLOSED: '#6b7280',
  FILED: '#2563eb',
}

export default async function EthicsListPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { ethicsAccess: true },
  })
  const hasEthicsAccess = user?.ethicsAccess ?? false

  const [reports, alerts] = await Promise.all([
    getAllReports(hasEthicsAccess),
    getEthicsAlerts(),
  ])

  const alertCount = alerts.employeeAlerts.length + alerts.applicantAlerts.length

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Ethics Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
            {!hasEthicsAccess && ' (sensitive reports hidden)'}
          </p>
        </div>
        <Link
          href="/hr/ethics/new"
          style={{
            background: '#dc2626',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + File Report
        </Link>
      </div>

      {/* Threshold alert banner */}
      {alertCount > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
            {alertCount} subject{alertCount !== 1 ? 's' : ''} with 5+ ethics reports — immediate review required.
          </span>
        </div>
      )}

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          No ethics reports filed.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => {
            const sev = SEVERITY_COLORS[r.severity] ?? SEVERITY_COLORS.LOW
            const subjectName = r.subjectEmployee
              ? `${r.subjectEmployee.firstName} ${r.subjectEmployee.lastName}`
              : r.subjectApplicant
              ? `${r.subjectApplicant.firstName} ${r.subjectApplicant.lastName}`
              : '—'

            return (
              <div
                key={r.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderLeft: `4px solid ${STATUS_COLORS[r.status] ?? '#e5e7eb'}`,
                  borderRadius: 8,
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{subjectName}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 9999,
                        background: sev.bg,
                        color: sev.text,
                      }}>
                        {r.severity}
                      </span>
                      {r.isSensitive && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: '#1e1b4b', color: '#e0e7ff' }}>
                          SENSITIVE
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                      <strong>{r.category}</strong> — {r.description.length > 120 ? r.description.slice(0, 120) + '…' : r.description}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                      Filed by {r.reporter.name ?? r.reporter.email} · {new Date(r.createdAt).toLocaleDateString()}
                      {r.assignedHandler && ` · Assigned: ${r.assignedHandler.name ?? r.assignedHandler.email}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: STATUS_COLORS[r.status] ?? '#6b7280',
                      letterSpacing: 0.5,
                    }}>
                      {r.status.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/hr/ethics/${r.id}`}
                      style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
