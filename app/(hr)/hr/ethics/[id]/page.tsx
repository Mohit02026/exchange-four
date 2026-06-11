import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getReportById } from '@/lib/services/ethics'
import EthicsTriageForm from '@/components/hr/EthicsTriageForm'

export const dynamic = 'force-dynamic'

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f0fdf4', text: '#166534' },
  MEDIUM: { bg: '#fffbeb', text: '#92400e' },
  HIGH: { bg: '#fff1f2', text: '#be123c' },
  SENSITIVE: { bg: '#1e1b4b', text: '#e0e7ff' },
}

export default async function EthicsReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const [user, hrUsers] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { ethicsAccess: true } }),
    db.user.findMany({ where: { role: 'HR' }, select: { id: true, name: true, email: true } }),
  ])
  const hasEthicsAccess = user?.ethicsAccess ?? false

  const report = await getReportById(id, hasEthicsAccess)
  if (!report) notFound()

  const subjectName = report.subjectEmployee
    ? `${report.subjectEmployee.firstName} ${report.subjectEmployee.lastName}`
    : report.subjectApplicant
    ? `${report.subjectApplicant.firstName} ${report.subjectApplicant.lastName}`
    : '—'

  const sev = SEVERITY_COLORS[report.severity] ?? SEVERITY_COLORS.LOW
  const serialized = JSON.parse(JSON.stringify(report))

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/hr/ethics" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
          ← All Reports
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{subjectName}</h1>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 9px',
          borderRadius: 9999,
          background: sev.bg,
          color: sev.text,
        }}>
          {report.severity}
        </span>
        {report.isSensitive && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999, background: '#1e1b4b', color: '#e0e7ff' }}>
            SENSITIVE
          </span>
        )}
      </div>

      {/* Report details */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          <Field label="Category" value={report.category} />
          <Field label="Subject Type" value={report.subjectType} />
          <Field label="Status" value={report.status.replace('_', ' ')} />
          <Field label="Filed" value={new Date(report.createdAt).toLocaleString()} />
          <Field label="Reporter" value={report.reporter.name ?? report.reporter.email} />
          <Field label="Assigned Handler" value={report.assignedHandler?.name ?? report.assignedHandler?.email ?? '—'} />
        </dl>

        <div style={{ marginTop: 16 }}>
          <dt style={dtStyle}>Description</dt>
          <dd style={{ ...ddStyle, marginTop: 4, whiteSpace: 'pre-wrap' }}>{report.description}</dd>
        </div>

        {report.witnesses && (
          <div style={{ marginTop: 12 }}>
            <dt style={dtStyle}>Witnesses</dt>
            <dd style={ddStyle}>{report.witnesses}</dd>
          </div>
        )}

        {report.evidenceUrl && (
          <div style={{ marginTop: 12 }}>
            <dt style={dtStyle}>Evidence</dt>
            <dd style={ddStyle}>
              <a href={report.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                View evidence ↗
              </a>
            </dd>
          </div>
        )}

        {report.triageNotes && (
          <div style={{ marginTop: 12 }}>
            <dt style={dtStyle}>Triage Notes</dt>
            <dd style={{ ...ddStyle, whiteSpace: 'pre-wrap', background: '#fffbeb', padding: '8px 12px', borderRadius: 6 }}>
              {report.triageNotes}
            </dd>
          </div>
        )}

        {report.outcome && (
          <div style={{ marginTop: 12 }}>
            <dt style={dtStyle}>Outcome</dt>
            <dd style={{ ...ddStyle, whiteSpace: 'pre-wrap' }}>{report.outcome}</dd>
          </div>
        )}
      </div>

      {/* Triage / update form */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#374151' }}>Update Report</h2>
        <EthicsTriageForm
          reportId={id}
          currentStatus={serialized.status}
          currentTriageNotes={serialized.triageNotes ?? ''}
          currentAssignedHandlerId={serialized.assignedHandlerId ?? ''}
          currentOutcome={serialized.outcome ?? ''}
          hrUsers={hrUsers}
        />
      </div>
    </div>
  )
}

const dtStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }
const ddStyle: React.CSSProperties = { margin: 0, fontSize: 14, color: '#111' }

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={dtStyle}>{label}</dt>
      <dd style={ddStyle}>{value}</dd>
    </div>
  )
}
