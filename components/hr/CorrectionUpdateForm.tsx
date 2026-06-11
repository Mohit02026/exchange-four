'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CorrectionUpdateFormProps {
  correctionId: string
  currentStatus: string
  currentHrNotes: string
  currentResolution: string
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ESCALATED', label: 'Escalated' },
]

export default function CorrectionUpdateForm({
  correctionId,
  currentStatus,
  currentHrNotes,
  currentResolution,
}: CorrectionUpdateFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    status: currentStatus,
    hrNotes: currentHrNotes ?? '',
    employeeResponse: '',
    resolution: currentResolution ?? '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/corrections/${correctionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: form.status,
        hrNotes: form.hrNotes || undefined,
        employeeResponse: form.employeeResponse || undefined,
        resolution: form.resolution || undefined,
      }),
    })

    if (!res.ok) {
      setError('Failed to update correction.')
      setSaving(false)
      return
    }

    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Status</label>
        <select
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>HR Notes</label>
        <textarea
          value={form.hrNotes}
          onChange={e => setForm(f => ({ ...f, hrNotes: e.target.value }))}
          rows={3}
          placeholder="Internal HR notes…"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Employee Response</label>
        <textarea
          value={form.employeeResponse}
          onChange={e => setForm(f => ({ ...f, employeeResponse: e.target.value }))}
          rows={3}
          placeholder="Employee's response or acknowledgement…"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Resolution</label>
        <textarea
          value={form.resolution}
          onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))}
          rows={3}
          placeholder="How was this resolved…"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

      <button type="submit" disabled={saving} style={{
        background: saving ? '#9ca3af' : '#1a1a1a',
        color: '#fff', border: 'none', borderRadius: 6,
        padding: '10px 24px', fontWeight: 600, fontSize: 14,
        cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start',
      }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
