'use client'

import { useRouter } from 'next/navigation'

type PipelineCard = { id: string; applicantName: string; position: string | null; daysInStage: number; status: string }

const COLUMNS: { key: string; label: string }[] = [
  { key: 'SUBMITTED', label: 'Applied' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'CSW_GENERATED', label: 'CSW In Progress' },
  { key: 'SENT_TO_AVI', label: 'Awaiting Approval' },
  { key: 'EXECUTIVE_APPROVED', label: 'Exec Approved' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { key: 'HIRED', label: 'Hired' },
  { key: '_other', label: 'Other' },
]

const ACTIVE_KEYS = new Set(COLUMNS.map((c) => c.key))

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function KanbanBoard({ cards }: { cards: Record<string, PipelineCard[]> }) {
  const router = useRouter()

  // Collect cards that don't belong to any named column
  const otherKeys = Object.keys(cards).filter((k) => !ACTIVE_KEYS.has(k))
  const otherCards = otherKeys.flatMap((k) => cards[k] ?? [])

  const columnCards = (key: string): PipelineCard[] =>
    key === '_other' ? otherCards : (cards[key] ?? [])

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
        {COLUMNS.map(({ key, label }) => {
          const col = columnCards(key)
          if (col.length === 0 && key === '_other') return null
          return (
            <div
              key={key}
              style={{
                width: 220,
                flexShrink: 0,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: col.length > 0 ? 'rgba(201,160,32,0.15)' : 'var(--surface-muted)',
                  color: col.length > 0 ? 'var(--gold)' : 'var(--text-muted)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {col.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
                {col.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => router.push(`/hr/applications/${card.id}`)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--navy-800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: 'var(--gold)',
                      }}>
                        {initials(card.applicantName)}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {card.applicantName}
                      </span>
                    </div>
                    {card.position && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 34, lineHeight: 1.2 }}>
                        {card.position}
                      </div>
                    )}
                    <div style={{ paddingLeft: 34 }}>
                      <DaysBadge days={card.daysInStage} />
                    </div>
                  </button>
                ))}
                {col.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', opacity: 0.5 }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DaysBadge({ days }: { days: number }) {
  const color = days > 14 ? '#dc2626' : days > 7 ? '#d97706' : '#6b7280'
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, borderRadius: 4, padding: '1px 6px' }}>
      {days}d
    </span>
  )
}
