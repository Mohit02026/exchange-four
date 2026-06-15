'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

type Provider = 'resend' | 'ghl'

const PROVIDERS: { value: Provider; label: string; description: string; badge: string }[] = [
  {
    value: 'resend',
    label: 'Resend',
    description: 'Transactional email via Resend. Sends to any address directly.',
    badge: 'Active',
  },
  {
    value: 'ghl',
    label: 'GoHighLevel',
    description: 'All emails sent through GHL Conversations API. Applicant contacts are created in GHL on submission.',
    badge: 'CRM',
  },
]

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>('resend')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setProvider(d.emailProvider); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  async function switchProvider(p: Provider) {
    if (saving || p === provider) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailProvider: p }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setProvider(p)
    } catch {
      setError('Could not save setting. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6,
        }}>
          System Configuration
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
      </div>

      {/* Email Provider */}
      <section style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 20,
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Email Provider
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Controls how all outgoing emails are sent — applicant confirmations, interview invites, internal notifications.
          </p>
        </div>

        {!loaded ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {PROVIDERS.map(p => {
              const active = provider === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => switchProvider(p.value)}
                  disabled={saving}
                  style={{
                    flex: '1 1 240px',
                    textAlign: 'left',
                    padding: '16px 20px',
                    border: active ? '2px solid var(--gold)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: active ? 'rgba(201,160,32,0.06)' : 'var(--surface-raised)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving && !active ? 0.6 : 1,
                    transition: 'border-color 150ms ease, background 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.label}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '2px 7px',
                      borderRadius: 4,
                      background: active ? 'var(--gold)' : 'var(--surface-muted)',
                      color: active ? '#fff' : 'var(--text-muted)',
                    }}>
                      {active ? 'Selected' : p.badge}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {p.description}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {saving && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Saving…</p>
        )}
        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>
        )}

        {provider === 'ghl' && loaded && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'rgba(201,160,32,0.08)',
            border: '1px solid rgba(201,160,32,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--gold)' }}>GHL active.</strong> New applicants get a GHL contact created on submission.
            Internal recipients (Nicola, Avi) use <code style={{ fontSize: 11 }}>GHL_NICOLA_CONTACT_ID</code> / <code style={{ fontSize: 11 }}>GHL_AVI_CONTACT_ID</code> from env.
            If a contact ID is missing, the email falls back to Resend automatically.
          </div>
        )}
      </section>
    </div>
  )
}
