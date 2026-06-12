import { describe, it, expect } from 'vitest'
import { computeTrend } from '@/lib/utils/statistics'

// computeTrend is the only pure logic in lib/utils/statistics.ts
// getStatisticsForEmployee / assignStatistic / recordEntry / getStatsAlerts
// are thin DB wrappers — covered by integration tests.

describe('computeTrend', () => {
  it('returns NO_DATA with no entries', () => {
    expect(computeTrend([])).toBe('NO_DATA')
  })

  it('returns NO_DATA with a single entry', () => {
    expect(computeTrend([{ value: 42 }])).toBe('NO_DATA')
  })

  it('returns UP when latest values are strictly higher than older ones', () => {
    // Array is newest-first (as returned by orderBy: desc)
    expect(computeTrend([{ value: 90 }, { value: 60 }, { value: 30 }])).toBe('UP')
  })

  it('returns DOWN when latest values are strictly lower than older ones', () => {
    expect(computeTrend([{ value: 10 }, { value: 40 }, { value: 70 }])).toBe('DOWN')
  })

  it('returns FLAT when values zigzag', () => {
    expect(computeTrend([{ value: 50 }, { value: 20 }, { value: 80 }])).toBe('FLAT')
  })

  it('returns FLAT when values are equal (neither up nor down)', () => {
    expect(computeTrend([{ value: 50 }, { value: 50 }])).toBe('FLAT')
  })

  it('uses only the first 3 entries — tail does not affect result', () => {
    // First 3 entries are clearly UP; the rest are noise
    const entries = [
      { value: 300 }, { value: 200 }, { value: 100 },
      { value: 1 }, { value: 999 }, { value: 500 },
    ]
    expect(computeTrend(entries)).toBe('UP')
  })

  it('handles exactly 2 entries', () => {
    expect(computeTrend([{ value: 100 }, { value: 50 }])).toBe('UP')
    expect(computeTrend([{ value: 50 }, { value: 100 }])).toBe('DOWN')
  })
})
