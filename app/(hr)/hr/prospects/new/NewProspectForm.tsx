'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'EVENT', label: 'Event' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const fieldStyle: React.CSSProperties = {
  marginBottom: 20,
}

export default function NewProspectForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [source, setSource] = useState('MANUAL')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          source,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'Failed to create prospect — check your input'
        )
        return
      }

      router.push('/hr/prospects')
    } catch {
      setError('Network error — try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 28px 24px',
      }}
    >
      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>First Name *</label>
          <input
            style={inputStyle}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Jane"
            autoComplete="given-name"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Last Name *</label>
          <input
            style={inputStyle}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Smith"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Email</label>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          autoComplete="email"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Phone</label>
        <input
          style={inputStyle}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          autoComplete="tel"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>LinkedIn URL</label>
        <input
          style={inputStyle}
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/janesmith"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Source</label>
        <select
          style={{ ...inputStyle, appearance: 'none' }}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context about this person…"
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 24px',
            background: submitting ? 'rgba(245,170,40,0.5)' : 'var(--gold)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#0B1929',
            fontSize: 14,
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {submitting ? 'Saving…' : 'Add Prospect'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/hr/prospects')}
          disabled={submitting}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: '#475569',
            fontSize: 14,
            fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
