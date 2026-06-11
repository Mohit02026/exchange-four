'use client'

import { useState } from 'react'

export default function SendReportButton() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSend() {
    setState('sending')
    try {
      const res = await fetch('/api/reports/weekly', { method: 'POST' })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  const labels = { idle: 'Send Report Now', sending: 'Sending…', sent: 'Sent ✓', error: 'Failed — retry?' }
  const colors = { idle: '#2563eb', sending: '#6b7280', sent: '#16a34a', error: '#dc2626' }

  return (
    <button
      onClick={handleSend}
      disabled={state === 'sending' || state === 'sent'}
      style={{
        padding: '8px 18px',
        fontSize: 13,
        fontWeight: 600,
        background: colors[state],
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: state === 'sending' || state === 'sent' ? 'default' : 'pointer',
        opacity: state === 'sending' ? 0.7 : 1,
      }}
    >
      {labels[state]}
    </button>
  )
}
