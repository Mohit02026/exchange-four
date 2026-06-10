'use client'

import { useState } from 'react'

interface Question {
  key: string
  label: string
  optional?: boolean
  isRating?: boolean
}

const NEW_HIRE_QUESTIONS: Question[] = [
  { key: 'q1', label: 'How often do you communicate with your senior?' },
  { key: 'q2', label: 'How do those conversations go?' },
  { key: 'q3', label: 'What is the biggest barrier to succeeding at your job?' },
  { key: 'q4', label: 'Is anyone making your work difficult?' },
  { key: 'q5', label: 'What part of your job needs clearing up?' },
  { key: 'q6', label: 'What orders did you not fully understand?' },
  { key: 'q7', label: 'What do you need to be more successful?', optional: true },
  { key: 'q8', label: 'Anything else?', optional: true },
]

const SENIOR_QUESTIONS: Question[] = [
  { key: 'q1', label: "Is anything about this person's space difficult to communicate with?" },
  { key: 'q2', label: 'How clear is their communication?' },
  { key: 'q3', label: 'Do they duplicate orders?' },
  { key: 'q4', label: 'Do they bring problems without solutions?' },
  { key: 'q5', label: 'What would you change?' },
  { key: 'q6', label: 'Rate them 1–10.', isRating: true },
  { key: 'q7', label: 'If below 10, what must be worked on?', optional: true },
]

interface Props {
  type: 'NEW_HIRE' | 'SENIOR'
  weekNumber: number
  employeeId: string
}

export default function SurveyForm({ type, weekNumber }: Props) {
  const questions = type === 'NEW_HIRE' ? NEW_HIRE_QUESTIONS : SENIOR_QUESTIONS
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [ratingScore, setRatingScore] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const body: Record<string, unknown> = {
      type,
      weekNumber,
      q1: answers.q1 ?? '',
      q2: answers.q2 ?? '',
      q3: answers.q3 ?? '',
      q4: answers.q4 ?? '',
      q5: answers.q5 ?? '',
      q6: type === 'SENIOR' ? String(ratingScore) : (answers.q6 ?? ''),
      q7: answers.q7,
      q8: answers.q8,
    }

    if (type === 'SENIOR') {
      body.ratingScore = ratingScore
    }

    const res = await fetch('/api/onboarding/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Survey Submitted</h2>
        <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
          Thank you. Your Week {weekNumber} survey has been recorded.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q) => {
          if (q.isRating) {
            return (
              <div key={q.key}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '6px' }}>
                  {q.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={ratingScore}
                    onChange={(e) => setRatingScore(Number(e.target.value))}
                    required
                    style={{ width: '80px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>1 = poor, 10 = excellent</span>
                </div>
              </div>
            )
          }

          const isOptional = 'optional' in q && q.optional
          return (
            <div key={q.key}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '6px' }}>
                {q.label}
                {isOptional && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '6px' }}>(optional)</span>}
              </label>
              <textarea
                value={answers[q.key] ?? ''}
                onChange={(e) => set(q.key, e.target.value)}
                required={!isOptional}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )
        })}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '12px 24px', background: submitting ? '#6b7280' : '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Submitting…' : 'Submit Survey'}
        </button>
      </div>
    </form>
  )
}
