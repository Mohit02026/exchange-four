import { db } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'
import type { ReferenceStatus, BGCheckStatus, BGCheckResult } from '@/lib/generated/prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Exchange Four Personnel Desk <${process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com'}>`
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function getReferencesForApplication(applicationId: string) {
  return db.referenceCheck.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createReference(data: {
  applicationId: string
  refereeName: string
  refereeEmail: string
  relationship: string
  refereeTitle?: string
  refereeCompany?: string
  refereePhone?: string
}) {
  const token = crypto.randomUUID()
  const tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  return db.referenceCheck.create({
    data: {
      applicationId: data.applicationId,
      refereeName: data.refereeName,
      refereeEmail: data.refereeEmail,
      relationship: data.relationship,
      refereeTitle: data.refereeTitle,
      refereeCompany: data.refereeCompany,
      refereePhone: data.refereePhone,
      status: 'PENDING',
      token,
      tokenExpiry,
    },
  })
}

export async function updateReference(
  id: string,
  data: {
    status?: ReferenceStatus
    notes?: string
    rating?: number
    wouldRehire?: boolean
  }
) {
  return db.referenceCheck.update({
    where: { id },
    data,
  })
}

export async function sendReferenceRequest(referenceId: string) {
  const ref = await db.referenceCheck.update({
    where: { id: referenceId },
    data: { status: 'REQUESTED', requestSentAt: new Date() },
  })

  const link = `${BASE_URL}/references/${ref.token}`
  const dest = process.env.TEST_EMAIL_OVERRIDE || ref.refereeEmail

  await resend.emails.send({
    from: FROM,
    to: dest,
    subject: 'Reference Request — Exchange Four',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Reference Request</h2>
        <p>Dear ${ref.refereeName},</p>
        <p>You have been listed as a reference for a candidate applying at Exchange Four. We would greatly appreciate a few minutes of your time to complete a short reference form.</p>
        <p style="margin-top:24px">
          <a href="${link}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Complete Reference Form
          </a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#666">
          If the button does not work, copy this link: ${link}<br>
          This link expires in 14 days.
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })

  return ref
}

export async function getBGCheck(applicationId: string) {
  return db.backgroundCheck.findUnique({ where: { applicationId } })
}

export async function upsertBGCheck(
  applicationId: string,
  data: {
    status?: BGCheckStatus
    provider?: string
    referenceNumber?: string
    result?: BGCheckResult | null
    notes?: string
  }
) {
  return db.backgroundCheck.upsert({
    where: { applicationId },
    update: data,
    create: { applicationId, ...data },
  })
}
