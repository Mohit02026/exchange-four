import DisciplinaryTimeline from '@/components/hr/DisciplinaryTimeline'
import CorrectionAlertBadge from '@/components/hr/CorrectionAlertBadge'
import Link from 'next/link'

interface Correction {
  id: string
  severity: string
  action: string | null
  status: string
  incident: string
  correctionRequested: string
  resolution: string | null
  followUpDate: string | null
  requiresExecutiveApproval: boolean
  executiveDecision: string | null
  createdAt: string
  submittedBy: { name: string | null; email: string }
}

interface CorrectionsTabProps {
  corrections: Correction[]
  employeeId: string
}

export default function CorrectionsTab({ corrections, employeeId }: CorrectionsTabProps) {
  const open = corrections.filter(c => c.status !== 'RESOLVED').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Disciplinary Record</h3>
          <CorrectionAlertBadge count={open} />
        </div>
        <Link
          href={`/hr/corrections/new?employeeId=${employeeId}`}
          style={{
            fontSize: 13, background: '#1a1a1a', color: '#fff',
            padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontWeight: 600,
          }}
        >
          + File Correction
        </Link>
      </div>
      <DisciplinaryTimeline corrections={corrections} />
    </div>
  )
}
