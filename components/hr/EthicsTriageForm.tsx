'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EthicsTriageFormProps {
  reportId: string
  currentStatus: string
  currentTriageNotes: string
  currentAssignedHandlerId: string
  currentOutcome: string
  hrUsers: { id: string; name: string | null; email: string }[]
}

const STATUSES = ['OPEN', 'UNDER_INVESTIGATION', 'CLOSED', 'FILED'] as const

export default function EthicsTriageForm({
  reportId,
  currentStatus,
  currentTriageNotes,
  currentAssignedHandlerId,
  currentOutcome,
  hrUsers,
}: EthicsTriageFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [triageNotes, setTriageNotes] = useState(currentTriageNotes)
  const [assignedHandlerId, setAssignedHandlerId] = useState(currentAssignedHandlerId)
  const [outcome, setOutcome] = useState(currentOutcome)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch(`/api/ethics/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        triageNotes: triageNotes || undefined,
        assignedHandlerId: assignedHandlerId || undefined,
        outcome: outcome || undefined,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      setError('Failed to update report.')
      return
    }

    setSaved(true)
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    color: '#111',
    background: '#fff',
    boxSizing: 'border-box' as const,
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Assigned Handler</label>
          <select value={assignedHandlerId} onChange={e => setAssignedHandlerId(e.target.value)} style={inputStyle}>
            <option value="">Unassigned</option>
            {hrUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Triage Notes</label>
        <textarea
          value={triageNotes}
          onChange={e => setTriageNotes(e.target.value)}
          rows={3}
          placeholder="Internal notes about this report…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Outcome</label>
        <textarea
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          rows={3}
          placeholder="Resolution or outcome (fill when closing)…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>
      )}

      {saved && (
        <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>Report updated.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '8px 20px',
          background: saving ? '#9ca3af' : '#1d4ed8',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
