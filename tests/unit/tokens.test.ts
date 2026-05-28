import { describe, it, expect } from 'vitest'
import { generateToken, generateSecureId } from '@/lib/utils/tokens'

describe('generateToken', () => {
  it('returns a string starting with EX4-REVIEW- for that prefix', () => {
    const token = generateToken('EX4-REVIEW')
    expect(token).toMatch(/^EX4-REVIEW-/)
  })

  it('returns a string starting with EX4-APPROVE- for that prefix', () => {
    const token = generateToken('EX4-APPROVE')
    expect(token).toMatch(/^EX4-APPROVE-/)
  })

  it('appends 64 hex characters after the prefix dash', () => {
    const token = generateToken('EX4-REVIEW')
    const hex = token.replace('EX4-REVIEW-', '')
    expect(hex).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces a different value on every call', () => {
    const a = generateToken('EX4-REVIEW')
    const b = generateToken('EX4-REVIEW')
    expect(a).not.toBe(b)
  })
})

describe('generateSecureId', () => {
  it('returns a 32-character hex string', () => {
    const id = generateSecureId()
    expect(id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('produces a different value on every call', () => {
    const a = generateSecureId()
    const b = generateSecureId()
    expect(a).not.toBe(b)
  })
})
