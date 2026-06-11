'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EthicsReportFormProps {
  employees: { id: string; firstName: string; lastName: string }[]
  applicants: { id: string; firstName: string; lastName: string }[]
}

const CATEGORIES = [
  'Conduct',
  'Policy Violation',
  'Harassment',
  'Sensitive Matter',
  'Financial Misconduct',
  'Safety',
  'Other',
]

export default function EthicsReportForm({ employees, applicants }: EthicsReportFormProps) {
  const router = useRouter()
  const [subjectType, setSubjectType] = useState<'EMPLOYEE' | 'APPLICANT'>('EMPLOYEE')
  const [subjectId, setSubjectId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [witnesses, setWitnesses] = useState('')
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'SENSITIVE'>('LOW')
  const [isSensitive, setIsSensitive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subjects = subjectType === 'EMPLOYEE' ? employees : applicants

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId) { setError('Select a subject.'); return }
    if (!category) { setError('Select a category.'); return }

    setSubmitting(true)
    setError(null)

    const body = {
      subjectType,
      subjectEmployeeId: subjectType === 'EMPLOYEE' ? subjectId : undefined,
      subjectApplicantId: subjectType === 'APPLICANT' ? subjectId : undefined,
      category,
      description,
      evidenceUrl: evidenceUrl || undefined,
      witnesses: witnesses || undefined,
      severity,
      isSensitive: isSensitive || severity === 'SENSITIVE',
    }

    const res = await fetch('/api/ethics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error?.formErrors?.[0] ?? 'Failed to file report.')
      return
    }

    router.push('/hr/ethics')
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

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Subject type toggle */}
      <div>
        <label style={labelStyle}>Subject Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['EMPLOYEE', 'APPLICANT'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setSubjectType(t); setSubjectId('') }}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                borderColor: subjectType === t ? '#2563eb' : '#d1d5db',
                background: subjectType === t ? '#eff6ff' : '#fff',
                color: subjectType === t ? '#2563eb' : '#6b7280',
              }}
            >
              {t === 'EMPLOYEE' ? 'Employee' : 'Applicant'}
            </button>
          ))}
        </div>
      </div>

      {/* Subject select */}
      <div>
        <label style={labelStyle}>Subject *</label>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required style={inputStyle}>
          <option value="">Select {subjectType === 'EMPLOYEE' ? 'employee' : 'applicant'}…</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label style={labelStyle}>Category *</label>
        <select value={category} onChange={e => setCategory(e.target.value)} required style={inputStyle}>
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label style={labelStyle}>Severity *</label>
        <select
          value={severity}
          onChange={e => {
            const v = e.target.value as typeof severity
            setSeverity(v)
            if (v === 'SENSITIVE') setIsSensitive(true)
          }}
          required
          style={inputStyle}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="SENSITIVE">Sensitive (restricted access)</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          minLength={10}
          rows={5}
          placeholder="Describe the incident in detail…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Witnesses */}
      <div>
        <label style={labelStyle}>Witnesses <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
        <input
          type="text"
          value={witnesses}
          onChange={e => setWitnesses(e.target.value)}
          placeholder="Names of any witnesses"
          style={inputStyle}
        />
      </div>

      {/* Evidence URL */}
      <div>
        <label style={labelStyle}>Evidence URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
        <input
          type="url"
          value={evidenceUrl}
          onChange={e => setEvidenceUrl(e.target.value)}
          placeholder="https://drive.google.com/…"
          style={inputStyle}
        />
      </div>

      {/* Sensitive flag */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isSensitive || severity === 'SENSITIVE'}
          onChange={e => setIsSensitive(e.target.checked)}
          disabled={severity === 'SENSITIVE'}
        />
        <span style={{ fontSize: 13, color: '#374151' }}>
          Mark as sensitive (restricted to ethics-access users)
        </span>
      </label>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 24px',
          background: submitting ? '#9ca3af' : '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Filing report…' : 'File Report'}
      </button>
    </form>
  )
}
