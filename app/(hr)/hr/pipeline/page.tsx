export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import KanbanBoard from '@/components/hr/KanbanBoard'
import PipelineMetrics from '@/components/hr/PipelineMetrics'

type PipelineCard = {
  id: string
  applicantName: string
  position: string | null
  daysInStage: number
  status: string
}

export default async function PipelinePage() {
  const applications = await db.application.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      applicant: { select: { firstName: true, lastName: true } },
      position: { select: { title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const grouped: Record<string, PipelineCard[]> = {}

  for (const app of applications) {
    const card: PipelineCard = {
      id: app.id,
      applicantName: `${app.applicant.firstName} ${app.applicant.lastName}`,
      position: app.position?.title ?? null,
      daysInStage: Math.floor((Date.now() - app.updatedAt.getTime()) / 86400000),
      status: app.status,
    }
    if (!grouped[app.status]) grouped[app.status] = []
    grouped[app.status].push(card)
  }

  return (
    <div style={{ padding: '36px 44px' }}>

      <div style={{
        background: 'linear-gradient(135deg, #070E1A 0%, #0F1E35 45%, #162B4D 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '26px 32px 24px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(15,30,53,0.32), 0 1px 4px rgba(15,30,53,0.14)',
      }}>
        <div style={{
          position: 'absolute', top: -80, right: -50,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,160,32,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10,
          }}>
            <div style={{ width: 18, height: 1.5, background: 'var(--gold)', borderRadius: 1 }} />
            Personnel Command
            <div style={{ width: 18, height: 1.5, background: 'var(--gold)', borderRadius: 1 }} />
          </div>
          <h1 style={{
            margin: '0 0 7px', fontSize: 30, fontWeight: 800,
            color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            Hiring Pipeline
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>
            Live view of all active applications by stage
          </p>
        </div>
      </div>

      <PipelineMetrics cards={grouped} />
      <KanbanBoard cards={grouped} />

    </div>
  )
}
