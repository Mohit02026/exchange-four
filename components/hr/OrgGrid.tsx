import type { OrgEmployee } from '@/lib/services/org'

type Props = {
  employees: OrgEmployee[]
}

function formatTenure(days: number): string {
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  const years = (days / 365).toFixed(1)
  return `${years}y`
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrgGrid({ employees }: Props) {
  if (employees.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
        No active employees on record.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 14,
        color: 'var(--text-primary)',
      }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-strong)' }}>
            {(['Employee', 'Department', 'Position', 'Start Date', 'Tenure', 'Status'] as const).map((col) => (
              <th key={col} style={{
                padding: '10px 14px',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr
              key={emp.id}
              style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--surface-raised)',
              }}
            >
              {/* Avatar + Name */}
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--navy-800)',
                    color: 'var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}>
                    {initials(emp.firstName, emp.lastName)}
                  </div>
                  <span style={{ fontWeight: 500 }}>
                    {emp.firstName} {emp.lastName}
                  </span>
                </div>
              </td>

              {/* Department */}
              <td style={{ padding: '12px 14px', color: emp.department ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {emp.department ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 9px',
                    borderRadius: 20,
                    background: 'var(--navy-800)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {emp.department}
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unassigned</span>
                )}
              </td>

              {/* Position */}
              <td style={{ padding: '12px 14px', color: emp.positionTitle ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13 }}>
                {emp.positionTitle ?? '—'}
              </td>

              {/* Start Date */}
              <td style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                {formatDate(emp.startDate)}
              </td>

              {/* Tenure */}
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>
                {emp.startDate ? formatTenure(emp.tenureDays) : '—'}
              </td>

              {/* Status */}
              <td style={{ padding: '12px 14px' }}>
                {emp.isOnboarding ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'var(--status-amber-bg)',
                    color: 'var(--status-amber-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #fcd34d',
                  }}>
                    Onboarding
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'var(--status-green-bg)',
                    color: 'var(--status-green-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #86efac',
                  }}>
                    Active
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
