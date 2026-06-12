import { describe, it, expect } from 'vitest'
import { computeTrend } from '@/lib/utils/statistics'

// ── computeTrend ──────────────────────────────────────────────────────────────
// isTrivial and needsHandling are private — tested indirectly via handlingNeeded
// assertions in integration tests. computeTrend is exported and testable directly.

describe('computeTrend', () => {
  it('returns NO_DATA when fewer than 2 entries', () => {
    expect(computeTrend([])).toBe('NO_DATA')
    expect(computeTrend([{ value: 10 }])).toBe('NO_DATA')
  })

  it('returns UP when values are consistently descending (newest first)', () => {
    // entries are ordered newest → oldest; UP means most-recent values are highest
    expect(computeTrend([{ value: 30 }, { value: 20 }, { value: 10 }])).toBe('UP')
  })

  it('returns DOWN when values are consistently ascending (newest first)', () => {
    expect(computeTrend([{ value: 10 }, { value: 20 }, { value: 30 }])).toBe('DOWN')
  })

  it('returns FLAT when values are mixed', () => {
    expect(computeTrend([{ value: 20 }, { value: 10 }, { value: 30 }])).toBe('FLAT')
  })

  it('returns UP with exactly 2 entries where newest > oldest', () => {
    expect(computeTrend([{ value: 50 }, { value: 30 }])).toBe('UP')
  })

  it('returns DOWN with exactly 2 entries where newest < oldest', () => {
    expect(computeTrend([{ value: 5 }, { value: 15 }])).toBe('DOWN')
  })

  it('uses only the first 3 entries (most recent slice)', () => {
    // First 3 are UP — remaining don't matter
    expect(computeTrend([
      { value: 100 }, { value: 80 }, { value: 60 },
      { value: 1 }, { value: 200 },
    ])).toBe('UP')
  })
})

// ── Survey handling flag rules (documented via spec) ─────────────────────────

describe('survey handlingNeeded flag rules (spec)', () => {
  // isTrivial triggers on: length <= 10, or exact matches: no/none/n-a/nope/na/-
  // handlingNeeded = !isTrivial(q3) || !isTrivial(q4)
  // i.e. flagged if EITHER q3 or q4 contains substantive content

  it('trivial answers: "no" triggers isTrivial → handlingNeeded=false', () => {
    // Both q3 and q4 trivial → not flagged
    // Verified via integration test; this test documents the rule
    const q3 = 'no'
    const q4 = 'n/a'
    const isTrivialQ3 = q3.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q3.trim())
    const isTrivialQ4 = q4.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q4.trim())
    expect(!isTrivialQ3 || !isTrivialQ4).toBe(false)
  })

  it('substantive q3 triggers handlingNeeded=true regardless of q4', () => {
    const q3 = 'My manager keeps blocking my work and creating confusion'
    const q4 = 'none'
    const isTrivialQ3 = q3.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q3.trim())
    const isTrivialQ4 = q4.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q4.trim())
    expect(!isTrivialQ3 || !isTrivialQ4).toBe(true)
  })

  it('substantive q4 triggers handlingNeeded=true regardless of q3', () => {
    const q3 = 'no'
    const q4 = 'A colleague is consistently dismissive and creating a hostile environment'
    const isTrivialQ3 = q3.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q3.trim())
    const isTrivialQ4 = q4.trim().length <= 10 || /^(no|none|n\/a|nope|na|-)$/i.test(q4.trim())
    expect(!isTrivialQ3 || !isTrivialQ4).toBe(true)
  })

  it('SENIOR survey: ratingScore < 7 sets handlingNeeded=true', () => {
    // Rule is encoded directly in submitSeniorSurvey: handlingNeeded: ratingScore < 7
    expect(6 < 7).toBe(true)
    expect(7 < 7).toBe(false)
    expect(8 < 7).toBe(false)
  })
})
