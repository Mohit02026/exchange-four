'use client'

import { useState } from 'react'

type Prospect = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  source: string
  status: string
  inviteSentAt: string | null
  position: { title: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: '#6b7280',
  CONTACTED: '#0891b2',
  INVITE_SENT: '#7c3aed',
  APPLIED: '#059669',
  NOT_INTERESTED: '#dc2626',
  ARCHIVED: '#9ca3af',
}

const STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  CONTACTED: 'Contacted',
  INVITE_SENT: 'Invite Sent',
  APPLIED: 'Applied',
  NOT_INTERESTED: 'Not Interested',
  ARCHIVED: 'Archived',
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Referral',
  EVENT: 'Event',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        padding: '2px 10px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: '#94a3b8',
        background: 'rgba(148,163,184,0.08)',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 20,
        padding: '2px 9px',
      }}
    >
      {SOURCE_LABELS[source] ?? source}
    </span>
  )
}

export default function ProspectList({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [inviting, setInviting] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite(id: string) {
    setInviting(id)
    setError(null)
    try {
      const res = await fetch(`/api/prospects/${id}/invite`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to send invite')
        return
      }
      setProspects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'INVITE_SENT', inviteSentAt: new Date().toISOString() }
            : p
        )
      )
    } catch {
      setError('Network error — try again')
    } finally {
      setInviting(null)
    }
  }

  async function handleArchive(id: string) {
    setArchiving(id)
    setError(null)
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        setError('Failed to archive prospect')
        return
      }
      setProspects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Network error — try again')
    } finally {
      setArchiving(null)
    }
  }

  if (prospects.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 32px',
          textAlign: 'center',
          color: '#475569',
          fontSize: 14,
        }}
      >
        No prospects yet. Add one to get started.
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 16px',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {['Name', 'Source', 'Position', 'Status', 'Invite Sent', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: '#475569',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prospects.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom:
                    i < prospects.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLTableRowElement).style.background =
                    'rgba(255,255,255,0.025)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                }}
              >
                <td style={{ padding: '13px 16px' }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.firstName} {p.lastName}
                  </div>
                  {p.email && (
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{p.email}</div>
                  )}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <SourceBadge source={p.source} />
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#94a3b8' }}>
                  {p.position?.title ?? '—'}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <StatusBadge status={p.status} />
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                  {p.inviteSentAt
                    ? new Date(p.inviteSentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {(p.status === 'IDENTIFIED' || p.status === 'CONTACTED') && p.email && (
                      <button
                        onClick={() => handleInvite(p.id)}
                        disabled={inviting === p.id}
                        style={{
                          padding: '5px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: inviting === p.id ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)',
                          border: '1px solid rgba(124,58,237,0.4)',
                          borderRadius: 6,
                          color: '#a78bfa',
                          cursor: inviting === p.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {inviting === p.id ? 'Sending…' : 'Invite'}
                      </button>
                    )}
                    {p.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(p.id)}
                        disabled={archiving === p.id}
                        style={{
                          padding: '5px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6,
                          color: '#475569',
                          cursor: archiving === p.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {archiving === p.id ? '…' : 'Archive'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
