import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Exchange Four Personnel Desk <${process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com'}>`
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendApplicantConfirmation(params: {
  to: string
  name: string
  reference: string
}): Promise<string | null> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Exchange Four Application Received - ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Application Received</h2>
        <p>Dear ${params.name},</p>
        <p>Thank you for applying. We have received your application and it is now under review.</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p>You will be contacted directly by our team if we wish to proceed. Please keep this reference number for your records.</p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (applicant confirmation): ${error.message}`)
  return data?.id ?? null
}

export async function sendNicolaNotification(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
  reviewToken: string
}): Promise<string | null> {
  const reviewLink = `${BASE_URL}/hr/review/${params.reviewToken}`
  const positionLabel = params.positionTitle ?? 'General Application'

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: 'nicola@exchangefour.com',
    subject: `New Application — ${params.applicantName} — ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>New Application Received</h2>
        <p><strong>Applicant:</strong> ${params.applicantName}</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p><strong>Position:</strong> ${positionLabel}</p>
        <p style="margin-top:24px">
          <a href="${reviewLink}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Review Application
          </a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#666">
          Secure link: <code>${params.reviewToken}</code><br>
          This link expires in 7 days.
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (Nicola notification): ${error.message}`)
  return data?.id ?? null
}

export async function sendAviCSW(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
  approveToken: string
}): Promise<string | null> {
  const approveLink = `${BASE_URL}/approve/${params.approveToken}`
  const positionLabel = params.positionTitle ?? 'General Application'

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: 'avi@exchangefour.com',
    subject: `CSW Ready for Review — ${params.applicantName} — ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Candidate Summary Write-up Ready</h2>
        <p><strong>Applicant:</strong> ${params.applicantName}</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p><strong>Position:</strong> ${positionLabel}</p>
        <p style="margin-top:24px">
          <a href="${approveLink}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Review &amp; Decide
          </a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#666">
          Secure link: <code>${params.approveToken}</code><br>
          This link expires in 7 days.
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (Avi CSW): ${error.message}`)
  return data?.id ?? null
}

export async function sendNicolaAviDecision(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
  decision: 'APPROVED' | 'DISAPPROVED'
  reason: string | null
  notes: string | null
  applicationId: string
}): Promise<string | null> {
  const positionLabel = params.positionTitle ?? 'General Application'
  const approved = params.decision === 'APPROVED'
  const subject = approved
    ? `Avi Approved — ${params.applicantName} — ${params.reference}`
    : `Avi Disapproved — ${params.applicantName} — ${params.reference}`
  const reviewLink = `${BASE_URL}/hr/applications/${params.applicationId}`

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: 'nicola@exchangefour.com',
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Avi's Decision: ${approved ? 'Approved ✓' : 'Disapproved ✗'}</h2>
        <p><strong>Applicant:</strong> ${params.applicantName}</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p><strong>Position:</strong> ${positionLabel}</p>
        ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
        ${params.notes ? `<p><strong>Notes:</strong> ${params.notes}</p>` : ''}
        <p style="margin-top:24px">
          <a href="${reviewLink}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Open Application
          </a>
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (Nicola decision): ${error.message}`)
  return data?.id ?? null
}
