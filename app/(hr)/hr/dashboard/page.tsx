import { db } from '@/lib/db'

export default async function HRDashboardPage() {
  const [total, submitted, underReview, hired, rejected] = await Promise.all([
    db.application.count(),
    db.application.count({ where: { status: 'SUBMITTED' } }),
    db.application.count({ where: { status: 'UNDER_REVIEW' } }),
    db.application.count({ where: { status: 'HIRED' } }),
    db.application.count({ where: { status: 'REJECTED' } }),
  ])

  const stats = [
    { label: 'Total Applications', value: total, color: '#111' },
    { label: 'New', value: submitted, color: '#2563eb' },
    { label: 'In Review', value: underReview, color: '#d97706' },
    { label: 'Hired', value: hired, color: '#16a34a' },
    { label: 'Rejected', value: rejected, color: '#dc2626' },
  ]

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <h1 style={{ margin: '0 0 32px', fontSize: 24, fontWeight: 700 }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '20px 28px',
            minWidth: 140,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
