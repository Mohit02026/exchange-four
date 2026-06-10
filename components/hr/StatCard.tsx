'use client'

import type { Statistic, StatisticEntry } from '@/lib/generated/prisma/client'
import { computeTrend } from '@/lib/utils/statistics'

type Props = {
  stat: Statistic & { entries: StatisticEntry[] }
}

const freqColors: Record<string, string> = {
  DAILY: '#2563eb',
  WEEKLY: '#7c3aed',
  MONTHLY: '#0891b2',
}

export default function StatCard({ stat }: Props) {
  const trend = computeTrend(stat.entries)
  const latest = stat.entries[0]

  const trendIcon = trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '→'
  const trendColor =
    trend === 'UP' ? '#10b981' :
    trend === 'DOWN' ? '#dc2626' :
    '#9ca3af'

  const lastUpdated = latest
    ? new Date(latest.enteredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No data'

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '16px 20px',
      background: '#fff',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: freqColors[stat.frequency] ?? '#6b7280',
            textTransform: 'uppercase',
          }}>
            {stat.frequency}
          </span>
          <h3 style={{ margin: '4px 0 2px', fontSize: 15, fontWeight: 600, color: '#111' }}>
            {stat.name}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{stat.unit}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>
            {latest ? latest.value : '—'}
          </span>
          <span style={{ marginLeft: 8, fontSize: 22, color: trendColor, fontWeight: 700 }}>
            {trendIcon}
          </span>
        </div>
      </div>

      {stat.target !== null && stat.target !== undefined && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          Target: <strong style={{ color: '#111' }}>{stat.target} {stat.unit}</strong>
        </div>
      )}

      <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
        Last updated: {lastUpdated}
        {stat.seniorResponsible && (
          <span style={{ marginLeft: 12 }}>SR: {stat.seniorResponsible}</span>
        )}
      </div>
    </div>
  )
}
