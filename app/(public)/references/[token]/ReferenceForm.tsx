'use client'

import { useState } from 'react'

interface Props {
  token: string
  refereeName: string
  applicantName: string
  positionTitle: string
}

export default function ReferenceForm({ token, refereeName, applicantName, positionTitle }: Props) {
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [wouldRehire, setWouldRehire] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating < 1 || rating > 5) {
      setError('Please select a rating from 1 to 5.')
      return
    }
    if (notes.trim().length < 10) {
      setError('Notes must be at least 10 characters.')
      return
    }
    if (wouldRehire === null) {
      setError('Please indicate whether you would rehire this candidate.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/references/form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, notes: notes.trim(), wouldRehire }),
      })

      if (res.status === 409) {
        setError('This reference has already been submitted.')
        return
      }
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Submission failed. Please try again.')
        return
      }

      setDone(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Thank you, {refereeName}</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Your reference has been submitted. We appreciate your time.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 18px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Reference for <strong style={{ color: '#1a1a1a' }}>{applicantName}</strong>
          {positionTitle && <> — {positionTitle}</>}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          Submitted by <strong style={{ color: '#1a1a1a' }}>{refereeName}</strong>
        </p>
      </div>

      {/* Rating */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Overall Rating <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: rating === n ? '2px solid #1B3A6B' : '1px solid #d1d5db',
                background: rating === n ? '#1B3A6B' : '#fff',
                color: rating === n ? '#fff' : '#374151',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
          <span style={{ alignSelf: 'center', fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>
            {rating === 0 ? 'Select 1–5' : rating === 1 ? 'Poor' : rating === 2 ? 'Below average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Reference Notes <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
          Please describe your experience working with this candidate, their strengths, and areas for development.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Share your experience with this candidate…"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            resize: 'vertical',
            fontFamily: 'inherit',
            color: '#1a1a1a',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: notes.length < 10 ? '#9ca3af' : '#6b7280', textAlign: 'right' }}>
          {notes.trim().length} chars {notes.trim().length < 10 ? `(${10 - notes.trim().length} more needed)` : ''}
        </p>
      </div>

      {/* Would rehire */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Would you hire or work with this person again? <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          {([true, false] as const).map((val) => (
            <label
              key={String(val)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                border: wouldRehire === val ? '2px solid #1B3A6B' : '1px solid #d1d5db',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: wouldRehire === val ? '#1B3A6B' : '#374151',
                background: wouldRehire === val ? '#eff6ff' : '#fff',
              }}
            >
              <input
                type="radio"
                name="wouldRehire"
                checked={wouldRehire === val}
                onChange={() => setWouldRehire(val)}
                style={{ display: 'none' }}
              />
              {val ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 700,
          background: submitting ? '#9ca3af' : '#1B3A6B',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit Reference'}
      </button>
    </form>
  )
}
