'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Rating = { category: string; score: number; notes: string }

type Review = {
  id: string
  type: string
  status: string
  dueDate: string | null
  conductedAt: string | null
  ratings: Rating[] | null
  summary: string | null
  goalsSet: string | null
  employeeComments: string | null
}

const TYPE_LABELS: Record<string, string> = {
  DAY_30: '30-Day Review',
  DAY_60: '60-Day Review',
  DAY_90: '90-Day Review',
  ANNUAL: 'Annual Review',
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 4 ? '#166534' : score >= 3 ? '#92400e' : '#991b1b'
  const bg = score >= 4 ? '#dcfce7' : score >= 3 ? '#fef3c7' : '#fee2e2'
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color }}>
      {score}/5
    </span>
  )
}

function CommentsForm({ reviewId, existing, onSaved }: { reviewId: string; existing: string | null; onSaved: () => void }) {
  const [text, setText] = useState(existing ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/performance-reviews/${reviewId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: text }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onSaved()
    } catch {
      setError('Failed to save comments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 16 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your thoughts on this review…"
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
      {error && <div style={{ color: '#991b1b', fontSize: 12, marginTop: 4 }}>{error}</div>}
      <button
        type="submit"
        disabled={saving || !text.trim()}
        style={{
          marginTop: 8,
          padding: '7px 18px',
          borderRadius: 6,
          border: 'none',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: saving || !text.trim() ? 'not-allowed' : 'pointer',
          opacity: saving || !text.trim() ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving…' : existing ? 'Update Comments' : 'Submit Comments'}
      </button>
    </form>
  )
}

export default function EmployeeReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/performance-reviews')
      if (res.status === 401) { router.push('/login'); return }
      if (res.status === 403) { router.push('/login'); return }
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as Review[]
      setReviews(data)
    } catch {
      setError('Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading…</div>
  if (error) return <div style={{ padding: 40, color: '#991b1b' }}>{error}</div>

  return (
    <div style={{ padding: '32px 24px', maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
        My Performance Reviews
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
        Your 30 / 60 / 90 day and annual review records
      </p>

      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          No reviews scheduled yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {reviews.map((review) => {
            const ratings = Array.isArray(review.ratings) ? review.ratings : []
            const avg =
              ratings.length > 0
                ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
                : null
            const isCompleted = review.status === 'COMPLETED'

            return (
              <div
                key={review.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                      {TYPE_LABELS[review.type] ?? review.type}
                    </div>
                    {review.dueDate && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        Due {new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: isCompleted ? '#dcfce7' : '#f3f4f6',
                    color: isCompleted ? '#166534' : '#6b7280',
                  }}>
                    {review.status.replace('_', ' ')}
                  </span>
                </div>

                {isCompleted && (
                  <div>
                    {/* Avg score */}
                    {avg && (
                      <div style={{ marginBottom: 16, fontSize: 13, color: '#374151' }}>
                        Overall average: <strong style={{ fontSize: 16 }}>{avg}</strong>/5
                      </div>
                    )}

                    {/* Ratings */}
                    {ratings.length > 0 && (
                      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ratings.map((r) => (
                          <div key={r.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                            <span style={{ fontSize: 13, color: '#374151' }}>{r.category}</span>
                            <ScoreBadge score={r.score} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {review.summary && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Summary</div>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{review.summary}</p>
                      </div>
                    )}

                    {/* Goals */}
                    {review.goalsSet && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Goals Set</div>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{review.goalsSet}</p>
                      </div>
                    )}

                    {/* Employee comments section */}
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                        Your Comments
                      </div>
                      {review.employeeComments ? (
                        <div>
                          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 8px' }}>{review.employeeComments}</p>
                          <CommentsForm reviewId={review.id} existing={review.employeeComments} onSaved={load} />
                        </div>
                      ) : (
                        <CommentsForm reviewId={review.id} existing={null} onSaved={load} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
