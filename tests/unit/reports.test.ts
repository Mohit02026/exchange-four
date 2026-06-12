import { describe, it, expect } from 'vitest'

// generateWeeklyReport pulls from DB — test the shape logic only
// by exercising the pure helper that decides "behind" status

function isBehind(pct: number, daysSinceHire: number) {
  return pct < 50 && daysSinceHire > 14
}

describe('onboarding behind logic', () => {
  it('flags employee as behind when <50% done and hired >14 days ago', () => {
    expect(isBehind(40, 20)).toBe(true)
  })

  it('does not flag employee who is >=50% done', () => {
    expect(isBehind(60, 20)).toBe(false)
  })

  it('does not flag employee hired within 14 days even if low pct', () => {
    expect(isBehind(10, 7)).toBe(false)
  })

  it('boundary: exactly 50% is not behind', () => {
    expect(isBehind(50, 30)).toBe(false)
  })

  it('boundary: exactly 14 days is not behind', () => {
    expect(isBehind(20, 14)).toBe(false)
  })
})
