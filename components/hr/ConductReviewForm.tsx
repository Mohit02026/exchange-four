'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Attitude', 'Work Quality', 'Communication', 'Initiative', 'Team Fit']

type Rating = {
  category: string
  score: number
  notes: string
}

type Props = {
  reviewId: string
  initialRatings?: { category: string; score: number; notes: string }[]
  initialSummary?: string
  initialGoals?: string
  currentStatus: string
}

export default function ConductReviewForm({
  reviewId,
  initialRatings,
  initialSummary,
  initialGoals,
  currentStatus,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ratings, setRatings] = useState<Rating[]>(
    CATEGORIES.map((cat) => {
      const existing = initialRatings?.find((r) => r.category === cat)
      return { category: cat, score: existing?.score ?? 0, notes: existing?.notes ?? '' }
    }),
  )
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [goals, setGoals] = useState(initialGoals ?? '')

  function setScore(category: string, score: number) {
    setRatings((prev) => prev.map((r) => (r.category === category ? { ...r, score } : r)))
  }

  function setNotes(category: string, notes: string) {
    setRatings((prev) => prev.map((r) => (r.category === category ? { ...r, notes } : r)))
  }

  const allScored = ratings.every((r) => r.score >= 1)

  async function submit(status: 'IN_PROGRESS' | 'COMPLETED') {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { status }
      if (status === 'COMPLETED') {
        body.ratings = ratings
        body.summary = summary
        body.goalsSet = goals
      }
      const res = await fetch(`/api/performance-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Ratings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
        {ratings.map((r) => (
          <div key={r.category}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 8 }}>
              {r.category}
            </div>

            {/* Score buttons 1-5 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(r.category, n)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    border: r.score === n ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: r.score === n ? '#dbeafe' : '#fff',
                    color: r.score === n ? '#1d4ed8' : '#374151',
                    fontWeight: r.score === n ? 700 : 400,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
              <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', marginLeft: 8 }}>
                {r.score > 0 ? `${r.score}/5` : 'Not rated'}
              </span>
            </div>

            {/* Notes */}
            <textarea
              value={r.notes}
              onChange={(e) => setNotes(r.category, e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 13,
                color: '#374151',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 6 }}>
          Summary
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Overall performance summary…"
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 13,
            color: '#374151',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Goals */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 6 }}>
          Goals Set
        </label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Goals agreed upon for next period…"
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 13,
            color: '#374151',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{ color: '#991b1b', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => submit('IN_PROGRESS')}
          disabled={saving}
          style={{
            padding: '9px 20px',
            borderRadius: 7,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {currentStatus === 'IN_PROGRESS' ? 'Update Draft' : 'Save Draft'}
        </button>

        <button
          type="button"
          onClick={() => submit('COMPLETED')}
          disabled={saving || !allScored}
          title={!allScored ? 'Rate all 5 categories before completing' : undefined}
          style={{
            padding: '9px 20px',
            borderRadius: 7,
            border: 'none',
            background: allScored ? '#1a1a1a' : '#9ca3af',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || !allScored ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          Complete Review
        </button>
      </div>
    </div>
  )
}
