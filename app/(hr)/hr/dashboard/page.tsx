export const dynamic = 'force-dynamic'

import { getHRStats } from '@/lib/services/stats'
import { getOpenCount, getEthicsAlerts } from '@/lib/services/ethics'
import Link from 'next/link'

export default async function HRDashboardPage() {
  const [stats, ethicsOpenCount, ethicsAlerts] = await Promise.all([
    getHRStats(),
    getOpenCount(),
    getEthicsAlerts(),
  ])

  const ethicsAlertCount = ethicsAlerts.employeeAlerts.length + ethicsAlerts.applicantAlerts.length

  const pipelineMax = Math.max(...stats.pipeline.map((s) => s.count), 1)
  const approvalTotal = stats.approvals.approved + stats.approvals.disapproved
  const approvalPct = approvalTotal > 0
    ? Math.round((stats.approvals.approved / approvalTotal) * 100)
    : null
  const onboardingPct = stats.onboarding.tasksTotal > 0
    ? Math.round((stats.onboarding.tasksComplete / stats.onboarding.tasksTotal) * 100)
    : null
  const weekTrend = stats.newLastWeek > 0
    ? Math.round(((stats.newThisWeek - stats.newLastWeek) / stats.newLastWeek) * 100)
    : null

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <h1 style={{ margin: '0 0 32px', fontSize: 22, fontWeight: 700 }}>Dashboard</h1>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard label="Total Applications" value={stats.total} color="#111" />
        <KPICard
          label="New This Week"
          value={stats.newThisWeek}
          color="#2563eb"
          sub={
            weekTrend !== null
              ? `${weekTrend >= 0 ? '+' : ''}${weekTrend}% vs last week`
              : `${stats.newLastWeek} last week`
          }
          subColor={weekTrend !== null && weekTrend > 0 ? '#16a34a' : '#6b7280'}
        />
        <KPICard label="Interviews Scheduled" value={stats.interviewsScheduled} color="#16a34a" />
        <KPICard label="Employees Hired" value={stats.onboarding.employees} color="#7c3aed" />
      </div>

      {/* Ethics alert banner */}
      {(ethicsOpenCount > 0 || ethicsAlertCount > 0) && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          padding: '12px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
              Ethics: {ethicsOpenCount} open report{ethicsOpenCount !== 1 ? 's' : ''}
              {ethicsAlertCount > 0 && ` · ${ethicsAlertCount} subject${ethicsAlertCount !== 1 ? 's' : ''} at threshold`}
            </span>
          </div>
          <Link
            href="/hr/ethics"
            style={{ fontSize: 13, color: '#dc2626', textDecoration: 'none', fontWeight: 600 }}
          >
            Review →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Pipeline funnel */}
        <Panel title="Pipeline">
          {stats.pipeline.length === 0 ? (
            <Empty>No applications yet.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.pipeline.map((s) => (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#374151' }}>{s.label}</span>
                    <span style={{ fontWeight: 600, color: s.color }}>{s.count}</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 9999 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 9999,
                        background: s.color,
                        width: `${Math.round((s.count / pipelineMax) * 100)}%`,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Right column — top positions + mini stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top positions */}
          <Panel title="Applications by Role">
            {stats.topPositions.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.topPositions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ width: 16, textAlign: 'right', color: '#9ca3af', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    <span style={{ fontWeight: 600, color: '#111', flexShrink: 0 }}>{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Mini stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <MiniStat label="CSWs Generated" value={stats.cswGenerated} color="#0891b2" />
            <MiniStat
              label="Avi Approval Rate"
              value={approvalPct !== null ? `${approvalPct}%` : '—'}
              sub={approvalTotal > 0 ? `${stats.approvals.approved}/${approvalTotal}` : 'No decisions yet'}
              color="#059669"
            />
            <MiniStat
              label="Onboarding Progress"
              value={onboardingPct !== null ? `${onboardingPct}%` : '—'}
              sub={
                stats.onboarding.tasksTotal > 0
                  ? `${stats.onboarding.tasksComplete}/${stats.onboarding.tasksTotal} tasks`
                  : 'No tasks yet'
              }
              color="#7c3aed"
            />
            <MiniStat
              label="Exec Disapproved"
              value={stats.approvals.disapproved}
              color="#dc2626"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  color,
  sub,
  subColor,
}: {
  label: string
  value: number
  color: string
  sub?: string
  subColor?: string
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 30, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: subColor ?? '#9ca3af', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #f3f4f6',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: '#9ca3af',
      }}>
        {title}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>{children}</div>
}
