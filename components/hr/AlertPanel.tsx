import Link from 'next/link'
import type { Alert } from '@/lib/services/alerts'

function formatAlertType(type: Alert['type']): string {
  switch (type) {
    case 'NO_ACKNOWLEDGMENT': return 'No Acknowledgment'
    case 'NO_CHECKIN': return 'No Check-In'
    case 'OVERDUE_TASK': return 'Overdue Task'
    case 'STALLED_TRAINING': return 'Stalled Training'
  }
}

function daysBadgeColor(days: number): { bg: string; color: string } {
  if (days > 7) return { bg: '#fef2f2', color: '#dc2626' }
  if (days > 3) return { bg: '#fffbeb', color: '#92400e' }
  return { bg: 'var(--surface-muted)', color: 'var(--text-muted)' }
}

type Props = { alerts: Alert[] }

export default function AlertPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div style={{
        background: 'rgba(5,150,105,0.06)',
        border: '1px solid rgba(5,150,105,0.2)',
        borderLeft: '3px solid #059669',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        color: '#059669',
        fontWeight: 500,
      }}>
        <span>✓</span>
        <span>All employees on track — no onboarding issues.</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(15,30,53,0.07)',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--surface) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 14, background: '#dc2626', borderRadius: 2 }} />
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: 'var(--text-secondary)',
          }}>
            Needs Attention
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#dc2626',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 9999, padding: '2px 8px',
        }}>
          {alerts.length}
        </span>
      </div>

      {/* Alert rows */}
      <div>
        {alerts.map((alert, i) => {
          const badge = daysBadgeColor(alert.daysSince)
          return (
            <div key={i} style={{
              padding: '12px 20px',
              borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              {/* Type label */}
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                flexShrink: 0, minWidth: 120,
              }}>
                {formatAlertType(alert.type)}
              </div>

              {/* Employee link */}
              <Link href={`/hr/onboarding/${alert.employeeId}`} style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                textDecoration: 'none', flexShrink: 0, minWidth: 140,
              }}>
                {alert.employeeName}
              </Link>

              {/* Detail */}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>
                {alert.detail}
              </span>

              {/* Days badge */}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: badge.bg,
                color: badge.color,
                borderRadius: 9999,
                padding: '2px 10px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {alert.daysSince}d
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
