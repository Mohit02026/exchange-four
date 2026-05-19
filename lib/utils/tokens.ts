import crypto from 'crypto'
import { db } from '@/lib/db'

export function generateToken(prefix: 'EX4-REVIEW' | 'EX4-APPROVE'): string {
  const random = crypto.randomBytes(32).toString('hex')
  return `${prefix}-${random}`
}

export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function generateReviewToken(applicationId: string): Promise<string> {
  const token = generateToken('EX4-REVIEW')
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.application.update({
    where: { id: applicationId },
    data: { reviewToken: token, reviewTokenExpiry: expiry },
  })
  return token
}
