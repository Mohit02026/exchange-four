import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const position = await db.position.findFirst({
    where: { id, status: 'OPEN' },
    include: { orgBoardUnit: true },
  })

  if (!position) notFound()

  const meta = [
    position.orgBoardUnit?.name,
    position.employmentType,
    position.location,
  ].filter(Boolean)

  return (
    <>
      {/* Hero strip */}
      <div
        style={{
          background: 'var(--navy-900)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '40px 0 36px',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <Link
            href="/positions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: '#64748B',
              textDecoration: 'none',
              marginBottom: 20,
              transition: 'color 150ms ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All positions
          </Link>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {position.title}
          </h1>

          {meta.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {meta.map((m) => (
                <span
                  key={m}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'rgba(255,255,255,0.07)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {m}
                </span>
              ))}
              {position.compensationRange && (
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'rgba(201,168,76,0.1)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(201,168,76,0.2)',
                  }}
                >
                  {position.compensationRange}
                </span>
              )}
            </div>
          )}

          <Link
            href={`/apply?position=${position.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              background: 'var(--gold)',
              color: 'var(--navy-900)',
              transition: 'background 150ms ease',
            }}
          >
            Apply for this role
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {position.purpose && (
            <Section title="About the Role">
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {position.purpose}
              </p>
            </Section>
          )}

          {position.valuableFinalProduct && (
            <Section title="Valuable Final Product">
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {position.valuableFinalProduct}
              </p>
            </Section>
          )}

          {position.requiredSkills && (
            <Section title="Required Skills">
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                {position.requiredSkills}
              </p>
            </Section>
          )}

          {/* CTA */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Ready to apply?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Takes about 10 minutes. We review every application personally.
              </p>
            </div>
            <Link
              href={`/apply?position=${position.id}`}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 24px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                transition: 'background 150ms ease',
              }}
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        style={{
          margin: '0 0 12px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}
