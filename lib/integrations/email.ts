import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Exchange Four Personnel Desk <${process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com'}>`
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// When set, all emails are redirected to this address — use during local testing
// Exported for unit testing only
export function to(address: string): string {
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
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('nicola@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (checkin summary): ${error.message}`)
  return data?.id ?? null
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

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('nicola@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (survey handling alert): ${error.message}`)
  return data?.id ?? null
}

export async function sendEthicsThresholdAlert(params: {
  subjectType: 'EMPLOYEE' | 'APPLICANT'
  count: number
}): Promise<string | null> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('nicola@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (ethics threshold alert): ${error.message}`)
  return data?.id ?? null
}

export async function sendCorrectionFiled(params: {
  employeeName: string
  severity: string
  incident: string
  correctionId: string
}): Promise<string | null> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('nicola@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (correction filed): ${error.message}`)
  return data?.id ?? null
}

export async function sendCorrectionExecutiveApproval(params: {
  employeeName: string
  action: string
  incident: string
  token: string
}): Promise<string | null> {
  const actionLabel = params.action.replace(/_/g, ' ').toLowerCase()
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('avi@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (correction exec approval): ${error.message}`)
  return data?.id ?? null
}

export async function sendOffboardingStarted(params: {
  employeeName: string
  reason: string
  finalDay: string | null
  caseId: string
}): Promise<string | null> {
  const reasonLabel = params.reason.charAt(0) + params.reason.slice(1).toLowerCase()
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('nicola@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (offboarding started): ${error.message}`)
  return data?.id ?? null
}

export async function sendOffboardingCeoApproval(params: {
  employeeName: string
  reason: string
  token: string
}): Promise<string | null> {
  const reasonLabel = params.reason.charAt(0) + params.reason.slice(1).toLowerCase()
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: to('avi@exchangefour.com'),
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
  if (error) throw new Error(`Resend error (offboarding CEO approval): ${error.message}`)
  return data?.id ?? null
}
