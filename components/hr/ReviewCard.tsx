import Link from 'next/link'

type ReviewWithEmployee = {
  id: string
  type: 'DAY_30' | 'DAY_60' | 'DAY_90' | 'ANNUAL'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate: string | null
  employee: { firstName: string; lastName: string }
}

const TYPE_LABELS: Record<ReviewWithEmployee['type'], string> = {
  DAY_30: '30-DAY',
  DAY_60: '60-DAY',
  DAY_90: '90-DAY',
  ANNUAL: 'ANNUAL',
}

const TYPE_COLORS: Record<ReviewWithEmployee['type'], { bg: string; color: string }> = {
  DAY_30: { bg: '#dbeafe', color: '#1d4ed8' },
  DAY_60: { bg: '#ede9fe', color: '#6d28d9' },
  DAY_90: { bg: '#fef3c7', color: '#92400e' },
  ANNUAL: { bg: '#dcfce7', color: '#166534' },
}

const STATUS_COLORS: Record<ReviewWithEmployee['status'], { bg: string; color: string }> = {
  PENDING: { bg: '#f3f4f6', color: '#6b7280' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8' },
  COMPLETED: { bg: '#dcfce7', color: '#166534' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
}

export default function ReviewCard({ review }: { review: ReviewWithEmployee }) {
  const typeStyle = TYPE_COLORS[review.type]
  const statusStyle = STATUS_COLORS[review.status]

  return (
    <Link
      href={`/hr/reviews/${review.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'box-shadow 0.15s',
        }}
      >
        {/* Type badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: typeStyle.bg,
            color: typeStyle.color,
            flexShrink: 0,
          }}
        >
          {TYPE_LABELS[review.type]}
        </span>

        {/* Employee name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {review.employee.firstName} {review.employee.lastName}
          </div>
          {review.dueDate && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Due {new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: statusStyle.bg,
            color: statusStyle.color,
            flexShrink: 0,
          }}
        >
          {review.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  )
}
