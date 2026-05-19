'use client'

type Rating = 'Yes' | 'No' | 'Maybe' | null

type Props = {
  section: string
  rating: Rating
  notes: string
  onChange: (rating: Rating, notes: string) => void
}

const RATINGS: Rating[] = ['Yes', 'Maybe', 'No']

const RATING_COLOR: Record<string, string> = {
  Yes: '#16a34a',
  Maybe: '#d97706',
  No: '#dc2626',
}

export default function ReviewSection({ section, rating, notes, onChange }: Props) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: '#111' }}>{section}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => onChange(rating === r ? null : r, notes)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: `1px solid ${rating === r ? RATING_COLOR[r!] : '#d1d5db'}`,
                background: rating === r ? `${RATING_COLOR[r!]}18` : '#fff',
                color: rating === r ? RATING_COLOR[r!] : '#6b7280',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(rating, e.target.value)}
        placeholder="Notes..."
        rows={2}
        style={{
          width: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          padding: '8px 10px',
          fontSize: 13,
          color: '#374151',
          resize: 'vertical',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
