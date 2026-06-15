export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getByInterviewToken } from '@/lib/services/interviews'

export default async function InterviewBookingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const event = await getByInterviewToken(token)

  if (!event) notFound()

  const { application } = event
  const applicantName = `${application.applicant.firstName} ${application.applicant.lastName}`
  const positionTitle = application.position?.title ?? 'General Application'
  const slug = process.env.GHL_CALENDAR_SLUG ?? ''

  if (!slug) notFound()

  const alreadyBooked = !!event.scheduledAt

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #070E1A 0%, #0F1E35 50%, #162B4D 100%)',
        padding: '32px 24px 28px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--gold)',
            marginBottom: 10,
          }}>
            Exchange Four · Personnel Desk
          </div>
          <h1 style={{
            margin: '0 0 6px', fontSize: 22, fontWeight: 800,
            color: '#fff', letterSpacing: '-0.02em',
          }}>
            Interview Booking
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
            {applicantName} · {positionTitle}
          </p>
          <p style={{
            margin: '8px 0 0', fontSize: 12,
            color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace',
          }}>
            {application.reference}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px' }}>
        {alreadyBooked ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid #059669',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Interview already booked
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
              Scheduled for{' '}
              {new Date(event.scheduledAt!).toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <>
            <p style={{
              margin: '0 0 20px', fontSize: 14,
              color: 'var(--text-secondary)', textAlign: 'center',
            }}>
              Hi {application.applicant.firstName}, please select a time that works for you.
            </p>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(15,30,53,0.08)',
            }}>
              <iframe
                src={`https://api.leadconnectorhq.com/widget/booking/${slug}`}
                style={{ width: '100%', border: 'none', display: 'block', minHeight: 680 }}
                scrolling="no"
                id={`${slug}_booking`}
              />
            </div>
            <script
              src="https://link.msgsndr.com/js/form_embed.js"
              type="text/javascript"
              async
            />
          </>
        )}
      </div>
    </div>
  )
}
