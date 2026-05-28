import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { to } from '@/lib/integrations/email'

describe('to() email override helper', () => {
  const originalOverride = process.env.TEST_EMAIL_OVERRIDE

  afterEach(() => {
    // Restore original value after each test
    if (originalOverride === undefined) {
      delete process.env.TEST_EMAIL_OVERRIDE
    } else {
      process.env.TEST_EMAIL_OVERRIDE = originalOverride
    }
  })

  it('returns the original address when TEST_EMAIL_OVERRIDE is not set', () => {
    delete process.env.TEST_EMAIL_OVERRIDE
    expect(to('nicola@exchangefour.com')).toBe('nicola@exchangefour.com')
  })

  it('returns the override address when TEST_EMAIL_OVERRIDE is set', () => {
    process.env.TEST_EMAIL_OVERRIDE = 'override@example.com'
    expect(to('nicola@exchangefour.com')).toBe('override@example.com')
  })

  it('override applies regardless of the original address', () => {
    process.env.TEST_EMAIL_OVERRIDE = 'override@example.com'
    expect(to('avi@exchangefour.com')).toBe('override@example.com')
    expect(to('applicant@example.com')).toBe('override@example.com')
  })

  it('returns a string in all cases', () => {
    delete process.env.TEST_EMAIL_OVERRIDE
    expect(typeof to('anyone@example.com')).toBe('string')
    process.env.TEST_EMAIL_OVERRIDE = 'override@example.com'
    expect(typeof to('anyone@example.com')).toBe('string')
  })
})
