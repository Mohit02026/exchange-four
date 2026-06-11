export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getCorrectionById } from '@/lib/services/corrections'
import CorrectionUpdateForm from '@/components/hr/CorrectionUpdateForm'
import Link from 'next/link'

const SEVERITY_COLOR: Record<string, string> = {
  MINOR: '#6b7280',
  MODERATE: '#d97706',
  SERIOUS: '#ea580c',
  CRITICAL: '#dc2626',
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  RESOLVED: '#16a34a',
  ESCALATED: '#dc2626',
}

const ACTION_LABEL: Record<string, string> = {
  TRAINING_ONLY: 'Training only',
  VERBAL_WARNING: 'Verbal warning',
  WRITTEN_WARNING: 'Written warning',
  FINAL_WARNING: 'Final written warning',
  SUSPENSION: 'Suspension',
  TERMINATION_RECOMMENDATION: 'Termination recommendation',
  TRANSFER_DEMOTION_PROMOTION: 'Transfer / demotion / promotion',
}

export default async function CorrectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { id } = await params
  const raw = await getCorrectionById(id)
  if (!raw) notFound()

  const c = JSON.parse(JSON.stringify(raw))
  const empName = c.employee.user.name ?? c.employee.user.email
  const submitterName = c.submittedBy.name ?? c.submittedBy.email

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        <Link href="/hr/corrections" style={{ color: '#9ca3af', textDecoration: 'none' }}>Corrections</Link> /
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 22, fontWeight: 700 }}>{empName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: SEVERITY_COLOR[c.severity] ?? '#6b7280', color: '#fff',
            }}>{c.severity}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: (STATUS_COLOR[c.status] ?? '#6b7280') + '22',
              color: STATUS_COLOR[c.status] ?? '#6b7280',
              border: `1px solid ${STATUS_COLOR[c.status] ?? '#6b7280'}44`,
            }}>{c.status.replace('_', ' ')}</span>
            {c.action && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>{ACTION_LABEL[c.action] ?? c.action}</span>
            )}
          </div>
        </div>
        <Link
          href={`/hr/employees/${c.employeeId}`}
          style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
        >
          View Employee Profile →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <InfoCard label="Submitted by" value={submitterName} />
        <InfoCard label="Filed on" value={new Date(c.createdAt).toLocaleDateString()} />
        {c.followUpDate && <InfoCard label="Follow-up date" value={new Date(c.followUpDate).toLocaleDateString()} />}
        {c.policyInvolved && <InfoCard label="Policy involved" value={c.policyInvolved} />}
      </div>

      <Section title="Incident Description">
        <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.incident}</p>
      </Section>

      <Section title="Correction Requested">
        <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.correctionRequested}</p>
      </Section>

      {c.trainingAssigned && (
        <Section title="Training Assigned">
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{c.trainingAssigned}</p>
        </Section>
      )}

      {c.employeeResponse && (
        <Section title="Employee Response">
          <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.employeeResponse}</p>
        </Section>
      )}

      {c.hrNotes && (
        <Section title="HR Notes">
          <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.hrNotes}</p>
        </Section>
      )}

      {c.requiresExecutiveApproval && (
        <div style={{
          background: c.executiveDecision === 'APPROVED' ? '#f0fdf4' : c.executiveDecision === 'REJECTED' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${c.executiveDecision === 'APPROVED' ? '#bbf7d0' : c.executiveDecision === 'REJECTED' ? '#fca5a5' : '#fcd34d'}`,
          borderRadius: 8, padding: '12px 20px', marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 600 }}>Executive Approval</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {c.executiveDecision
              ? `${c.executiveDecision} on ${new Date(c.executiveDecidedAt).toLocaleDateString()}`
              : 'Awaiting Avi\'s decision — approval email sent.'}
          </p>
        </div>
      )}

      {c.resolution && (
        <Section title="Resolution">
          <p style={{ fontSize: 14, color: '#16a34a', margin: 0, lineHeight: 1.6 }}>{c.resolution}</p>
        </Section>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Update Correction</h3>
        <CorrectionUpdateForm
          correctionId={c.id}
          currentStatus={c.status}
          currentHrNotes={c.hrNotes ?? ''}
          currentResolution={c.resolution ?? ''}
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
