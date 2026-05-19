'use client'

import Link from 'next/link'

type QueueItem = {
  id: string
  reference: string
  status: string
  submittedAt: Date | string
  isGeneralApplication: boolean
  position: { title: string } | null
  applicant: { firstName: string; lastName: string }
  review: { id: string; status: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'In Review',
  CSW_GENERATED: 'CSW Generated',
  SENT_TO_AVI: 'Sent to Avi',
  EXECUTIVE_APPROVED: 'Approved',
  EXECUTIVE_DISAPPROVED: 'Disapproved',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  FUTURE_PROSPECT: 'Future Prospect',
}

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#2563eb',
  UNDER_REVIEW: '#d97706',
  HIRED: '#16a34a',
  REJECTED: '#dc2626',
  FUTURE_PROSPECT: '#7c3aed',
}

export default function ApplicantQueue({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>
        No applications yet.
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
          {['Reference', 'Applicant', 'Position', 'Submitted', 'Status', 'Review'].map((h) => (
            <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}
          >
            <td style={{ padding: '12px 16px' }}>
              <Link href={`/hr/applications/${item.id}`} style={{ color: '#111', fontWeight: 500, textDecoration: 'none', fontFamily: 'monospace', fontSize: 12 }}>
                {item.reference}
              </Link>
            </td>
            <td style={{ padding: '12px 16px' }}>
              {item.applicant.firstName} {item.applicant.lastName}
            </td>
            <td style={{ padding: '12px 16px', color: '#6b7280' }}>
              {item.position?.title ?? 'General Application'}
            </td>
            <td style={{ padding: '12px 16px', color: '#6b7280' }}>
              {new Date(item.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 9999,
                background: `${STATUS_COLOR[item.status] ?? '#6b7280'}18`,
                color: STATUS_COLOR[item.status] ?? '#6b7280',
                letterSpacing: 0.5,
              }}>
                {STATUS_LABEL[item.status] ?? item.status}
              </span>
            </td>
            <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>
              {item.review ? item.review.status : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
