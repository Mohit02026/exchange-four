'use client'

import { useState } from 'react'
import type { Position } from '@/lib/generated/prisma/client'

type Status = 'DRAFT' | 'OPEN' | 'PAUSED' | 'FILLED' | 'CLOSED'

const STATUS_COLORS: Record<Status, { bg: string; color: string }> = {
  DRAFT:  { bg: '#f3f4f6', color: '#6b7280' },
  OPEN:   { bg: '#dcfce7', color: '#16a34a' },
  PAUSED: { bg: '#fef9c3', color: '#ca8a04' },
  FILLED: { bg: '#dbeafe', color: '#2563eb' },
  CLOSED: { bg: '#fee2e2', color: '#dc2626' },
}

const STATUSES: Status[] = ['DRAFT', 'OPEN', 'PAUSED', 'FILLED', 'CLOSED']

const EMPTY_FORM = {
  title: '',
  status: 'DRAFT' as Status,
  employmentType: '',
  location: '',
  compensationRange: '',
  purpose: '',
  requiredSkills: '',
  valuableFinalProduct: '',
}

export default function PositionsManager({ initial }: { initial: Position[] }) {
  const [positions, setPositions] = useState<Position[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function field(key: keyof typeof EMPTY_FORM) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value })),
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: Position = await res.json()
      setPositions(prev => [created, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: Status) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/positions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: Position = await res.json()
      setPositions(prev => prev.map(p => (p.id === id ? updated : p)))
    } finally {
      setUpdatingId(null)
    }
  }

  const s = (style: React.CSSProperties) => style

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Positions</h1>
        <button
          onClick={() => { setShowForm(true); setError('') }}
          style={s({ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' })}
        >
          + New Position
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={s({ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 24 })}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>New Position</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Title *</span>
                <input
                  required
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  {...field('title')}
                />
              </label>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Initial Status</span>
                <select
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Status }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                </select>
              </label>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Employment Type</span>
                <input
                  placeholder="Full-time, Part-time, Contract…"
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  {...field('employmentType')}
                />
              </label>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Location</span>
                <input
                  placeholder="Mumbai, Remote…"
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  {...field('location')}
                />
              </label>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Compensation Range</span>
                <input
                  placeholder="Competitive, ₹X–₹Y…"
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  {...field('compensationRange')}
                />
              </label>
              <label style={s({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Required Skills</span>
                <input
                  placeholder="Skills or qualifications…"
                  style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13 })}
                  {...field('requiredSkills')}
                />
              </label>
            </div>

            <label style={s({ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 })}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Purpose</span>
              <textarea
                rows={2}
                placeholder="Role purpose and responsibilities…"
                style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13, resize: 'vertical' })}
                {...field('purpose')}
              />
            </label>

            <label style={s({ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 })}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Valuable Final Product</span>
              <textarea
                rows={2}
                placeholder="What does success look like in this role?"
                style={s({ border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px', fontSize: 13, resize: 'vertical' })}
                {...field('valuableFinalProduct')}
              />
            </label>

            {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={s({ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 })}
              >
                {saving ? 'Saving…' : 'Create Position'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                style={s({ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#6b7280' })}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Positions table */}
      <div style={s({ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' })}>
        {positions.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            No positions yet. Create one above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Title', 'Type', 'Location', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const sc = STATUS_COLORS[p.status as Status] ?? { bg: '#f3f4f6', color: '#6b7280' }
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{p.employmentType ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{p.location ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 4, padding: '3px 8px', fontSize: 12, fontWeight: 500 }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        disabled={updatingId === p.id}
                        value={p.status}
                        onChange={e => handleStatusChange(p.id, e.target.value as Status)}
                        style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', fontSize: 12, color: '#374151', cursor: 'pointer' }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
        {positions.length} position{positions.length !== 1 ? 's' : ''}
        {' · '}
        {positions.filter(p => p.status === 'OPEN').length} open
      </div>
    </div>
  )
}
