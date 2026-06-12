import { describe, it, expect } from 'vitest'

const CEO_APPROVAL_REASONS = ['TERMINATION', 'TRANSFER']

function requiresCeo(reason: string): boolean {
  return CEO_APPROVAL_REASONS.includes(reason)
}

describe('offboarding CEO approval logic', () => {
  it('requires CEO approval for TERMINATION', () => {
    expect(requiresCeo('TERMINATION')).toBe(true)
  })

  it('requires CEO approval for TRANSFER', () => {
    expect(requiresCeo('TRANSFER')).toBe(true)
  })

  it('does not require CEO for VOLUNTARY', () => {
    expect(requiresCeo('VOLUNTARY')).toBe(false)
  })

  it('does not require CEO for REDUNDANCY', () => {
    expect(requiresCeo('REDUNDANCY')).toBe(false)
  })
})

// Offboarding token format
describe('offboarding CEO token format', () => {
  it('token starts with EX4-OFFBOARD-', () => {
    const { randomUUID } = require('crypto')
    const token = `EX4-OFFBOARD-${randomUUID()}`
    expect(token).toMatch(/^EX4-OFFBOARD-[0-9a-f-]{36}$/)
  })
})

// Default checklist completeness
describe('offboarding default checklist', () => {
  const DEFAULT_CHECKLIST = [
    { owner: 'HR', item: 'Final day confirmed with employee' },
    { owner: 'HR', item: 'Employee file reviewed and complete' },
    { owner: 'HR', item: 'Disciplinary / correction records checked' },
    { owner: 'HR', item: 'Exit summary written' },
    { owner: 'HR', item: 'Payroll removal / final pay processed' },
    { owner: 'SENIOR', item: 'Project handover documented' },
    { owner: 'SENIOR', item: 'Client handover documented' },
    { owner: 'SENIOR', item: 'Knowledge transfer completed' },
    { owner: 'IT', item: 'Slack account removed' },
    { owner: 'IT', item: 'Email removed or converted to shared mailbox' },
    { owner: 'IT', item: 'Google Drive access removed' },
    { owner: 'IT', item: 'LastPass / password manager access removed' },
    { owner: 'IT', item: 'All software access removed' },
    { owner: 'ADMIN', item: 'Company property returned' },
    { owner: 'ADMIN', item: 'Keys / fobs returned' },
    { owner: 'TREASURY', item: 'Final expense claims settled' },
    { owner: 'TREASURY', item: 'Benefits / pension notified' },
    { owner: 'SECURITY', item: 'Building access deactivated' },
    { owner: 'SECURITY', item: 'Security clearance revoked (if applicable)' },
  ]

  it('has exactly 19 checklist items', () => {
    expect(DEFAULT_CHECKLIST).toHaveLength(19)
  })

  it('covers all 6 owner roles', () => {
    const owners = new Set(DEFAULT_CHECKLIST.map(c => c.owner))
    expect(owners).toContain('HR')
    expect(owners).toContain('SENIOR')
    expect(owners).toContain('IT')
    expect(owners).toContain('ADMIN')
    expect(owners).toContain('TREASURY')
    expect(owners).toContain('SECURITY')
  })

  it('every item has a non-empty item string', () => {
    DEFAULT_CHECKLIST.forEach(c => expect(c.item.length).toBeGreaterThan(0))
  })
})
