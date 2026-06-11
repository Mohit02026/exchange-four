'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface StartOffboardingFormProps {
  employees: Employee[]
  preselectedEmployeeId?: string
}

export default function StartOffboardingForm({ employees, preselectedEmployeeId }: StartOffboardingFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    employeeId: preselectedEmployeeId ?? '',
    reason: 'VOLUNTARY',
    finalDay: '',
  })

  const needsCeo = form.reason === 'TERMINATION' || form.reason === 'TRANSFER'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/offboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: form.employeeId,
        reason: form.reason,
        finalDay: form.finalDay || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.formErrors?.[0] ?? 'Failed to start offboarding.')
      setSaving(false)
      return
    }

    const { case: c } = await res.json()
    router.push(`/hr/offboarding/${c.id}`)
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!preselectedEmployeeId && (
        <div>
          <label style={labelStyle}>Employee *</label>
          <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} required style={selectStyle}>
            <option value="">Select employee…</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label style={labelStyle}>Reason for leaving *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['VOLUNTARY', 'TERMINATION', 'REDUNDANCY', 'TRANSFER'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setForm(f => ({ ...f, reason: r }))}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${form.reason === r ? '#374151' : '#e5e7eb'}`,
                background: form.reason === r ? '#374151' : '#fff',
                color: form.reason === r ? '#fff' : '#374151',
                fontWeight: form.reason === r ? 600 : 400,
              }}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {needsCeo && (
          <p style={{ fontSize: 12, color: '#b45309', marginTop: 6 }}>
            This reason requires CEO approval. An email will be sent to Avi automatically.
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Final day</label>
        <input type="date" value={form.finalDay} onChange={e => setForm(f => ({ ...f, finalDay: e.target.value }))} style={inputStyle} />
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

      <div>
        <button type="submit" disabled={saving} style={{
          background: saving ? '#9ca3af' : '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: 6, padding: '10px 24px',
          fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Starting…' : 'Start Offboarding'}
        </button>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#111', background: '#fff', boxSizing: 'border-box' }
const selectStyle: React.CSSProperties = { ...inputStyle }
