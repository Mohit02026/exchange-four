import { db } from '@/lib/db'
import PositionCard from '@/components/applicant/PositionCard'
import PositionsHero from '@/components/applicant/PositionsHero'

export const dynamic = 'force-dynamic'

export default async function PositionsPage() {
  const positions = await db.position.findMany({
    where: { status: 'OPEN' },
    include: { orgBoardUnit: true },
    orderBy: [{ createdAt: 'asc' }],
  })

  return (
    <>
      <PositionsHero count={positions.length} />

      <main
        id="positions"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 20,
        }}>
          Open Positions — {positions.length} available
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {positions.map((position, i) => (
            <PositionCard key={position.id} position={position} index={i} />
          ))}
        </div>
      </main>
    </>
  )
}
