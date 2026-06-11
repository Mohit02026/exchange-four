'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface CorrectionFormProps {
  employees: Employee[]
  currentEmployeeId?: string
  submittedById: string
}

const SEVERITY_OPTIONS = [
  { value: 'MINOR', label: 'Minor', color: '#6b7280' },
  { value: 'MODERATE', label: 'Moderate', color: '#d97706' },
  { value: 'SERIOUS', label: 'Serious', color: '#ea580c' },
  { value: 'CRITICAL', label: 'Critical', color: '#dc2626' },
]

const ACTION_OPTIONS = [
  { value: '', label: '— No action yet —' },
  { value: 'TRAINING_ONLY', label: 'Training only' },
  { value: 'VERBAL_WARNING', label: 'Verbal warning' },
  { value: 'WRITTEN_WARNING', label: 'Written warning' },
  { value: 'FINAL_WARNING', label: 'Final written warning' },
  { value: 'SUSPENSION', label: 'Suspension ⚠ requires exec approval' },
  { value: 'TERMINATION_RECOMMENDATION', label: 'Termination recommendation ⚠ requires exec approval' },
  { value: 'TRANSFER_DEMOTION_PROMOTION', label: 'Transfer / demotion / promotion ⚠ requires exec approval' },
]

const EXEC_REQUIRED = ['SUSPENSION', 'TERMINATION_RECOMMENDATION', 'TRANSFER_DEMOTION_PROMOTION']

export default function CorrectionForm({ employees, currentEmployeeId, submittedById }: CorrectionFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    employeeId: currentEmployeeId ?? '',
    incident: '',
    policyInvolved: '',
    correctionRequested: '',
    trainingAssigned: '',
    severity: 'MINOR',
    action: '',
    followUpDate: '',
  })

  const needsExec = EXEC_REQUIRED.includes(form.action)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        submittedById,
        action: form.action || undefined,
        followUpDate: form.followUpDate || undefined,
        policyInvolved: form.policyInvolved || undefined,
        trainingAssigned: form.trainingAssigned || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.formErrors?.[0] ?? 'Failed to file correction.')
      setSaving(false)
      return
    }

    const { correction } = await res.json()
    router.push(`/hr/corrections/${correction.id}`)
  }

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!currentEmployeeId && (
        <Field label="Employee *">
          <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required style={selectStyle}>
            <option value="">Select employee…</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Severity *">
        <div style={{ display: 'flex', gap: 8 }}>
          {SEVERITY_OPTIONS.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('severity', s.value)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: `1px solid ${form.severity === s.value ? s.color : '#e5e7eb'}`,
                background: form.severity === s.value ? s.color : '#fff',
                color: form.severity === s.value ? '#fff' : '#374151',
                fontWeight: form.severity === s.value ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Incident description *">
        <textarea
          value={form.incident}
          onChange={e => set('incident', e.target.value)}
          required
          rows={5}
          placeholder="Describe what happened…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Policy / standard / statistic involved">
        <input value={form.policyInvolved} onChange={e => set('policyInvolved', e.target.value)} style={inputStyle} placeholder="e.g. HR Policy 3.2, Weekly Stats" />
      </Field>

      <Field label="Correction requested *">
        <textarea
          value={form.correctionRequested}
          onChange={e => set('correctionRequested', e.target.value)}
          required
          rows={3}
          placeholder="What needs to change…"
          style={textareaStyle}
        />
      </Field>

      <Field label="Action">
        <select value={form.action} onChange={e => set('action', e.target.value)} style={selectStyle}>
          {ACTION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {needsExec && (
          <p style={{ fontSize: 12, color: '#b45309', marginTop: 6 }}>
            This action requires executive approval. An email will be sent to Avi automatically.
          </p>
        )}
      </Field>

      <Field label="Training assigned">
        <input value={form.trainingAssigned} onChange={e => set('trainingAssigned', e.target.value)} style={inputStyle} placeholder="Specific training or hat pack…" />
      </Field>

      <Field label="Follow-up date">
        <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} style={inputStyle} />
      </Field>

      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

      <div>
        <button type="submit" disabled={saving} style={{
          background: saving ? '#9ca3af' : '#1a1a1a',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 14,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Filing…' : 'File Correction'}
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
