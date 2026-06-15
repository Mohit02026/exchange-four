type PipelineCard = { id: string; status: string }

const ACTIVE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'CSW_GENERATED', 'SENT_TO_AVI', 'EXECUTIVE_APPROVED', 'INTERVIEW_SCHEDULED']

export default function PipelineMetrics({ cards }: { cards: Record<string, PipelineCard[]> }) {
  const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (cards[s]?.length ?? 0), 0)
  const hired = cards['HIRED']?.length ?? 0
  const interviews = cards['INTERVIEW_SCHEDULED']?.length ?? 0
  const awaiting = (cards['SENT_TO_AVI']?.length ?? 0) + (cards['EXECUTIVE_APPROVED']?.length ?? 0)

  const stats = [
    { label: 'Active', value: active, color: '#2563eb' },
    { label: 'In Interview', value: interviews, color: '#7c3aed' },
    { label: 'Awaiting Decision', value: awaiting, color: '#d97706' },
    { label: 'Hired (total)', value: hired, color: '#059669' },
  ]

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            flex: 1,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderTop: `3px solid ${color}`,
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        </div>
      ))}
    </div>
  )
}
