'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { employeeId: string }

export default function CreatePlanForm({ employeeId }: Props) {
  const router = useRouter()
  const [postTitle, setPostTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!postTitle.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/training/${employeeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postTitle: postTitle.trim() }),
    })

    if (!res.ok) {
      setError('Failed to create training plan.')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <label
          htmlFor="postTitle"
          style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}
        >
          Post Title
        </label>
        <input
          id="postTitle"
          type="text"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          placeholder="e.g. Receptionist"
          required
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !postTitle.trim()}
        style={{
          padding: '8px 18px',
          background: '#111827',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading || !postTitle.trim() ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? 'Creating…' : 'Create Plan'}
      </button>
      {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{error}</p>}
    </form>
  )
}
