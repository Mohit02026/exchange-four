import crypto from 'crypto'

export function generateToken(prefix: 'EX4-REVIEW' | 'EX4-APPROVE'): string {
  const random = crypto.randomBytes(32).toString('hex')
  return `${prefix}-${random}`
}

export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex')
}
