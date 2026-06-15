'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AcknowledgeDisciplinaryButtonProps {
  actionId: string
}

export default function AcknowledgeDisciplinaryButton({ actionId }: AcknowledgeDisciplinaryButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function acknowledge() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/disciplinary/${actionId}/acknowledge`, { method: 'POST' })

    if (!res.ok) {
      setError('Failed to acknowledge. Please try again.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Acknowledged</span>
  }

  return (
    <div>
      <button
        onClick={acknowledge}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#1a1a1a',
          color: '#fff', border: 'none', borderRadius: 6,
          padding: '7px 16px', fontWeight: 600, fontSize: 13,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Acknowledging…' : 'Acknowledge'}
      </button>
      {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
