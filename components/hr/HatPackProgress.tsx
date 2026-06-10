'use client'

import { useState, useEffect } from 'react'

type TrainingTask = {
  functionName: string
  status: string
}

type HatPack = {
  postTitle: string
  functions: string[]
}

type Props = {
  postTitle: string
  tasks: TrainingTask[]
}

export default function HatPackProgress({ postTitle, tasks }: Props) {
  const [pack, setPack] = useState<HatPack | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/training/hatpack?postTitle=${encodeURIComponent(postTitle)}`)
      .then((r) => r.json())
      .then((data) => {
        setPack(data.pack ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [postTitle])

  if (loading) {
    return <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading hat pack…</p>
  }

  if (!pack) {
    return (
      <p style={{ color: '#9ca3af', fontSize: '13px' }}>
        No hat pack defined for &quot;{postTitle}&quot;. Create one via the Hat Packs section.
      </p>
    )
  }

  const passedNames = new Set(
    tasks.filter((t) => t.status === 'PASSED').map((t) => t.functionName)
  )
  const hatted = pack.functions.filter((fn) => passedNames.has(fn)).length
  const total = pack.functions.length
  const pct = total > 0 ? Math.round((hatted / total) * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
          Hat Pack: {postTitle}
        </span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {hatted}/{total} functions hatted ({pct}%)
        </span>
      </div>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', marginBottom: '14px' }}>
        <div
          style={{
            height: '6px',
            background: '#10b981',
            borderRadius: '3px',
            width: `${pct}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {pack.functions.map((fn) => {
          const done = passedNames.has(fn)
          return (
            <div
              key={fn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 10px',
                borderRadius: '4px',
                background: done ? '#f0fdf4' : '#fafafa',
                border: `1px solid ${done ? '#bbf7d0' : '#e5e7eb'}`,
                fontSize: '13px',
                color: done ? '#15803d' : '#374151',
              }}
            >
              <span style={{ fontSize: '14px' }}>{done ? '✓' : '○'}</span>
              {fn}
            </div>
          )
        })}
      </div>
    </div>
  )
}
