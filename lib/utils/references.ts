import { db } from '@/lib/db'

export async function generateApplicationReference(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.application.count()
  const padded = String(count + 1).padStart(6, '0')
  return `EF-HR-APP-${year}-${padded}`
}
