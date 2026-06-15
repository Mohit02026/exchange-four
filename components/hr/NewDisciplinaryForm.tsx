'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface NewDisciplinaryFormProps {
  employees: Employee[]
}

const TYPE_OPTIONS = [
  { value: 'VERBAL_WARNING', label: 'Verbal Warning' },
  { value: 'WRITTEN_WARNING', label: 'Written Warning' },
  { value: 'FINAL_WARNING', label: 'Final Warning' },
  { value: 'PERFORMANCE_IMPROVEMENT_PLAN', label: 'Performance Improvement Plan (PIP)' },
  { value: 'SUSPENSION', label: 'Suspension' },
  { value: 'TERMINATION', label: 'Termination' },
]

export default function NewDisciplinaryForm({ employees }: NewDisciplinaryFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    employeeId: '',
    type: 'VERBAL_WARNING',
    incidentDate: '',
    incidentDescription: '',
    actionTaken: '',
    outcome: '',
    witnessName: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/disciplinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        outcome: form.outcome || undefined,
        witnessName: form.witnessName || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.formErrors?.[0] ?? 'Failed to create disciplinary action.')
      setSaving(false)
      return
    }

    router.push('/hr/disciplinary')
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Employee *">
        <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required style={selectStyle}>
          <option value="">Select employee…</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>
          ))}
        </select>
      </Field>

      <Field label="Type *">
        <select value={form.type} onChange={e => set('type', e.target.value)} required style={selectStyle}>
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Incident date *">
        <input
          type="date"
          value={form.incidentDate}
          onChange={e => set('incidentDate', e.target.value)}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Incident description *">
        <textarea
          value={form.incidentDescription}
          onChange={e => set('incidentDescription', e.target.value)}
          required
          rows={5}
          placeholder="Describe the incident in detail…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Action taken *">
        <textarea
          value={form.actionTaken}
          onChange={e => set('actionTaken', e.target.value)}
          required
          rows={3}
          placeholder="What action was taken or will be taken…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Expected outcome">
        <textarea
          value={form.outcome}
          onChange={e => set('outcome', e.target.value)}
          rows={2}
          placeholder="Optional — describe the expected outcome or improvement…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Witness name">
        <input
          value={form.witnessName}
          onChange={e => set('witnessName', e.target.value)}
          placeholder="Optional"
          style={inputStyle}
        />
      </Field>

      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

      <div>
        <button type="submit" disabled={saving} style={{
          background: saving ? '#9ca3af' : '#dc2626',
          color: '#fff', border: 'none', borderRadius: 6,
          padding: '10px 24px', fontWeight: 600, fontSize: 14,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Filing…' : 'File Disciplinary Action'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  fontSize: 14, color: '#111', background: '#fff', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' }
const selectStyle: React.CSSProperties = { ...inputStyle }
