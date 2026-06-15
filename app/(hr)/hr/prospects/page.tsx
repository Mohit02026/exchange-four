export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { db } from '@/lib/db'
import ProspectList from '@/components/hr/ProspectList'

export default async function ProspectsPage() {
  const prospects = await db.prospect.findMany({
    orderBy: { createdAt: 'desc' },
    include: { position: { select: { title: true } } },
  })

  // Serialize for client component — Dates become strings
  const serialized = prospects.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    source: p.source as string,
    status: p.status as string,
    inviteSentAt: p.inviteSentAt?.toISOString() ?? null,
    position: p.position,
  }))

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1080 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Prospects
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link
          href="/hr/prospects/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 20px',
            background: 'var(--gold)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#0B1929',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            transition: 'opacity 0.15s',
          }}
        >
          + Add Prospect
        </Link>
      </div>

      <ProspectList initialProspects={serialized} />
    </div>
  )
}
