'use client'

import { useState } from 'react'

const QUESTIONS = [
  { key: 'completedToday', label: 'What did you complete today?' },
  { key: 'studiedToday', label: 'What did you study today?' },
  { key: 'productProduced', label: 'What product did you produce?' },
  { key: 'whatWasUnclear', label: 'What was unclear?' },
  { key: 'anyBlocks', label: 'Any blocks?' },
  { key: 'needsHelp', label: 'Do you need help from Nicola, your senior, or training?' },
] as const

type FormData = Record<typeof QUESTIONS[number]['key'], string>

const empty: FormData = {
  completedToday: '',
  studiedToday: '',
  productProduced: '',
  whatWasUnclear: '',
  anyBlocks: '',
  needsHelp: '',
}

export default function CheckinForm() {
  const [form, setForm] = useState<FormData>(empty)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    const res = await fetch('/api/onboarding/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setStatus('done')
      setForm(empty)
    } else {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
        <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>Check-in submitted</div>
        <div style={{ fontSize: '14px', color: '#166534' }}>Nicola has been notified. See you tomorrow!</div>
        <button
          onClick={() => setStatus('idle')}
          style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {QUESTIONS.map(({ key, label }) => (
        <div key={key}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            {label}
          </label>
          <textarea
            value={form[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            required
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}

      {status === 'error' && (
        <div style={{ fontSize: '14px', color: '#dc2626' }}>Something went wrong. Please try again.</div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          padding: '10px 24px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: status === 'submitting' ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Check-In'}
      </button>
    </form>
  )
}
