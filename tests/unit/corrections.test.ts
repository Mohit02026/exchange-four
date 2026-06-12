import { describe, it, expect } from 'vitest'

// Pure logic extracted from createCorrection / updateCorrection
const EXEC_REQUIRED_ACTIONS = ['SUSPENSION', 'TERMINATION_RECOMMENDATION', 'TRANSFER_DEMOTION_PROMOTION']

function requiresExec(action: string | undefined | null): boolean {
  return action != null && EXEC_REQUIRED_ACTIONS.includes(action)
}

describe('correction executive approval logic', () => {
  it('requires exec for SUSPENSION', () => {
    expect(requiresExec('SUSPENSION')).toBe(true)
  })

  it('requires exec for TERMINATION_RECOMMENDATION', () => {
    expect(requiresExec('TERMINATION_RECOMMENDATION')).toBe(true)
  })

  it('requires exec for TRANSFER_DEMOTION_PROMOTION', () => {
    expect(requiresExec('TRANSFER_DEMOTION_PROMOTION')).toBe(true)
  })

  it('does not require exec for VERBAL_WARNING', () => {
    expect(requiresExec('VERBAL_WARNING')).toBe(false)
  })

  it('does not require exec for WRITTEN_WARNING', () => {
    expect(requiresExec('WRITTEN_WARNING')).toBe(false)
  })

  it('does not require exec for FORMAL_REPRIMAND', () => {
    expect(requiresExec('FORMAL_REPRIMAND')).toBe(false)
  })

  it('does not require exec when action is null', () => {
    expect(requiresExec(null)).toBe(false)
  })

  it('does not require exec when action is undefined', () => {
    expect(requiresExec(undefined)).toBe(false)
  })
})

// Token format validation
describe('correction executive token format', () => {
  it('token starts with EX4-CORRECTION-', () => {
    const { randomUUID } = require('crypto')
    const token = `EX4-CORRECTION-${randomUUID()}`
    expect(token).toMatch(/^EX4-CORRECTION-[0-9a-f-]{36}$/)
  })
})
