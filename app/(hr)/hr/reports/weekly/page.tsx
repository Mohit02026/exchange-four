export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { generateWeeklyReport } from '@/lib/services/reports'
import SendReportButton from '@/components/hr/SendReportButton'

export default async function WeeklyReportPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const report = await generateWeeklyReport()

  const weekOf = new Date(report.weekStart).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hasAlerts =
    report.awaitingAction.pendingNicolaReview > 0 ||
    report.awaitingAction.pendingAviApproval > 0 ||
    report.awaitingAction.correctionsExecPending > 0 ||
    report.awaitingAction.offboardingCeoPending > 0 ||
    report.ethics.openReports > 0 ||
    report.corrections.open > 0

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Reports
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Weekly Personnel Report</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Week of {weekOf}</p>
        </div>
        <SendReportButton />
      </div>

      {/* This Week */}
      <Section title="This Week">
        <StatRow label="New applications" value={report.thisWeek.newApplications} color="#2563eb" />
        <StatRow label="New hires started" value={report.thisWeek.newHires} color="#16a34a" />
        <StatRow label="Interviews completed" value={report.thisWeek.interviewsCompleted} color="#059669" />
      </Section>

      {/* Pipeline */}
      <Section title="Pipeline">
        <StatRow label="New (unreviewed)" value={report.pipeline.submitted} />
        <StatRow label="Under review" value={report.pipeline.underReview} />
        <StatRow label="Sent to Avi" value={report.pipeline.sentToAvi} />
        <StatRow label="Exec approved" value={report.pipeline.execApproved} color="#059669" />
        <StatRow label="Interview scheduled" value={report.pipeline.interviewScheduled} color="#16a34a" />
        <StatRow label="Start date requested" value={report.pipeline.startDateRequested} color="#ca8a04" />
        <StatRow label="Hired (all time)" value={report.pipeline.hired} color="#15803d" />
        <StatRow label="Rejected / disapproved" value={report.pipeline.rejected + report.pipeline.execDisapproved} color="#dc2626" />
      </Section>

      {/* Alerts */}
      {hasAlerts && (
        <Section title="⚠ Requires Attention" titleColor="#dc2626" bg="#fef2f2" border="#fca5a5">
          {report.awaitingAction.pendingNicolaReview > 0 && (
            <StatRow label="Pending Nicola review" value={report.awaitingAction.pendingNicolaReview} color="#d97706" />
          )}
          {report.awaitingAction.pendingAviApproval > 0 && (
            <StatRow label="Pending Avi approval" value={report.awaitingAction.pendingAviApproval} color="#0891b2" />
          )}
          {report.awaitingAction.correctionsExecPending > 0 && (
            <StatRow label="Corrections pending exec decision" value={report.awaitingAction.correctionsExecPending} color="#b45309" />
          )}
          {report.awaitingAction.offboardingCeoPending > 0 && (
            <StatRow label="Offboarding pending CEO approval" value={report.awaitingAction.offboardingCeoPending} color="#7c3aed" />
          )}
          {report.ethics.openReports > 0 && (
            <StatRow label="Open ethics reports" value={report.ethics.openReports} color="#dc2626" />
          )}
          {report.ethics.subjectsAtThreshold > 0 && (
            <StatRow label="Subjects at ethics threshold" value={report.ethics.subjectsAtThreshold} color="#dc2626" />
          )}
          {report.corrections.open > 0 && (
            <StatRow label="Open corrections" value={report.corrections.open} color="#dc2626" />
          )}
        </Section>
      )}

      {/* Onboarding */}
      <Section title="Onboarding">
        <StatRow label="Employees with onboarding plans" value={report.onboarding.total} />
        {report.onboarding.behind.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Behind (&lt;50% after 14 days)
            </div>
            {report.onboarding.behind.map((e) => (
              <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#374151' }}>
                <span>{e.name}</span>
                <span style={{ color: '#b45309', fontWeight: 600 }}>{e.completedPct}% — {e.daysSinceHire}d</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#16a34a', marginTop: 8 }}>All employees on track.</div>
        )}
      </Section>

      {/* Training */}
      <Section title="Training">
        <StatRow label="Employees with training plans" value={report.training.total} />
        {report.training.incomplete.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Incomplete
            </div>
            {report.training.incomplete.map((e) => (
              <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#374151' }}>
                <span>{e.name}</span>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>{e.completedPct}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#16a34a', marginTop: 8 }}>All training complete.</div>
        )}
      </Section>

      {/* Active Cases */}
      <Section title="Active Cases">
        <StatRow label="Offboarding in progress" value={report.offboarding.activeCases} />
        <StatRow label="Offboarding pending CEO" value={report.offboarding.pendingCeo} color={report.offboarding.pendingCeo > 0 ? '#7c3aed' : undefined} />
        <StatRow label="Ethics reports open" value={report.ethics.openReports} color={report.ethics.openReports > 0 ? '#dc2626' : undefined} />
        <StatRow label="Corrections open" value={report.corrections.open} color={report.corrections.open > 0 ? '#b45309' : undefined} />
        <StatRow label="Corrections pending exec" value={report.corrections.pendingExec} color={report.corrections.pendingExec > 0 ? '#b45309' : undefined} />
      </Section>

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
        Generated {new Date(report.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title,
  titleColor,
  bg,
  border,
  children,
}: {
  title: string
  titleColor?: string
  bg?: string
  border?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: bg ?? '#fff',
      border: `1px solid ${border ?? '#e5e7eb'}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${border ?? '#f3f4f6'}`,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: titleColor ?? '#9ca3af',
        background: bg ?? undefined,
      }}>
        {title}
      </div>
      <div style={{ padding: '12px 20px' }}>{children}</div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#374151' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700, color: color ?? '#111' }}>{value}</span>
    </div>
  )
}
