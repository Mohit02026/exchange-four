import { db } from '@/lib/db'
import { generateToken } from '@/lib/utils/tokens'
import { writeAuditLog } from '@/lib/utils/audit'

// ─── Template builder ─────────────────────────────────────────────────────────
// Pre-fills all structured data from the application and review.
// Subjective sections (Recommendation, Assessment) are left blank for Nicola.

function blank(label: string): string {
  return `[${label}]`
}

function val(v: string | null | undefined, fallback = 'Not yet collected'): string {
  return v?.trim() || fallback
}

function buildTemplate(
  app: Awaited<ReturnType<typeof getApplicationForCSW>>,
): { content: string; sourceFields: Record<string, string>; missingFields: string[] } {
  if (!app) throw new Error('Application not found')

  const sourceFields: Record<string, string> = {}
  const missingFields: string[] = []

  function field(label: string, value: string | null | undefined): string {
    const v = value?.trim()
    if (v) { sourceFields[label] = v; return v }
    missingFields.push(label)
    return 'Not yet collected'
  }

  const applicantName = `${app.applicant.firstName} ${app.applicant.lastName}`
  const positionTitle = app.position?.title ?? 'General Application'
  const orgBoard = app.position?.orgBoardUnit?.name ?? null
  const review = app.review
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const reviewSections = review?.sections ?? []
  function rs(name: string): string {
    const s = reviewSections.find((r) => r.section === name)
    if (!s) return 'Not yet collected'
    return `${s.rating ?? 'Not rated'}${s.notes ? ` — ${s.notes}` : ''}`
  }

  const stdMissing = [
    'Education / Training / Certifications',
    'Video review',
    'Performia assessment',
    'Interview notes',
    'Reference checks',
    'Background check',
    'Compensation expectation',
    'Proposed start date',
  ]

  const content = `COMPLETED STAFF WORK — HIRE PROPOSAL
Exchange Four Personnel Desk
${today}

Prepared by: Nicola (HR — Exchange Four Personnel Desk)
Submitted to: Avi (Executive Director)
Reference: ${app.reference}


1. SITUATION

${applicantName} has applied for the position of ${field('Position', positionTitle)} at Exchange Four. This document presents a complete hire/no-hire proposal for Avi's decision. All available data has been reviewed and a recommendation is stated in section 2. Please approve or disapprove by ${deadline}.


2. RECOMMENDATION

${blank('State your recommendation: "I recommend we proceed to hire [name] for [position]" OR "I recommend we do not proceed with [name]" OR "I recommend [name] be held as a future prospect." State the single most important reason.')}


3. APPLICANT NAME AND REFERENCE

Name: ${applicantName}
Reference: ${app.reference}
Email: ${field('Email', app.applicant.correspondenceEmail)}
Phone: ${field('Phone', app.applicant.phone)}
Location: ${field('Location', app.applicant.location)}


4. POSITION AND ORG BOARD LOCATION

Position: ${field('Position', positionTitle)}
Org Board Unit: ${field('Org Board Unit', orgBoard)}


5. SOURCE OF APPLICATION

${app.isGeneralApplication ? 'General Application (no specific position selected)' : `Applied for open position: ${positionTitle}`}
Application received via: Exchange Four Personnel Desk portal


6. RESUME SUMMARY

Review — Resume Presentation: ${rs('Resume Presentation')}

${blank('Review the CV and write a brief resume summary here')}


7. WORK EXPERIENCE SUMMARY

${field('Bio / Background', app.bio)}

Review — Work History: ${rs('Work History')}


8. STABILITY AND JOB-HISTORY NOTES

Review — Job Stability: ${rs('Job Stability')}
Review — Employment Gaps: ${rs('Employment Gaps')}


9. SKILLS RELEVANT TO THE POST

Applicant stated skills:
${field('Skills', app.skills)}

Review — Skills Match: ${rs('Skills Match')}
Review — Immediate Qualifications: ${rs('Immediate Qualifications')}
Review — Position Fit: ${rs('Position Fit')}


10. EDUCATION, TRAINING AND CERTIFICATIONS

Not yet collected


11. HOBBIES AND SELF-IMPROVEMENT

${field('Hobbies', app.hobbies)}

Career goals: ${field('Career Goals', app.careerGoals)}
Why Exchange Four: ${field('Why Exchange Four', app.whyExchangeFour)}


12. VIDEO SUMMARY

Review — Communication Impression: ${rs('Communication Impression')}

${blank('Note observations from the applicant video — presentation, communication, energy, professionalism')}


13. PERFORMIA / TEST RESULTS

Not yet collected


14. INTERVIEW NOTES

Not yet collected


15. REFERENCE NOTES

Not yet collected


16. BACKGROUND CHECK STATUS

Not yet collected


17. NICOLA'S VIEWPOINT

${val(review?.notesForAvi, blank('Write your viewpoint on this candidate — your professional assessment for Avi'))}

Review — Strengths: ${rs('Strengths')}
Review — Outpoints / Red Flags: ${rs('Outpoints / Red Flags')}
Review — Missing Data: ${rs('Missing Data')}


18. STRENGTHS

${blank('Summarise the key strengths of this candidate for the position')}


19. OUTPOINTS / RISKS

${blank('Summarise any red flags, gaps, or risks honestly — do not omit these')}


20. COMPENSATION EXPECTATION

Not yet collected


21. PROPOSED COMPENSATION

${blank('State proposed compensation offer')}


22. PROPOSED START DATE

${blank('State proposed start date')}


23. MISSING DATA

The following information was not available at the time of this proposal:
${[...missingFields, ...stdMissing].map((f) => `- ${f}`).join('\n')}

${blank('Note any missing items that would materially change this recommendation')}


24. DECISION REQUESTED FROM AVI

${blank('State precisely what you are asking Avi to decide — e.g. "Approve the hire of [name] for [position] at [proposed comp], starting [proposed date]."')}

Decision required by: ${deadline}
Approval link: [APPROVAL LINK — inserted automatically when sent]
`

  return { content, sourceFields, missingFields }
}

// ─── DB queries ──────────────────────────────────────────────────────────────

export async function getApplicationForCSW(applicationId: string) {
  return db.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: true,
      position: {
        select: {
          title: true,
          orgBoardUnit: { select: { name: true } },
        },
      },
      review: { include: { sections: true } },
    },
  })
}

export async function getCSWById(id: string) {
  return db.cSWReport.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          applicant: true,
          position: { select: { title: true } },
          review: { include: { sections: true } },
        },
      },
    },
  })
}

export async function getCSWByApplicationId(applicationId: string) {
  return db.cSWReport.findUnique({ where: { applicationId } })
}

// ─── Operations ──────────────────────────────────────────────────────────────

export async function generateCSWDraft(applicationId: string, userId: string): Promise<string> {
  const app = await getApplicationForCSW(applicationId)
  if (!app) throw new Error('Application not found')
  if (!app.review) throw new Error('Review must be completed before generating a CSW')

  const { content, sourceFields, missingFields } = buildTemplate(app)

  const existing = await db.cSWReport.findUnique({ where: { applicationId } })

  let csw
  if (existing) {
    csw = await db.cSWReport.update({
      where: { applicationId },
      data: { content, sourceFields, missingFields, status: 'DRAFT' },
    })
  } else {
    csw = await db.cSWReport.create({
      data: { applicationId, content, sourceFields, missingFields, status: 'DRAFT' },
    })
  }

  await db.application.update({
    where: { id: applicationId },
    data: { status: 'CSW_GENERATED' },
  })

  await writeAuditLog({
    action: 'CSW_GENERATED',
    entityType: 'Application',
    entityId: applicationId,
    userId,
    metadata: { cswId: csw.id, missingCount: missingFields.length },
  })

  return csw.id
}

export async function updateCSWContent(id: string, content: string) {
  return db.cSWReport.update({ where: { id }, data: { content } })
}

export async function approveAndSend(id: string, userId: string) {
  const csw = await db.cSWReport.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          applicant: true,
          position: { select: { title: true } },
        },
      },
    },
  })
  if (!csw) throw new Error('CSW not found')

  const token = generateToken('EX4-APPROVE')
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const existing = await db.approvalRequest.findUnique({
    where: { applicationId: csw.applicationId },
  })

  let approvalRequest
  if (existing) {
    approvalRequest = await db.approvalRequest.update({
      where: { applicationId: csw.applicationId },
      data: { token, tokenExpiry: expiry, tokenUsed: false },
    })
  } else {
    approvalRequest = await db.approvalRequest.create({
      data: {
        applicationId: csw.applicationId,
        token,
        tokenExpiry: expiry,
      },
    })
  }

  await Promise.all([
    db.cSWReport.update({
      where: { id },
      data: { status: 'SENT', approvedAt: new Date(), approvedById: userId },
    }),
    db.application.update({
      where: { id: csw.applicationId },
      data: { status: 'SENT_TO_AVI' },
    }),
  ])

  await writeAuditLog({
    action: 'CSW_SENT_TO_AVI',
    entityType: 'Application',
    entityId: csw.applicationId,
    userId,
    metadata: { cswId: id, approvalRequestId: approvalRequest.id },
  })

  return {
    token,
    applicantName: `${csw.application.applicant.firstName} ${csw.application.applicant.lastName}`,
    reference: csw.application.reference,
    positionTitle: csw.application.position?.title ?? null,
  }
}
