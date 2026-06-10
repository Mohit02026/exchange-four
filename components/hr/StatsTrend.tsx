'use client'

import type { StatisticEntry } from '@/lib/generated/prisma/client'

type Props = {
  entries: StatisticEntry[]
  target?: number | null
}

export default function StatsTrend({ entries, target }: Props) {
  // entries arrive newest-first; display oldest→newest left→right
  const ordered = [...entries].reverse()

  if (ordered.length === 0) {
    return (
      <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 0' }}>No entries yet.</div>
    )
  }

  const values = ordered.map((e) => e.value)
  const allValues = target !== undefined && target !== null ? [...values, target] : values
  const max = Math.max(...allValues)
  const min = Math.min(...allValues, 0)
  const range = max - min || 1

  const barHeight = 60
  const barWidth = 32
  const gap = 6

  const toY = (v: number) => ((v - min) / range) * barHeight

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: barHeight + 28, paddingBottom: 24, position: 'relative' }}>
        {ordered.map((entry, i) => {
          const h = Math.max(toY(entry.value), 2)
          return (
            <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, whiteSpace: 'nowrap' }}>
                {entry.value}
              </div>
              <div
                title={`${entry.period}: ${entry.value}`}
                style={{
                  width: barWidth,
                  height: h,
                  background: '#111827',
                  borderRadius: '3px 3px 0 0',
                }}
              />
              <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 3, whiteSpace: 'nowrap', maxWidth: barWidth, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.period}
              </div>
            </div>
          )
        })}

        {target !== undefined && target !== null && (
          <div
            title={`Target: ${target}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 24 + toY(target),
              borderTop: '1px dashed #dc2626',
              pointerEvents: 'none',
            }}
          >
            <span style={{ position: 'absolute', right: 0, top: -10, fontSize: 9, color: '#dc2626' }}>
              target {target}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
