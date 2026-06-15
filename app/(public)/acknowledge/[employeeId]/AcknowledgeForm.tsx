'use client'

import { useState } from 'react'

const POLICIES = [
  {
    key: 'ndaSigned' as const,
    docType: 'nda',
    title: 'Non-Disclosure Agreement (NDA)',
    description:
      'I confirm that I have read, understood, and signed the Non-Disclosure Agreement. I understand my obligations regarding confidential company information.',
  },
  {
    key: 'contractSigned' as const,
    docType: 'contract',
    title: 'Employment Contract',
    description:
      'I confirm that I have read, understood, and signed my employment contract including terms of employment, compensation, and responsibilities.',
  },
  {
    key: 'policiesRead' as const,
    docType: 'policies',
    title: 'Company Policies & Employee Handbook',
    description:
      'I confirm that I have read and understood all company policies, the code of conduct, and the employee handbook. I agree to abide by them.',
  },
]

type Flags = { ndaSigned: boolean; contractSigned: boolean; policiesRead: boolean }

export default function AcknowledgeForm({
  employeeId,
  initial,
}: {
  employeeId: string
  initial: Flags
}) {
  const [flags, setFlags] = useState<Flags>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const allDone = flags.ndaSigned && flags.contractSigned && flags.policiesRead

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/onboarding/${employeeId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { error?: string }).error ?? 'Failed to save')
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: '0 0 8px' }}>
          Acknowledgment recorded.
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Your HR team has been notified. You can close this page.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {POLICIES.map((policy) => {
          const checked = flags[policy.key]
          return (
            <label
              key={policy.key}
              style={{
                display: 'flex',
                gap: 14,
                padding: '16px 18px',
                border: `1px solid ${checked ? '#16a34a' : '#e5e7eb'}`,
                borderRadius: 8,
                cursor: initial[policy.key] ? 'default' : 'pointer',
                background: checked ? '#f0fdf4' : '#fff',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={initial[policy.key]} // already acknowledged — can't untick
                onChange={(e) => setFlags((f) => ({ ...f, [policy.key]: e.target.checked }))}
                style={{ marginTop: 2, width: 16, height: 16, cursor: initial[policy.key] ? 'default' : 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                    {policy.title}
                  </span>
                  {initial[policy.key] && (
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 400 }}>
                      Already acknowledged
                    </span>
                  )}
                  <a
                    href={`/api/documents/${employeeId}/${policy.docType}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 11,
                      color: '#1e3a5f',
                      textDecoration: 'underline',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ↓ Download PDF
                  </a>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{policy.description}</div>
              </div>
            </label>
          )
        })}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !allDone}
        style={{
          width: '100%',
          padding: '12px 0',
          background: allDone ? '#111' : '#e5e7eb',
          color: allDone ? '#fff' : '#9ca3af',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: saving || !allDone ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Submit Acknowledgment'}
      </button>
      {!allDone && (
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
          Please acknowledge all three documents to continue.
        </p>
      )}
    </div>
  )
}
