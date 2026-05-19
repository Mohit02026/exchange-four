import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getApprovalByToken, recordTokenOpen } from '@/lib/services/approvals'
import ApprovalView from '@/components/executive/ApprovalView'

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const request = await getApprovalByToken(token)

  if (!request) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>Exchange Four</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>Invalid Link</h1>
        <p style={{ color: '#4b5563', marginTop: 12 }}>This approval link is not valid. Please contact Nicola if you believe this is an error.</p>
      </div>
    )
  }

  if (request.tokenExpiry < new Date()) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280' }}>Exchange Four</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>Link Expired</h1>
        <p style={{ color: '#4b5563', marginTop: 12 }}>This approval link has expired. Please ask Nicola to resend the CSW.</p>
      </div>
    )
  }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? null
  await recordTokenOpen(token, ip)

  const app = request.application
  const data = {
    alreadyDecided: !!request.decision,
    decision: request.decision
      ? { decision: request.decision.decision as string, reason: request.decision.reason ?? null, notes: request.decision.notes ?? null }
      : null,
    applicant: {
      firstName: app.applicant.firstName,
      lastName: app.applicant.lastName,
      email: app.applicant.correspondenceEmail,
      phone: app.applicant.phone ?? null,
      location: app.applicant.location ?? null,
      bio: app.bio ?? null,
      skills: app.skills ?? null,
      hobbies: app.hobbies ?? null,
      careerGoals: app.careerGoals ?? null,
      whyExchangeFour: app.whyExchangeFour ?? null,
    },
    application: {
      id: app.id,
      reference: app.reference,
      status: app.status as string,
      positionTitle: app.position?.title ?? null,
      isGeneralApplication: app.isGeneralApplication,
      submittedAt: app.submittedAt.toISOString(),
    },
    review: app.review
      ? {
          status: app.review.status as string,
          notesForAvi: app.review.notesForAvi ?? null,
          sections: app.review.sections.map((s) => ({
            section: s.section,
            rating: s.rating ?? null,
            notes: s.notes ?? null,
          })),
        }
      : null,
    csw: app.csw ? { id: app.csw.id, content: app.csw.content, status: app.csw.status as string } : null,
    files: app.files.map((f) => ({
      id: f.id,
      type: f.type as string,
      url: f.fileUrl,
      name: f.fileName,
    })),
  }

  return <ApprovalView data={data} token={token} />
}
