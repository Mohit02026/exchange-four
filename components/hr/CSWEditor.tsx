'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CSWViewer from './CSWViewer'

type CSWData = {
  id: string
  status: string
  content: string
  sourceFields: Record<string, string>
  missingFields: string[]
  createdAt: string | Date
  application: {
    id: string
    reference: string
    status: string
    applicant: { firstName: string; lastName: string }
    position: { title: string } | null
  }
}

export default function CSWEditor({ csw }: { csw: CSWData }) {
  const router = useRouter()
  const [content, setContent] = useState(csw.content)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(csw.status)

  const applicantName = `${csw.application.applicant.firstName} ${csw.application.applicant.lastName}`
  const position = csw.application.position?.title ?? 'General Application'
  const missingFields = csw.missingFields as string[]
  const isSent = status === 'SENT'

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/csw/${csw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditing(false)
      setMessage('Saved.')
    } catch {
      setMessage('Error saving.')
    } finally {
      setSaving(false)
    }
  }

  async function sendToAvi() {
    if (!confirm('Send this CSW to Avi? This will email a secure approval link.')) return
    setSending(true)
    setMessage('')
    try {
      const res = await fetch(`/api/csw/${csw.id}/send`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Send failed')
      }
      setStatus('SENT')
      setMessage('CSW sent to Avi.')
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error sending.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Completed Staff Work — Hire Proposal</h1>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {applicantName} — {csw.application.reference} — {position}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Missing fields warning */}
      {missingFields.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
        }}>
          <strong style={{ color: '#92400e' }}>Missing data ({missingFields.length} fields):</strong>{' '}
          <span style={{ color: '#78350f' }}>{missingFields.join(', ')}</span>
        </div>
      )}

      {/* Content area */}
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 600,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '16px',
            fontSize: 14,
            lineHeight: 1.8,
            fontFamily: 'Georgia, serif',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <CSWViewer content={content} />
      )}

      {/* Feedback */}
      {message && (
        <div style={{ marginTop: 12, fontSize: 13, color: message.startsWith('Error') ? '#dc2626' : '#16a34a' }}>
          {message}
        </div>
      )}

      {/* Actions */}
      {!isSent && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {editing ? (
            <>
              <Btn onClick={save} disabled={saving} primary>
                {saving ? 'Saving...' : 'Save Changes'}
              </Btn>
              <Btn onClick={() => { setContent(csw.content); setEditing(false) }} disabled={saving}>
                Cancel
              </Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setEditing(true)}>Edit Draft</Btn>
              <Btn onClick={sendToAvi} disabled={sending} primary>
                {sending ? 'Sending...' : 'Send to Avi'}
              </Btn>
            </>
          )}
        </div>
      )}

      {/* Source fields */}
      <details style={{ marginTop: 28 }}>
        <summary style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer', userSelect: 'none' }}>
          Source fields used ({Object.keys(csw.sourceFields as object).length})
        </summary>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(csw.sourceFields as Record<string, string>).map(([k, v]) => (
            <div key={k} style={{ fontSize: 12, display: 'flex', gap: 12 }}>
              <span style={{ color: '#9ca3af', minWidth: 160 }}>{k}</span>
              <span style={{ color: '#374151' }}>{v.length > 80 ? `${v.slice(0, 80)}…` : v}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
    SENT: { bg: '#d1fae5', color: '#065f46', label: 'Sent to Avi' },
  }
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', label: status }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 9999, background: s.bg, color: s.color, letterSpacing: 0.5 }}>
      {s.label}
    </span>
  )
}

function Btn({ children, onClick, disabled, primary }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 18px',
        borderRadius: 5,
        border: 'none',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: primary ? '#111' : '#e5e7eb',
        color: primary ? '#fff' : '#374151',
      }}
    >
      {children}
    </button>
  )
}
