import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Exchange Four Personnel Desk <${process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com'}>`
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// When set, all emails are redirected to this address — use during local testing
function to(address: string): string {
  return process.env.TEST_EMAIL_OVERRIDE || address
}

export async function sendApplicantConfirmation(params: {
  to: string
  name: string
  reference: string
}): Promise<string | null> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
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
    to: to('nicola@exchangefour.com'),
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
    to: to('avi@exchangefour.com'),
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
    to: to('nicola@exchangefour.com'),
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

export async function sendApplicantApproved(params: {
  to: string
  name: string
  reference: string
  positionTitle: string | null
}): Promise<string | null> {
  const positionLabel = params.positionTitle ?? 'General Application'
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
    subject: `Congratulations — Exchange Four Application Update`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>We'd Like to Move Forward</h2>
        <p>Dear ${params.name},</p>
        <p>We are pleased to inform you that we would like to move forward with your application for <strong>${positionLabel}</strong> at Exchange Four.</p>
        <p>Please reply to this email with your proposed start date so we can proceed with the next steps.</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (applicant approved): ${error.message}`)
  return data?.id ?? null
}

export async function sendApplicantRejected(params: {
  to: string
  name: string
  reference: string
  positionTitle: string | null
}): Promise<string | null> {
  const positionLabel = params.positionTitle ?? 'the position'
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
    subject: `Exchange Four Application Update — ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Application Update</h2>
        <p>Dear ${params.name},</p>
        <p>Thank you for your time and interest in ${positionLabel} at Exchange Four. After careful consideration, we have decided not to move forward with your application at this time.</p>
        <p>We genuinely appreciate the effort you put into your application and wish you every success in your career.</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (applicant rejected): ${error.message}`)
  return data?.id ?? null
}

export async function sendInterviewInvite(params: {
  to: string
  name: string
  reference: string
  calendlyUrl: string
}): Promise<string | null> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
    subject: `Interview Invitation — Exchange Four — ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>You're Invited to Interview</h2>
        <p>Dear ${params.name},</p>
        <p>We are pleased to invite you to an interview for your application <strong>${params.reference}</strong>.</p>
        <p>Please use the link below to select a time that works for you:</p>
        <p style="margin-top:24px">
          <a href="${params.calendlyUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Schedule Your Interview
          </a>
        </p>
        <p style="margin-top:16px;font-size:13px;color:#666">
          If the button does not work, copy this link: ${params.calendlyUrl}
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (interview invite): ${error.message}`)
  return data?.id ?? null
}

export async function sendInterviewConfirmation(params: {
  to: string
  name: string
  reference: string
  scheduledAt: Date
  toNicola?: boolean
}): Promise<string | null> {
  const dateStr = params.scheduledAt.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const subject = params.toNicola
    ? `Interview Booked — ${params.name} — ${params.reference}`
    : `Interview Confirmed — Exchange Four — ${params.reference}`

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>${params.toNicola ? 'Interview Booked' : 'Interview Confirmed'}</h2>
        <p>${params.toNicola ? `${params.name} has scheduled their interview.` : `Dear ${params.name}, your interview has been confirmed.`}</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p><strong>Scheduled:</strong> ${dateStr}</p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (interview confirmation): ${error.message}`)
  return data?.id ?? null
}

export async function sendOfferLetter(params: {
  to: string
  name: string
  reference: string
  positionTitle: string | null
  startDate: string | null
  employeeId?: string
}): Promise<string | null> {
  const position = params.positionTitle ?? 'the position'
  const startLine = params.startDate
    ? `<p><strong>Start Date:</strong> ${params.startDate}</p>`
    : `<p>Your start date will be confirmed shortly by the team.</p>`
  const acknowledgeSection = params.employeeId
    ? `
        <p style="margin-top:24px">To complete your onboarding, please acknowledge your documents using the secure link below:</p>
        <p style="margin-top:12px">
          <a href="${BASE_URL}/acknowledge/${params.employeeId}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">
            Acknowledge Documents
          </a>
        </p>
        <p style="font-size:12px;color:#999;margin-top:8px">NDA · Employment Contract · Company Policies</p>`
    : `<p style="margin-top:16px">Our team will be in touch with further details about your onboarding, including your NDA, employee handbook, and first-week schedule.</p>`

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to(params.to),
    subject: `Welcome to Exchange Four — ${params.reference}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Welcome to Exchange Four</h2>
        <p>Dear ${params.name},</p>
        <p>We are delighted to offer you the position of <strong>${position}</strong> at Exchange Four.</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        ${startLine}
        ${acknowledgeSection}
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend error (offer letter): ${error.message}`)
  return data?.id ?? null
}
