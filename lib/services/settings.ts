import { db } from '@/lib/db'

export type EmailProvider = 'resend' | 'ghl'

export async function getEmailProvider(): Promise<EmailProvider> {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    return settings?.emailProvider === 'ghl' ? 'ghl' : 'resend'
  } catch {
    return 'resend'
  }
}

export async function setEmailProvider(provider: EmailProvider): Promise<void> {
  await db.appSettings.upsert({
    where: { id: 'singleton' },
    update: { emailProvider: provider },
    create: { id: 'singleton', emailProvider: provider },
  })
}
