'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Employee = {
  id: string
  firstName: string
  lastName: string
  startDate?: string | null
}

type Props = {
  employees: Employee[]
}

const TYPE_OPTIONS = [
  { value: 'DAY_30', label: '30-Day Review' },
  { value: 'DAY_60', label: '60-Day Review' },
  { value: 'DAY_90', label: '90-Day Review' },
  { value: 'ANNUAL', label: 'Annual Review' },
]

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function suggestDates(startDate: string) {
  const base = new Date(startDate).getTime()
  return {
    DAY_30: formatDateInput(new Date(base + 30 * 86400000)),
    DAY_60: formatDateInput(new Date(base + 60 * 86400000)),
    DAY_90: formatDateInput(new Date(base + 90 * 86400000)),
  }
}

export default function NewReviewForm({ employees }: Props) {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [type, setType] = useState('DAY_30')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedEmployee = employees.find((e) => e.id === employeeId)
  const suggestions =
    selectedEmployee?.startDate ? suggestDates(selectedEmployee.startDate) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/performance-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, type, dueDate: dueDate || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to create review')
      }
      router.push('/hr/reviews')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create review')
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 7,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#374151',
    background: '#fff',
    boxSizing: 'border-box' as const,
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      {/* Employee */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
          Employee
        </label>
        <select
          value={employeeId}
          onChange={(e) => { setEmployeeId(e.target.value); setDueDate('') }}
          required
          style={inputStyle}
        >
          <option value="">Select employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.lastName}, {emp.firstName}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
          Review Type
        </label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Suggested dates from start date */}
      {suggestions && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0c4a6e', marginBottom: 8 }}>
            Suggested dates based on start date
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {Object.entries(suggestions).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setType(key); setDueDate(val) }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid #7dd3fc',
                  background: dueDate === val && type === key ? '#0ea5e9' : '#fff',
                  color: dueDate === val && type === key ? '#fff' : '#0369a1',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {key.replace('DAY_', '')}d — {new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Due date */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
          Due Date <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{ color: '#991b1b', fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => router.push('/hr/reviews')}
          style={{
            padding: '9px 20px',
            borderRadius: 7,
            border: '1px solid #d1d5db',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !employeeId}
          style={{
            padding: '9px 24px',
            borderRadius: 7,
            border: 'none',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting || !employeeId ? 'not-allowed' : 'pointer',
            opacity: submitting || !employeeId ? 0.6 : 1,
          }}
        >
          {submitting ? 'Scheduling…' : 'Schedule Review'}
        </button>
      </div>
    </form>
  )
}
