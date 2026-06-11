'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChecklistItem {
  id: string
  owner: string
  item: string
  completedAt: string | null
  completedBy: { name: string | null } | null
  notes: string | null
}

interface OffboardingChecklistProps {
  caseId: string
  items: ChecklistItem[]
}

const OWNER_LABEL: Record<string, string> = {
  HR: 'HR (Nicola)',
  SENIOR: 'Senior / Manager',
  IT: 'IT',
  ADMIN: 'Office Admin',
  TREASURY: 'VP Treasury',
  SECURITY: 'Security / Facilities',
}

const OWNER_COLOR: Record<string, string> = {
  HR: '#2563eb',
  SENIOR: '#7c3aed',
  IT: '#0891b2',
  ADMIN: '#059669',
  TREASURY: '#d97706',
  SECURITY: '#dc2626',
}

export default function OffboardingChecklist({ caseId, items }: OffboardingChecklistProps) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  const owners = Array.from(new Set(items.map(i => i.owner)))

  async function toggle(item: ChecklistItem) {
    setSaving(item.id)
    await fetch(`/api/offboarding/${caseId}/item/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed: !item.completedAt,
        notes: noteInputs[item.id] || undefined,
      }),
    })
    setSaving(null)
    router.refresh()
  }

  const totalDone = items.filter(i => i.completedAt).length

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          <span>{totalDone} of {items.length} items complete</span>
          <span>{Math.round((totalDone / items.length) * 100)}%</span>
        </div>
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 9999 }}>
          <div style={{
            height: 6, borderRadius: 9999,
            background: totalDone === items.length ? '#16a34a' : '#2563eb',
            width: `${Math.round((totalDone / items.length) * 100)}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Items grouped by owner */}
      {owners.map(owner => {
        const ownerItems = items.filter(i => i.owner === owner)
        const ownerDone = ownerItems.filter(i => i.completedAt).length
        return (
          <div key={owner} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                background: (OWNER_COLOR[owner] ?? '#6b7280') + '18',
                color: OWNER_COLOR[owner] ?? '#6b7280',
                border: `1px solid ${OWNER_COLOR[owner] ?? '#6b7280'}30`,
              }}>
                {OWNER_LABEL[owner] ?? owner}
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{ownerDone}/{ownerItems.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ownerItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: item.completedAt ? '#f0fdf4' : '#fff',
                  border: `1px solid ${item.completedAt ? '#bbf7d0' : '#e5e7eb'}`,
                  borderRadius: 8, padding: '10px 14px',
                }}>
                  <button
                    onClick={() => toggle(item)}
                    disabled={saving === item.id}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${item.completedAt ? '#16a34a' : '#d1d5db'}`,
                      background: item.completedAt ? '#16a34a' : '#fff',
                      cursor: saving === item.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {item.completedAt && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: item.completedAt ? '#6b7280' : '#111', textDecoration: item.completedAt ? 'line-through' : 'none' }}>
                      {item.item}
                    </div>
                    {item.completedAt && (
                      <div style={{ fontSize: 12, color: '#16a34a', marginTop: 3 }}>
                        Done {new Date(item.completedAt).toLocaleDateString()}
                        {item.completedBy?.name ? ` · ${item.completedBy.name}` : ''}
                        {item.notes ? ` — ${item.notes}` : ''}
                      </div>
                    )}
                    {!item.completedAt && (
                      <input
                        value={noteInputs[item.id] ?? ''}
                        onChange={e => setNoteInputs(n => ({ ...n, [item.id]: e.target.value }))}
                        placeholder="Add note (optional)…"
                        style={{
                          marginTop: 6, width: '100%', padding: '4px 8px',
                          border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12,
                          color: '#374151', boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
