export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getDisciplinaryAction } from '@/lib/services/disciplinary'
import DisciplinaryUpdateForm from '@/components/hr/DisciplinaryUpdateForm'
import Link from 'next/link'

const TYPE_COLOR: Record<string, string> = {
  VERBAL_WARNING: '#d97706',
  WRITTEN_WARNING: '#ea580c',
  FINAL_WARNING: '#dc2626',
  PERFORMANCE_IMPROVEMENT_PLAN: '#2563eb',
  SUSPENSION: '#7c3aed',
  TERMINATION: '#7f1d1d',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#d97706',
  ACKNOWLEDGED: '#2563eb',
  APPEALED: '#7c3aed',
  CLOSED: '#16a34a',
  EXPUNGED: '#6b7280',
}

const TYPE_LABEL: Record<string, string> = {
  VERBAL_WARNING: 'Verbal Warning',
  WRITTEN_WARNING: 'Written Warning',
  FINAL_WARNING: 'Final Warning',
  PERFORMANCE_IMPROVEMENT_PLAN: 'Performance Improvement Plan',
  SUSPENSION: 'Suspension',
  TERMINATION: 'Termination',
}

export default async function DisciplinaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { id } = await params
  const raw = await getDisciplinaryAction(id)
  if (!raw) notFound()

  const a = JSON.parse(JSON.stringify(raw))
  const empName = `${a.employee.firstName} ${a.employee.lastName}`

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        <Link href="/hr/disciplinary" style={{ color: '#9ca3af', textDecoration: 'none' }}>Disciplinary</Link> /
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 22, fontWeight: 700 }}>{empName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: TYPE_COLOR[a.type] ?? '#6b7280', color: '#fff',
            }}>
              {TYPE_LABEL[a.type] ?? a.type}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: (STATUS_COLOR[a.status] ?? '#6b7280') + '22',
              color: STATUS_COLOR[a.status] ?? '#6b7280',
              border: `1px solid ${STATUS_COLOR[a.status] ?? '#6b7280'}44`,
            }}>
              {a.status}
            </span>
          </div>
        </div>
        <Link
          href={`/hr/employees/${a.employee.id}`}
          style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
        >
          View Employee Profile →
        </Link>
      </div>

      {/* Key info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <InfoCard label="Incident date" value={new Date(a.incidentDate).toLocaleDateString()} />
        <InfoCard label="Filed on" value={new Date(a.createdAt).toLocaleDateString()} />
        {a.witnessName && <InfoCard label="Witness" value={a.witnessName} />}
        {a.employeeAcknowledged && (
          <InfoCard
            label="Acknowledged"
            value={a.employeeAcknowledgedAt ? new Date(a.employeeAcknowledgedAt).toLocaleDateString() : 'Yes'}
          />
        )}
        {a.resolvedAt && <InfoCard label="Resolved" value={new Date(a.resolvedAt).toLocaleDateString()} />}
        {a.resolvedBy && <InfoCard label="Resolved by" value={a.resolvedBy} />}
      </div>

      <Section title="Incident Description">
        <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.incidentDescription}</p>
      </Section>

      <Section title="Action Taken">
        <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.actionTaken}</p>
      </Section>

      {a.outcome && (
        <Section title="Outcome">
          <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.outcome}</p>
        </Section>
      )}

      {/* Timeline */}
      <Section title="Timeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TimelineItem label="Filed" date={a.createdAt} />
          {a.employeeAcknowledgedAt && <TimelineItem label="Employee acknowledged" date={a.employeeAcknowledgedAt} />}
          {a.appealedAt && <TimelineItem label="Appealed" date={a.appealedAt} />}
          {a.resolvedAt && <TimelineItem label="Resolved" date={a.resolvedAt} />}
        </div>
      </Section>

      {/* Appeal section */}
      {a.status === 'APPEALED' && (
        <div style={{
          background: '#faf5ff', border: '1px solid #c4b5fd', borderRadius: 8,
          padding: '16px 20px', marginBottom: 24,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Appeal Filed</p>
          {a.appealNotes && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{a.appealNotes}</p>
          )}
          {a.appealOutcome ? (
            <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>Outcome: {a.appealOutcome}</p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Awaiting Avi&apos;s review.</p>
          )}
        </div>
      )}

      {/* Update form */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px' }}>
        <DisciplinaryUpdateForm
          actionId={a.id}
          currentStatus={a.status}
          currentOutcome={a.outcome ?? ''}
          currentAppealOutcome={a.appealOutcome ?? ''}
        />
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>{title}</h3>
      {children}
    </div>
  )
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>{new Date(date).toLocaleDateString()}</span>
    </div>
  )
}
