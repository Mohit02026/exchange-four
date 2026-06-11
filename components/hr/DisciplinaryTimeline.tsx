interface Correction {
  id: string
  severity: string
  action: string | null
  status: string
  incident: string
  correctionRequested: string
  resolution: string | null
  followUpDate: string | null
  requiresExecutiveApproval: boolean
  executiveDecision: string | null
  createdAt: string
  submittedBy: { name: string | null; email: string }
}

interface DisciplinaryTimelineProps {
  corrections: Correction[]
}

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

const ACTION_LABEL: Record<string, string> = {
  TRAINING_ONLY: 'Training only',
  VERBAL_WARNING: 'Verbal warning',
  WRITTEN_WARNING: 'Written warning',
  FINAL_WARNING: 'Final written warning',
  SUSPENSION: 'Suspension',
  TERMINATION_RECOMMENDATION: 'Termination recommendation',
  TRANSFER_DEMOTION_PROMOTION: 'Transfer / demotion / promotion',
}

export default function DisciplinaryTimeline({ corrections }: DisciplinaryTimelineProps) {
  if (corrections.length === 0) {
    return <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No corrections on record.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {corrections.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: SEVERITY_COLOR[c.severity] ?? '#6b7280',
              border: '2px solid #fff',
              boxShadow: `0 0 0 2px ${SEVERITY_COLOR[c.severity] ?? '#6b7280'}`,
              marginTop: 4,
            }} />
            {i < corrections.length - 1 && (
              <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 32 }} />
            )}
          </div>

          {/* Card */}
          <div style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: SEVERITY_COLOR[c.severity] ?? '#6b7280', color: '#fff',
                }}>
                  {c.severity}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: (STATUS_COLOR[c.status] ?? '#6b7280') + '22',
                  color: STATUS_COLOR[c.status] ?? '#6b7280',
                  border: `1px solid ${STATUS_COLOR[c.status] ?? '#6b7280'}44`,
                }}>
                  {c.status.replace('_', ' ')}
                </span>
                {c.action && (
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{ACTION_LABEL[c.action] ?? c.action}</span>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {new Date(c.createdAt).toLocaleDateString()} · {c.submittedBy.name ?? c.submittedBy.email}
              </span>
            </div>

            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 6px' }}>{c.incident}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px' }}>
              <strong>Correction requested:</strong> {c.correctionRequested}
            </p>

            {c.requiresExecutiveApproval && (
              <p style={{ fontSize: 12, color: c.executiveDecision === 'APPROVED' ? '#16a34a' : c.executiveDecision === 'REJECTED' ? '#dc2626' : '#b45309', margin: '6px 0 0' }}>
                {c.executiveDecision
                  ? `Exec: ${c.executiveDecision}`
                  : '⏳ Awaiting executive approval'}
              </p>
            )}

            {c.resolution && (
              <p style={{ fontSize: 12, color: '#16a34a', margin: '6px 0 0' }}>
                <strong>Resolved:</strong> {c.resolution}
              </p>
            )}

            <a
              href={`/hr/corrections/${c.id}`}
              style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}
            >
              View details →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
