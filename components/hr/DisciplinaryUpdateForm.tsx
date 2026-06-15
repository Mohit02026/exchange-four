'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DisciplinaryUpdateFormProps {
  actionId: string
  currentStatus: string
  currentOutcome: string
  currentAppealOutcome: string
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'EXPUNGED', label: 'Expunged' },
]

export default function DisciplinaryUpdateForm({
  actionId,
  currentStatus,
  currentOutcome,
  currentAppealOutcome,
}: DisciplinaryUpdateFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [appealSaving, setAppealSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appealError, setAppealError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [appealSuccess, setAppealSuccess] = useState(false)

  const [status, setStatus] = useState(currentStatus)
  const [outcome, setOutcome] = useState(currentOutcome)
  const [appealOutcome, setAppealOutcome] = useState(currentAppealOutcome)
  const [appealNotes, setAppealNotes] = useState('')

  async function saveUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/disciplinary/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        outcome: outcome || undefined,
        appealOutcome: appealOutcome || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.formErrors?.[0] ?? 'Failed to update.')
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    router.refresh()
  }

  async function recordAppeal(e: React.FormEvent) {
    e.preventDefault()
    if (!appealNotes.trim()) {
      setAppealError('Appeal notes are required.')
      return
    }
    setAppealSaving(true)
    setAppealError(null)
    setAppealSuccess(false)

    const res = await fetch(`/api/disciplinary/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPEALED', appealNotes }),
    })

    if (!res.ok) {
      const data = await res.json()
      setAppealError(data.error?.formErrors?.[0] ?? 'Failed to record appeal.')
      setAppealSaving(false)
      return
    }

    setAppealSuccess(true)
    setAppealSaving(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Status / outcome update */}
      <form onSubmit={saveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Update Record</h3>

        <div>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Outcome / Notes</label>
          <textarea
            value={outcome}
            onChange={e => setOutcome(e.target.value)}
            rows={3}
            placeholder="Describe outcome or add HR notes…"
            style={textareaStyle}
          />
        </div>

        {currentStatus === 'APPEALED' && (
          <div>
            <label style={labelStyle}>Appeal Outcome</label>
            <textarea
              value={appealOutcome}
              onChange={e => setAppealOutcome(e.target.value)}
              rows={3}
              placeholder="Describe the resolution of the appeal…"
              style={textareaStyle}
            />
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
        {success && <p style={{ color: '#16a34a', fontSize: 13, margin: 0 }}>Saved.</p>}

        <div>
          <button type="submit" disabled={saving} style={btnStyle(saving, '#1a1a1a')}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Record appeal — only show when not already appealed/closed/expunged */}
      {!['APPEALED', 'CLOSED', 'EXPUNGED'].includes(currentStatus) && (
        <form onSubmit={recordAppeal} style={{
          borderTop: '1px solid #e5e7eb', paddingTop: 24,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>Record Appeal</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Recording an appeal will notify Avi by email for review.
          </p>

          <div>
            <label style={labelStyle}>Employee&apos;s appeal statement</label>
            <textarea
              value={appealNotes}
              onChange={e => setAppealNotes(e.target.value)}
              rows={4}
              placeholder="Summarise the employee's grounds for appeal…"
              style={textareaStyle}
            />
          </div>

          {appealError && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{appealError}</p>}
          {appealSuccess && <p style={{ color: '#16a34a', fontSize: 13, margin: 0 }}>Appeal recorded and Avi notified.</p>}

          <div>
            <button type="submit" disabled={appealSaving} style={btnStyle(appealSaving, '#7c3aed')}>
              {appealSaving ? 'Recording…' : 'Record Appeal'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6,
}
const inputBase: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  fontSize: 14, color: '#111', background: '#fff', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = { ...inputBase, resize: 'vertical' }
const selectStyle: React.CSSProperties = { ...inputBase }

function btnStyle(disabled: boolean, color: string): React.CSSProperties {
  return {
    background: disabled ? '#9ca3af' : color,
    color: '#fff', border: 'none', borderRadius: 6,
    padding: '10px 20px', fontWeight: 600, fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
