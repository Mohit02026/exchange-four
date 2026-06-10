'use client'

import { useState } from 'react'
import type { Statistic, StatisticEntry } from '@/lib/generated/prisma/client'
import { computeTrend } from '@/lib/utils/statistics'
import StatCard from './StatCard'
import StatsTrend from './StatsTrend'

type StatWithEntries = Statistic & { entries: StatisticEntry[] }

type Props = {
  employeeId: string
  initialStats: StatWithEntries[]
}

const FREQ_OPTIONS = ['DAILY', 'WEEKLY', 'MONTHLY'] as const

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 13,
  marginTop: 4,
  boxSizing: 'border-box' as const,
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 10, display: 'block' }

export default function StatisticsManager({ employeeId, initialStats }: Props) {
  const [stats, setStats] = useState<StatWithEntries[]>(initialStats)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Assign form state
  const [form, setForm] = useState({
    postTitle: '', name: '', definition: '', unit: '',
    frequency: 'WEEKLY', target: '', seniorResponsible: '', dataSource: '',
  })

  // Entry form state per stat
  const [entryForms, setEntryForms] = useState<Record<string, { value: string; period: string }>>({})

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        postTitle: form.postTitle,
        name: form.name,
        definition: form.definition,
        unit: form.unit,
        frequency: form.frequency,
        ...(form.target ? { target: parseFloat(form.target) } : {}),
        ...(form.seniorResponsible ? { seniorResponsible: form.seniorResponsible } : {}),
        ...(form.dataSource ? { dataSource: form.dataSource } : {}),
      }
      const res = await fetch(`/api/statistics/${employeeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError('Failed to assign statistic'); return }
      const newStat: StatWithEntries = { ...(await res.json()), entries: [] }
      setStats((prev) => [...prev, newStat])
      setForm({ postTitle: '', name: '', definition: '', unit: '', frequency: 'WEEKLY', target: '', seniorResponsible: '', dataSource: '' })
    } finally {
      setBusy(false)
    }
  }

  async function handleEntry(statId: string) {
    const ef = entryForms[statId]
    if (!ef?.value || !ef?.period) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/statistics/${employeeId}/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statisticId: statId, value: parseFloat(ef.value), period: ef.period }),
      })
      if (!res.ok) { setError('Failed to record entry'); return }
      const entry: StatisticEntry = await res.json()
      setStats((prev) => prev.map((s) =>
        s.id === statId
          ? { ...s, entries: [entry, ...s.entries].slice(0, 5) }
          : s
      ))
      setEntryForms((prev) => ({ ...prev, [statId]: { value: '', period: '' } }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Assign form */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 32, background: '#fafafa' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Assign New Statistic</h2>
        <form onSubmit={handleAssign}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Post Title *</label>
              <input style={inputStyle} value={form.postTitle} required onChange={(e) => setForm((f) => ({ ...f, postTitle: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Stat Name *</label>
              <input style={inputStyle} value={form.name} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Definition *</label>
              <input style={inputStyle} value={form.definition} required onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Unit *</label>
              <input style={inputStyle} value={form.unit} required placeholder="e.g. calls, emails, $" onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Frequency *</label>
              <select style={inputStyle} value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                {FREQ_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target (optional)</label>
              <input style={inputStyle} type="number" step="any" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Senior Responsible (optional)</label>
              <input style={inputStyle} value={form.seniorResponsible} onChange={(e) => setForm((f) => ({ ...f, seniorResponsible: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Data Source (optional)</label>
              <input style={inputStyle} value={form.dataSource} onChange={(e) => setForm((f) => ({ ...f, dataSource: e.target.value }))} />
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{error}</p>}
          <button
            type="submit"
            disabled={busy}
            style={{ marginTop: 14, padding: '8px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            {busy ? 'Saving…' : 'Assign Statistic'}
          </button>
        </form>
      </div>

      {/* Stats list */}
      {stats.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>No statistics assigned yet.</p>
      )}
      {stats.map((stat) => {
        const ef = entryForms[stat.id] ?? { value: '', period: '' }
        const trend = computeTrend(stat.entries)
        return (
          <div key={stat.id} style={{ marginBottom: 28, borderBottom: '1px solid #f3f4f6', paddingBottom: 24 }}>
            <StatCard stat={stat} />
            <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
              Trend: <strong style={{ color: trend === 'UP' ? '#10b981' : trend === 'DOWN' ? '#dc2626' : '#9ca3af' }}>{trend}</strong>
            </div>
            <StatsTrend entries={stat.entries} target={stat.target} />

            {/* Record entry inline form */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ ...labelStyle, marginTop: 0 }}>Value</label>
                <input
                  type="number"
                  step="any"
                  style={{ ...inputStyle, width: 100 }}
                  value={ef.value}
                  onChange={(e) => setEntryForms((prev) => ({ ...prev, [stat.id]: { ...ef, value: e.target.value } }))}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginTop: 0 }}>Period</label>
                <input
                  style={{ ...inputStyle, width: 140 }}
                  placeholder="e.g. 2026-W23"
                  value={ef.period}
                  onChange={(e) => setEntryForms((prev) => ({ ...prev, [stat.id]: { ...ef, period: e.target.value } }))}
                />
              </div>
              <button
                onClick={() => handleEntry(stat.id)}
                disabled={busy || !ef.value || !ef.period}
                style={{ padding: '7px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginBottom: 1 }}
              >
                Record
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
