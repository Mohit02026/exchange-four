import { Resend } from 'resend'
import { db } from '@/lib/db'
import { getEmailProvider } from '@/lib/services/settings'
import { sendGHLEmail } from '@/lib/integrations/ghl-email'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Exchange Four Personnel Desk <${process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com'}>`
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// When set, all emails are redirected to this address — use during local testing
// Exported for unit testing only
export function to(address: string): string {
  return process.env.TEST_EMAIL_OVERRIDE || address
}

// Resolve the GHL contactId for any recipient email.
// Applicants: looked up from DB. Internal users (nicola, avi): from env vars.
async function resolveGHLContactId(email: string): Promise<string | null> {
  const normalized = email.toLowerCase()
  if (normalized === 'nicola@exchangefour.com') return process.env.GHL_NICOLA_CONTACT_ID ?? null
  if (normalized === 'avi@exchangefour.com') return process.env.GHL_AVI_CONTACT_ID ?? null
  try {
    const applicant = await db.applicant.findFirst({
      where: { correspondenceEmail: email },
      select: { ghlContactId: true },
    })
    return applicant?.ghlContactId ?? null
  } catch {
    return null
  }
}

// Route a single email through GHL or Resend based on the active provider setting.
// Falls back to Resend if GHL is selected but no contactId is available.
async function routedSend(params: {
  recipientEmail: string
  subject: string
  html: string
}): Promise<string | null> {
  const provider = await getEmailProvider()
  const dest = to(params.recipientEmail)

  if (provider === 'ghl') {
    const contactId = await resolveGHLContactId(params.recipientEmail)
    if (contactId) {
      return sendGHLEmail({
        contactId,
        to: dest,
        subject: params.subject,
        html: params.html,
      }).catch(() => null)
    }
    // No contactId found — fall through to Resend so email is never silently dropped
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: dest,
    subject: params.subject,
    html: params.html,
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
  return data?.id ?? null
}

export async function sendApplicantConfirmation(params: {
  to: string
  name: string
  reference: string
}): Promise<string | null> {
  return routedSend({
    recipientEmail: params.to,
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
}

export async function sendNicolaNotification(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
  reviewToken: string
}): Promise<string | null> {
  const reviewLink = `${BASE_URL}/hr/review/${params.reviewToken}`
  const positionLabel = params.positionTitle ?? 'General Application'

  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
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
}

export async function sendAviCSW(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
  approveToken: string
}): Promise<string | null> {
  const approveLink = `${BASE_URL}/approve/${params.approveToken}`
  const positionLabel = params.positionTitle ?? 'General Application'

  return routedSend({
    recipientEmail: 'avi@exchangefour.com',
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

  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
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
}

export async function sendApplicantApproved(params: {
  to: string
  name: string
  reference: string
  positionTitle: string | null
}): Promise<string | null> {
  const positionLabel = params.positionTitle ?? 'General Application'
  return routedSend({
    recipientEmail: params.to,
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
}

export async function sendApplicantRejected(params: {
  to: string
  name: string
  reference: string
  positionTitle: string | null
}): Promise<string | null> {
  const positionLabel = params.positionTitle ?? 'the position'
  return routedSend({
    recipientEmail: params.to,
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
}

export async function sendInterviewInvite(params: {
  to: string
  name: string
  reference: string
  calendlyUrl: string
}): Promise<string | null> {
  return routedSend({
    recipientEmail: params.to,
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

  return routedSend({
    recipientEmail: params.to,
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

  return routedSend({
    recipientEmail: params.to,
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
}

export async function sendCheckinSummary(params: {
  employeeName: string
  completedToday: string
  studiedToday: string
  productProduced: string
  whatWasUnclear: string
  anyBlocks: string
  needsHelp: string
  submittedAt: Date
}): Promise<string | null> {
  const dateStr = params.submittedAt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
    subject: `Daily Check-In: ${params.employeeName} — ${dateStr}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Daily Check-In Summary</h2>
        <p><strong>${params.employeeName}</strong> &mdash; ${dateStr}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          ${[
            ['What did you complete today?', params.completedToday],
            ['What did you study today?', params.studiedToday],
            ['What product did you produce?', params.productProduced],
            ['What was unclear?', params.whatWasUnclear],
            ['Any blocks?', params.anyBlocks],
            ['Do you need help?', params.needsHelp],
          ].map(([q, a]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;vertical-align:top;width:40%">${q}</td>
              <td style="padding:10px 0 10px 16px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top">${a}</td>
            </tr>
          `).join('')}
        </table>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendSurveyHandlingAlert(params: {
  employeeName: string
  weekNumber: number
  type: 'NEW_HIRE' | 'SENIOR'
  flaggedAnswers: { question: string; answer: string }[]
}): Promise<string | null> {
  const typeLabel = params.type === 'NEW_HIRE' ? 'New Hire' : 'Senior'
  const rows = params.flaggedAnswers.map(({ question, answer }) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;vertical-align:top;width:40%">${question}</td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;color:#dc2626">${answer}</td>
    </tr>
  `).join('')

  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
    subject: `Survey Flag: ${params.employeeName} — Week ${params.weekNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2 style="color:#dc2626">Survey Flag — Handling Required</h2>
        <p><strong>Employee:</strong> ${params.employeeName}</p>
        <p><strong>Survey Type:</strong> ${typeLabel}</p>
        <p><strong>Week:</strong> ${params.weekNumber}</p>
        <p style="margin-top:16px;font-size:14px;color:#374151">The following answers require attention:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          ${rows}
        </table>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendEthicsThresholdAlert(params: {
  subjectType: 'EMPLOYEE' | 'APPLICANT'
  count: number
}): Promise<string | null> {
  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
    subject: `Ethics Alert — ${params.count} Reports on One ${params.subjectType === 'EMPLOYEE' ? 'Employee' : 'Applicant'}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2 style="color:#dc2626">Ethics Report Threshold Reached</h2>
        <p style="font-size:15px">
          <strong>${params.count} ethics reports</strong> have been filed against one
          ${params.subjectType === 'EMPLOYEE' ? 'employee' : 'applicant'}.
          This exceeds the 5-report threshold and requires immediate review.
        </p>
        <p style="margin-top:24px">
          <a href="${BASE_URL}/hr/ethics" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            View Ethics Reports →
          </a>
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendCorrectionFiled(params: {
  employeeName: string
  severity: string
  incident: string
  correctionId: string
}): Promise<string | null> {
  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
    subject: `New Correction Filed — ${params.employeeName} (${params.severity})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2 style="color:#b45309">Correction Filed</h2>
        <p style="font-size:15px">A new correction has been filed for <strong>${params.employeeName}</strong>.</p>
        <p style="font-size:14px;color:#374151"><strong>Severity:</strong> ${params.severity}</p>
        <p style="font-size:14px;color:#374151"><strong>Incident:</strong> ${params.incident.slice(0, 200)}${params.incident.length > 200 ? '…' : ''}</p>
        <p style="margin-top:24px">
          <a href="${BASE_URL}/hr/corrections/${params.correctionId}" style="background:#b45309;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Review Correction →
          </a>
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendCorrectionExecutiveApproval(params: {
  employeeName: string
  action: string
  incident: string
  token: string
}): Promise<string | null> {
  const actionLabel = params.action.replace(/_/g, ' ').toLowerCase()
  return routedSend({
    recipientEmail: 'avi@exchangefour.com',
    subject: `Executive Approval Required — ${actionLabel} for ${params.employeeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>Executive Approval Required</h2>
        <p style="font-size:15px">
          A correction for <strong>${params.employeeName}</strong> requires your approval before proceeding.
        </p>
        <p style="font-size:14px;color:#374151"><strong>Proposed action:</strong> ${actionLabel}</p>
        <p style="font-size:14px;color:#374151"><strong>Incident:</strong> ${params.incident.slice(0, 200)}${params.incident.length > 200 ? '…' : ''}</p>
        <div style="margin-top:24px;display:flex;gap:12px">
          <a href="${BASE_URL}/approve/correction/${params.token}?decision=APPROVED" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Approve →
          </a>
          &nbsp;&nbsp;
          <a href="${BASE_URL}/approve/correction/${params.token}?decision=REJECTED" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Reject
          </a>
        </div>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendOffboardingStarted(params: {
  employeeName: string
  reason: string
  finalDay: string | null
  caseId: string
}): Promise<string | null> {
  const reasonLabel = params.reason.charAt(0) + params.reason.slice(1).toLowerCase()
  return routedSend({
    recipientEmail: 'nicola@exchangefour.com',
    subject: `Offboarding Started — ${params.employeeName} (${reasonLabel})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2 style="color:#374151">Offboarding Case Opened</h2>
        <p style="font-size:15px">An offboarding case has been opened for <strong>${params.employeeName}</strong>.</p>
        <p style="font-size:14px;color:#374151"><strong>Reason:</strong> ${reasonLabel}</p>
        ${params.finalDay ? `<p style="font-size:14px;color:#374151"><strong>Final day:</strong> ${params.finalDay}</p>` : ''}
        <p style="margin-top:24px">
          <a href="${BASE_URL}/hr/offboarding/${params.caseId}" style="background:#374151;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            View Offboarding Checklist →
          </a>
        </p>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendOffboardingCeoApproval(params: {
  employeeName: string
  reason: string
  token: string
}): Promise<string | null> {
  const reasonLabel = params.reason.charAt(0) + params.reason.slice(1).toLowerCase()
  return routedSend({
    recipientEmail: 'avi@exchangefour.com',
    subject: `CEO Approval Required — Offboarding of ${params.employeeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase">Exchange Four Personnel Desk</p>
        <h2>CEO Approval Required — Offboarding</h2>
        <p style="font-size:15px">HR has initiated offboarding for <strong>${params.employeeName}</strong> and requires your approval to proceed.</p>
        <p style="font-size:14px;color:#374151"><strong>Reason:</strong> ${reasonLabel}</p>
        <div style="margin-top:24px;display:flex;gap:12px">
          <a href="${BASE_URL}/approve/offboarding/${params.token}?decision=APPROVED" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Approve →
          </a>
          &nbsp;&nbsp;
          <a href="${BASE_URL}/approve/offboarding/${params.token}?decision=REJECTED" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
            Reject
          </a>
        </div>
        <p style="margin-top:32px;color:#666;font-size:13px">Exchange Four Personnel Desk</p>
      </div>
    `,
  })
}

export async function sendWeeklyReport(params: {
  report: {
    generatedAt: string
    weekStart: string
    weekEnd: string
    thisWeek: { newApplications: number; newHires: number; interviewsCompleted: number }
    pipeline: { submitted: number; underReview: number; sentToAvi: number; hired: number }
    awaitingAction: { pendingNicolaReview: number; pendingAviApproval: number; correctionsExecPending: number; offboardingCeoPending: number }
    onboarding: { total: number; behind: { name: string; completedPct: number; daysSinceHire: number }[] }
    training: { total: number; incomplete: { name: string; completedPct: number }[] }
    ethics: { openReports: number; subjectsAtThreshold: number }
    corrections: { open: number; pendingExec: number }
    offboarding: { activeCases: number; pendingCeo: number }
  }
}): Promise<void> {
  const r = params.report
  const weekOf = new Date(r.weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const alertRows = [
    r.awaitingAction.pendingNicolaReview > 0 && `<tr><td style="padding:6px 0;color:#374151">Pending Nicola review</td><td style="padding:6px 0;font-weight:700;color:#d97706">${r.awaitingAction.pendingNicolaReview}</td></tr>`,
    r.awaitingAction.pendingAviApproval > 0 && `<tr><td style="padding:6px 0;color:#374151">Pending Avi approval</td><td style="padding:6px 0;font-weight:700;color:#0891b2">${r.awaitingAction.pendingAviApproval}</td></tr>`,
    r.awaitingAction.correctionsExecPending > 0 && `<tr><td style="padding:6px 0;color:#374151">Corrections pending exec</td><td style="padding:6px 0;font-weight:700;color:#b45309">${r.awaitingAction.correctionsExecPending}</td></tr>`,
    r.awaitingAction.offboardingCeoPending > 0 && `<tr><td style="padding:6px 0;color:#374151">Offboarding pending CEO</td><td style="padding:6px 0;font-weight:700;color:#7c3aed">${r.awaitingAction.offboardingCeoPending}</td></tr>`,
    r.ethics.openReports > 0 && `<tr><td style="padding:6px 0;color:#374151">Open ethics reports</td><td style="padding:6px 0;font-weight:700;color:#dc2626">${r.ethics.openReports}</td></tr>`,
    r.corrections.open > 0 && `<tr><td style="padding:6px 0;color:#374151">Open corrections</td><td style="padding:6px 0;font-weight:700;color:#dc2626">${r.corrections.open}</td></tr>`,
  ].filter(Boolean).join('')

  const behindRows = r.onboarding.behind.map(e =>
    `<li style="font-size:13px;color:#374151;margin-bottom:4px">${e.name} — ${e.completedPct}% complete (${e.daysSinceHire} days)</li>`
  ).join('')

  const trainingRows = r.training.incomplete.map(e =>
    `<li style="font-size:13px;color:#374151;margin-bottom:4px">${e.name} — ${e.completedPct}% complete</li>`
  ).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
      <p style="font-size:11px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Exchange Four Personnel Desk</p>
      <h2 style="margin:0 0 4px;font-size:20px">Weekly Personnel Report</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#6b7280">Week of ${weekOf}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">This Week</td>
          <td></td>
        </tr>
        <tr><td style="padding:6px 16px;color:#374151">New applications</td><td style="padding:6px 16px;font-weight:700;color:#2563eb">${r.thisWeek.newApplications}</td></tr>
        <tr><td style="padding:6px 16px;color:#374151">New hires started</td><td style="padding:6px 16px;font-weight:700;color:#16a34a">${r.thisWeek.newHires}</td></tr>
        <tr><td style="padding:6px 16px;color:#374151">Interviews completed</td><td style="padding:6px 16px;font-weight:700;color:#059669">${r.thisWeek.interviewsCompleted}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Pipeline</td>
          <td></td>
        </tr>
        <tr><td style="padding:6px 16px;color:#374151">New (unreviewed)</td><td style="padding:6px 16px;font-weight:700">${r.pipeline.submitted}</td></tr>
        <tr><td style="padding:6px 16px;color:#374151">Under review</td><td style="padding:6px 16px;font-weight:700">${r.pipeline.underReview}</td></tr>
        <tr><td style="padding:6px 16px;color:#374151">Sent to Avi</td><td style="padding:6px 16px;font-weight:700">${r.pipeline.sentToAvi}</td></tr>
        <tr><td style="padding:6px 16px;color:#374151">Hired (all time)</td><td style="padding:6px 16px;font-weight:700;color:#16a34a">${r.pipeline.hired}</td></tr>
      </table>

      ${alertRows ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #fca5a5;border-radius:8px">
        <tr style="background:#fef2f2">
          <td style="padding:12px 16px;font-size:13px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px" colspan="2">⚠ Requires Attention</td>
        </tr>
        ${alertRows}
      </table>` : ''}

      ${behindRows ? `
      <div style="margin-bottom:24px">
        <p style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Onboarding Behind (&lt;50% after 14 days)</p>
        <ul style="margin:0;padding-left:20px">${behindRows}</ul>
      </div>` : ''}

      ${trainingRows ? `
      <div style="margin-bottom:24px">
        <p style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Training Incomplete</p>
        <ul style="margin:0;padding-left:20px">${trainingRows}</ul>
      </div>` : ''}

      <div style="margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f9fafb">
            <td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Active Cases</td>
            <td></td>
          </tr>
          <tr><td style="padding:6px 16px;color:#374151">Offboarding in progress</td><td style="padding:6px 16px;font-weight:700">${r.offboarding.activeCases}</td></tr>
          <tr><td style="padding:6px 16px;color:#374151">Ethics reports open</td><td style="padding:6px 16px;font-weight:700">${r.ethics.openReports}</td></tr>
          <tr><td style="padding:6px 16px;color:#374151">Corrections open</td><td style="padding:6px 16px;font-weight:700">${r.corrections.open}</td></tr>
        </table>
      </div>

      <p style="margin-top:32px;font-size:12px;color:#9ca3af">
        View full report: <a href="${BASE_URL}/hr/reports/weekly" style="color:#2563eb">${BASE_URL}/hr/reports/weekly</a>
      </p>
      <p style="font-size:12px;color:#9ca3af">Exchange Four Personnel Desk — auto-generated ${new Date(r.generatedAt).toLocaleString()}</p>
    </div>
  `

  const recipients = ['nicola@exchangefour.com', 'avi@exchangefour.com']
  await Promise.all(
    recipients.map((addr) => routedSend({ recipientEmail: addr, subject: `Weekly Personnel Report — Week of ${weekOf}`, html }))
  )
}
