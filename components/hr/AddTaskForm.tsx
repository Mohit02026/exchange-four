'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { employeeId: string }

export default function AddTaskForm({ employeeId }: Props) {
  const router = useRouter()
  const [functionName, setFunctionName] = useState('')
  const [policyRef, setPolicyRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!functionName.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/training/${employeeId}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionName: functionName.trim(),
        policyRef: policyRef.trim() || undefined,
      }),
    })

    if (!res.ok) {
      setError('Failed to add task.')
      setLoading(false)
      return
    }

    setFunctionName('')
    setPolicyRef('')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
            Function Name *
          </label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            placeholder="e.g. Answer phone calls"
            required
            style={{
              width: '100%',
              padding: '7px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
            Policy Ref
          </label>
          <input
            type="text"
            value={policyRef}
            onChange={(e) => setPolicyRef(e.target.value)}
            placeholder="e.g. Comms-01"
            style={{
              width: '100%',
              padding: '7px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading || !functionName.trim()}
            style={{
              padding: '7px 16px',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !functionName.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{error}</p>}
    </form>
  )
}
