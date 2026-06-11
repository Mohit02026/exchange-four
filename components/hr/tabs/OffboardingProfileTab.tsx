import Link from 'next/link'

interface ChecklistItem {
  id: string
  owner: string
  item: string
  completedAt: string | null
}

interface OffboardingCase {
  id: string
  reason: string
  status: string
  finalDay: string | null
  requiresCeoApproval: boolean
  ceoApproved: boolean | null
  items: ChecklistItem[]
}

interface OffboardingProfileTabProps {
  offboardingCase: OffboardingCase | null
  employeeId: string
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  COMPLETE: '#16a34a',
}

export default function OffboardingProfileTab({ offboardingCase, employeeId }: OffboardingProfileTabProps) {
  if (!offboardingCase) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>No offboarding case open.</p>
        <Link
          href={`/hr/offboarding/new?employeeId=${employeeId}`}
          style={{ fontSize: 13, background: '#1a1a1a', color: '#fff', padding: '8px 18px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
        >
          Start Offboarding
        </Link>
      </div>
    )
  }

  const done = offboardingCase.items.filter(i => i.completedAt).length
  const total = offboardingCase.items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: (STATUS_COLOR[offboardingCase.status] ?? '#6b7280') + '22',
            color: STATUS_COLOR[offboardingCase.status] ?? '#6b7280',
            border: `1px solid ${STATUS_COLOR[offboardingCase.status] ?? '#6b7280'}44`,
          }}>
            {offboardingCase.status.replace('_', ' ')}
          </span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {offboardingCase.reason.charAt(0) + offboardingCase.reason.slice(1).toLowerCase()}
          </span>
          {offboardingCase.finalDay && (
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              · Final day: {new Date(offboardingCase.finalDay).toLocaleDateString()}
            </span>
          )}
        </div>
        <Link href={`/hr/offboarding/${offboardingCase.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
          View full checklist →
        </Link>
      </div>

      {offboardingCase.requiresCeoApproval && (
        <div style={{
          background: offboardingCase.ceoApproved === true ? '#f0fdf4' : offboardingCase.ceoApproved === false ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${offboardingCase.ceoApproved === true ? '#bbf7d0' : offboardingCase.ceoApproved === false ? '#fca5a5' : '#fcd34d'}`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
          color: offboardingCase.ceoApproved === true ? '#16a34a' : offboardingCase.ceoApproved === false ? '#dc2626' : '#b45309',
        }}>
          CEO approval: {offboardingCase.ceoApproved === true ? '✓ Approved' : offboardingCase.ceoApproved === false ? '✗ Rejected' : '⏳ Pending'}
        </div>
      )}

      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
        <span>{done} of {total} items complete</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 9999 }}>
        <div style={{
          height: 6, borderRadius: 9999,
          background: pct === 100 ? '#16a34a' : '#2563eb',
          width: `${pct}%`, transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
}
