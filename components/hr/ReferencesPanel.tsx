'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Reference {
  id: string
  refereeName: string
  refereeEmail: string
  relationship: string
  refereeTitle: string | null
  refereeCompany: string | null
  status: string
  rating: number | null
  notes: string | null
  wouldRehire: boolean | null
  requestSentAt: string | null
  completedAt: string | null
}

interface BGCheck {
  status: string
  provider: string | null
  referenceNumber: string | null
  result: string | null
  notes: string | null
}

interface Props {
  applicationId: string
  references: Reference[]
  bgCheck: BGCheck | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#6b7280',
  REQUESTED: '#0891b2',
  COMPLETED: '#059669',
  UNREACHABLE: '#dc2626',
  DECLINED: '#9ca3af',
}

const BG_RESULT_COLORS: Record<string, string> = {
  CLEAR: '#059669',
  CONSIDER: '#d97706',
  FAILED: '#dc2626',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280'
  const label = status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color,
      background: `${color}18`,
      borderRadius: 4,
      padding: '2px 8px',
    }}>
      {label}
    </span>
  )
}

function ReferenceCard({
  ref: r,
  applicationId,
  onUpdate,
}: {
  ref: Reference
  applicationId: string
  onUpdate: (updated: Reference) => void
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendRequest() {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/references/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendRequest: true }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Failed to send request')
        return
      }
      const updated = await res.json() as Reference
      onUpdate(updated)
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${STATUS_COLORS[r.status] ?? '#6b7280'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{r.refereeName}</div>
          {(r.refereeTitle || r.refereeCompany) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {[r.refereeTitle, r.refereeCompany].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.refereeEmail}</div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        <span>Relationship: <strong style={{ color: 'var(--text-secondary)' }}>{r.relationship}</strong></span>
        {r.requestSentAt && (
          <span>Sent: {new Date(r.requestSentAt).toLocaleDateString()}</span>
        )}
        {r.completedAt && (
          <span>Completed: {new Date(r.completedAt).toLocaleDateString()}</span>
        )}
      </div>

      {r.status === 'COMPLETED' && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {r.rating != null && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Rating: </span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>{r.rating}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/5</span>
            </div>
          )}
          {r.wouldRehire != null && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Would rehire: </span>
              <strong style={{ color: r.wouldRehire ? '#059669' : '#dc2626' }}>
                {r.wouldRehire ? 'Yes' : 'No'}
              </strong>
            </div>
          )}
          {r.notes && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {r.notes}
            </div>
          )}
        </div>
      )}

      {r.status === 'PENDING' && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleSendRequest}
            disabled={sending}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: sending ? 'var(--surface-muted)' : 'var(--navy-900)',
              color: sending ? 'var(--text-muted)' : '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Sending…' : 'Send Request'}
          </button>
          {error && <span style={{ marginLeft: 10, fontSize: 12, color: '#dc2626' }}>{error}</span>}
        </div>
      )}
    </div>
  )
}

function AddRefereeForm({
  applicationId,
  onAdded,
}: {
  applicationId: string
  onAdded: (ref: Reference) => void
}) {
  const [open, setOpen] = useState(false)
  const [refereeName, setRefereeName] = useState('')
  const [refereeEmail, setRefereeEmail] = useState('')
  const [relationship, setRelationship] = useState('')
  const [refereeTitle, setRefereeTitle] = useState('')
  const [refereeCompany, setRefereeCompany] = useState('')
  const [sendNow, setSendNow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refereeName: refereeName.trim(),
          refereeEmail: refereeEmail.trim(),
          relationship: relationship.trim(),
          refereeTitle: refereeTitle.trim() || undefined,
          refereeCompany: refereeCompany.trim() || undefined,
          sendRequest: sendNow,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Failed to add referee')
        return
      }
      const created = await res.json() as Reference
      onAdded(created)
      setRefereeName('')
      setRefereeEmail('')
      setRelationship('')
      setRefereeTitle('')
      setRefereeCompany('')
      setSendNow(false)
      setOpen(false)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '7px 16px',
          fontSize: 12,
          fontWeight: 600,
          background: 'transparent',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
        }}
      >
        + Add Referee
      </button>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--surface-muted)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', background: 'var(--surface-raised)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
        Add Referee
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Full Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input value={refereeName} onChange={(e) => setRefereeName(e.target.value)} required style={inputStyle} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Email <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input type="email" value={refereeEmail} onChange={(e) => setRefereeEmail(e.target.value)} required style={inputStyle} placeholder="jane@example.com" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Relationship <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} required style={inputStyle} placeholder="Former Manager" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title</label>
          <input value={refereeTitle} onChange={(e) => setRefereeTitle(e.target.value)} style={inputStyle} placeholder="Director of Operations" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Company</label>
          <input value={refereeCompany} onChange={(e) => setRefereeCompany(e.target.value)} style={inputStyle} placeholder="Acme Corp" />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 12 }}>
        <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
        Send reference request email immediately
      </label>

      {error && (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#dc2626' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '7px 16px', fontSize: 12, fontWeight: 600,
            background: saving ? 'var(--surface-muted)' : 'var(--navy-900)',
            color: saving ? 'var(--text-muted)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Add Referee'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          style={{
            padding: '7px 16px', fontSize: 12, fontWeight: 600,
            background: 'transparent', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function BGCheckSection({
  applicationId,
  initial,
}: {
  applicationId: string
  initial: BGCheck | null
}) {
  const router = useRouter()
  const [bgCheck, setBGCheck] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(initial?.status ?? 'NOT_STARTED')
  const [provider, setProvider] = useState(initial?.provider ?? '')
  const [referenceNumber, setReferenceNumber] = useState(initial?.referenceNumber ?? '')
  const [result, setResult] = useState(initial?.result ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          provider: provider || undefined,
          referenceNumber: referenceNumber || undefined,
          result: result || null,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Save failed')
        return
      }
      const updated = await res.json() as BGCheck
      setBGCheck(updated)
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--surface-muted)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  }

  const currentStatus = bgCheck?.status ?? 'NOT_STARTED'
  const currentResult = bgCheck?.result ?? null

  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${currentResult ? (BG_RESULT_COLORS[currentResult] ?? 'var(--border)') : 'var(--border-strong)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Background Check
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600,
            background: 'transparent', color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {!editing ? (
        <dl style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <dt style={{ color: 'var(--text-muted)', width: 120, flexShrink: 0 }}>Status:</dt>
            <dd style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentStatus.replace(/_/g, ' ')}
              </span>
            </dd>
          </div>
          {bgCheck?.result && (
            <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <dt style={{ color: 'var(--text-muted)', width: 120, flexShrink: 0 }}>Result:</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: BG_RESULT_COLORS[bgCheck.result] ?? '#6b7280' }}>
                {bgCheck.result}
              </dd>
            </div>
          )}
          {bgCheck?.provider && (
            <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <dt style={{ color: 'var(--text-muted)', width: 120, flexShrink: 0 }}>Provider:</dt>
              <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{bgCheck.provider}</dd>
            </div>
          )}
          {bgCheck?.referenceNumber && (
            <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <dt style={{ color: 'var(--text-muted)', width: 120, flexShrink: 0 }}>Ref #:</dt>
              <dd style={{ margin: 0, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bgCheck.referenceNumber}</dd>
            </div>
          )}
          {bgCheck?.notes && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              {bgCheck.notes}
            </div>
          )}
          {!bgCheck && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>No background check recorded yet.</p>
          )}
        </dl>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Result</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="">— None —</option>
                <option value="CLEAR">Clear</option>
                <option value="CONSIDER">Consider</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Provider</label>
              <input value={provider} onChange={(e) => setProvider(e.target.value)} style={inputStyle} placeholder="e.g. Checkr, Sterling" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Reference #</label>
              <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} style={inputStyle} placeholder="Provider reference number" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Any additional notes…"
            />
          </div>
          {error && <p style={{ margin: 0, fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '7px 16px', fontSize: 12, fontWeight: 600,
                background: saving ? 'var(--surface-muted)' : 'var(--navy-900)',
                color: saving ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              style={{
                padding: '7px 16px', fontSize: 12, fontWeight: 600,
                background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReferencesPanel({ applicationId, references: initial, bgCheck }: Props) {
  const [references, setReferences] = useState(initial)

  function handleUpdate(updated: Reference) {
    setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  function handleAdded(ref: Reference) {
    setReferences((prev) => [...prev, ref])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Reference Checks */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: 14,
        }}>
          Reference Checks
          <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
            ({references.length} referee{references.length !== 1 ? 's' : ''})
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {references.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              No referees added yet.
            </p>
          )}
          {references.map((ref) => (
            <ReferenceCard
              key={ref.id}
              ref={ref}
              applicationId={applicationId}
              onUpdate={handleUpdate}
            />
          ))}
          <div style={{ marginTop: 4 }}>
            <AddRefereeForm applicationId={applicationId} onAdded={handleAdded} />
          </div>
        </div>
      </div>

      {/* Background Check */}
      <BGCheckSection applicationId={applicationId} initial={bgCheck} />
    </div>
  )
}
