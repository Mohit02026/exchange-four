export const dynamic = 'force-dynamic'

import { getHRStats } from '@/lib/services/stats'
import { getOpenCount, getEthicsAlerts } from '@/lib/services/ethics'
import { getOpenCorrectionCount } from '@/lib/services/corrections'
import { getActiveCaseCount } from '@/lib/services/offboarding'
import { getOnboardingAlerts } from '@/lib/services/alerts'
import { getAverageCompleteness } from '@/lib/services/completeness'
import AlertPanel from '@/components/hr/AlertPanel'
import Link from 'next/link'

export default async function HRDashboardPage() {
  const [stats, ethicsOpenCount, ethicsAlerts, openCorrections, activeOffboarding, onboardingAlerts, avgCompleteness] = await Promise.all([
    getHRStats(),
    getOpenCount(),
    getEthicsAlerts(),
    getOpenCorrectionCount(),
    getActiveCaseCount(),
    getOnboardingAlerts(),
    getAverageCompleteness(),
  ])

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

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
    <div style={{ padding: '36px 44px', maxWidth: 1080 }}>

      {/* ── Animation + hover styles ─────────────────────────── */}
      <style>{`
        @keyframes kpiIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kpi-1 { animation: kpiIn 0.42s cubic-bezier(0,0,0.2,1) 0.06s both; }
        .kpi-2 { animation: kpiIn 0.42s cubic-bezier(0,0,0.2,1) 0.13s both; }
        .kpi-3 { animation: kpiIn 0.42s cubic-bezier(0,0,0.2,1) 0.20s both; }
        .kpi-4 { animation: kpiIn 0.42s cubic-bezier(0,0,0.2,1) 0.27s both; }
        .panels-in { animation: fadeUp 0.5s cubic-bezier(0,0,0.2,1) 0.22s both; }
        .kpi-card {
          transition: transform 0.22s cubic-bezier(0,0,0.2,1),
                      box-shadow 0.22s cubic-bezier(0,0,0.2,1);
        }
        .kpi-card:hover {
          transform: translateY(-4px) scale(1.008);
          box-shadow: 0 20px 48px rgba(15,30,53,0.16),
                      0 6px 16px rgba(15,30,53,0.10) !important;
        }
        .panel-card {
          transition: box-shadow 0.22s cubic-bezier(0,0,0.2,1);
        }
        .panel-card:hover {
          box-shadow: 0 10px 32px rgba(15,30,53,0.12),
                      0 2px 8px rgba(15,30,53,0.07) !important;
        }
        .mini-stat {
          transition: transform 0.22s cubic-bezier(0,0,0.2,1),
                      box-shadow 0.22s cubic-bezier(0,0,0.2,1);
        }
        .mini-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(15,30,53,0.14),
                      0 3px 8px rgba(15,30,53,0.08) !important;
        }
        .pill-link {
          transition: background 0.15s ease, color 0.15s ease,
                      border-color 0.15s ease, transform 0.15s ease,
                      box-shadow 0.15s ease;
        }
        .pill-link:hover {
          background: var(--navy-900) !important;
          color: #fff !important;
          border-color: var(--navy-800) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,30,53,0.18);
        }
        .pipeline-bar {
          transition: width 0.6s cubic-bezier(0,0,0.2,1);
        }
      `}</style>

      {/* ── Hero header ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #070E1A 0%, #0F1E35 45%, #162B4D 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '26px 32px 24px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(15,30,53,0.32), 0 1px 4px rgba(15,30,53,0.14)',
      }}>
        {/* Gold corner glow */}
        <div style={{
          position: 'absolute', top: -80, right: -50,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,160,32,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Fine grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
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
              Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>
              Live overview of your personnel pipeline
            </p>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)', letterSpacing: '-0.01em' }}>
              {dateStr}
            </div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4,
              fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
            }}>
              Week {weekNum}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <KPICard className="kpi-card kpi-1"
          label="Total Applications" value={stats.total}
          color="var(--navy-700)" accent="var(--navy-700)"
        />
        <KPICard className="kpi-card kpi-2"
          label="New This Week" value={stats.newThisWeek}
          color="var(--color-primary)" accent="#2748A0"
          sub={weekTrend !== null
            ? `${weekTrend >= 0 ? '↑' : '↓'} ${Math.abs(weekTrend)}% vs last week`
            : `${stats.newLastWeek} last week`}
          subColor={
            weekTrend !== null && weekTrend > 0 ? 'var(--status-green-text)'
            : weekTrend !== null && weekTrend < 0 ? 'var(--status-red-text)'
            : 'var(--text-muted)'}
        />
        <KPICard className="kpi-card kpi-3"
          label="Interviews Scheduled" value={stats.interviewsScheduled}
          color="#059669" accent="#059669"
        />
        <KPICard className="kpi-card kpi-4"
          label="Employees Hired" value={stats.onboarding.employees}
          color="var(--gold-dark)" accent="var(--gold)"
        />
      </div>

      {/* ── Quick nav ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { href: '/hr/applications', label: 'Applications' },
          { href: '/hr/onboarding', label: 'Onboarding' },
          { href: '/hr/employees', label: 'Employees' },
          { href: '/hr/positions', label: 'Positions' },
          { href: '/hr/training', label: 'Training' },
          { href: '/hr/ethics', label: 'Ethics' },
          { href: '/hr/reports/weekly', label: 'Reports' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="pill-link" style={{
            padding: '5px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Alert banners ───────────────────────────────────── */}
      {activeOffboarding > 0 && (
        <AlertBanner color="var(--navy-700)" bg="var(--surface-raised)" border="var(--border)"
          text={`${activeOffboarding} offboarding case${activeOffboarding !== 1 ? 's' : ''} in progress`}
          href="/hr/offboarding"
        />
      )}
      {openCorrections > 0 && (
        <AlertBanner color="#92400e" bg="#fffbeb" border="#fde68a"
          text={`${openCorrections} open correction${openCorrections !== 1 ? 's' : ''} require attention`}
          href="/hr/corrections"
        />
      )}
      {(ethicsOpenCount > 0 || ethicsAlertCount > 0) && (
        <AlertBanner color="#dc2626" bg="#fef2f2" border="#fecaca"
          text={`Ethics: ${ethicsOpenCount} open report${ethicsOpenCount !== 1 ? 's' : ''}${ethicsAlertCount > 0 ? ` · ${ethicsAlertCount} subject${ethicsAlertCount !== 1 ? 's' : ''} at threshold` : ''}`}
          href="/hr/ethics"
        />
      )}
      {onboardingAlerts.length > 0 && (
        <AlertPanel alerts={onboardingAlerts} />
      )}

      {/* ── Avg completeness ────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid #0ea5e9',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 8px rgba(15,30,53,0.07)',
      }}>
        <span style={{
          fontSize: 30, fontWeight: 800, color: '#0ea5e9',
          letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
        }}>
          {avgCompleteness}%
        </span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Average Profile Completeness
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            across all staff profiles · <a href="/hr/employees" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>View profiles →</a>
          </div>
        </div>
      </div>

      {/* ── Main panels ─────────────────────────────────────── */}
      <div className="panels-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>

        <Panel title="Pipeline">
          {stats.pipeline.length === 0 ? (
            <Empty>No applications yet.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats.pipeline.map((s) => (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-muted)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div className="pipeline-bar" style={{
                      height: 6,
                      borderRadius: 9999,
                      background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}BB 100%)`,
                      width: `${Math.round((s.count / pipelineMax) * 100)}%`,
                      minWidth: s.count > 0 ? 6 : 0,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Applications by Role">
            {stats.topPositions.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {stats.topPositions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', borderRadius: 5, flexShrink: 0,
                      background: i === 0 ? 'rgba(201,160,32,0.14)' : 'var(--surface-muted)',
                      fontSize: 10, fontWeight: 800,
                      color: i === 0 ? 'var(--gold-dark)' : 'var(--text-muted)',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <MiniStat label="CSWs Generated" value={stats.cswGenerated} color="var(--navy-700)" />
            <MiniStat
              label="Approval Rate"
              value={approvalPct !== null ? `${approvalPct}%` : '—'}
              sub={approvalTotal > 0 ? `${stats.approvals.approved}/${approvalTotal} approved` : 'No decisions yet'}
              color="#059669"
            />
            <MiniStat
              label="Onboarding"
              value={onboardingPct !== null ? `${onboardingPct}%` : '—'}
              sub={stats.onboarding.tasksTotal > 0
                ? `${stats.onboarding.tasksComplete}/${stats.onboarding.tasksTotal} tasks`
                : 'No tasks yet'}
              color="#7c3aed"
            />
            <MiniStat label="Disapproved" value={stats.approvals.disapproved} color="var(--status-red)" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ label, value, color, accent, sub, subColor, className }: {
  label: string; value: number; color: string; accent: string
  sub?: string; subColor?: string; className?: string
}) {
  return (
    <div className={className} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(15,30,53,0.07), 0 1px 3px rgba(15,30,53,0.05)',
    }}>
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: '22px 22px 18px' }}>
        <div style={{
          fontSize: 48, fontWeight: 800, color,
          letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', marginTop: 10,
          fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: subColor ?? 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(15,30,53,0.07), 0 1px 3px rgba(15,30,53,0.04)',
    }}>
      <div style={{
        padding: '13px 20px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--surface-raised) 0%, var(--surface) 100%)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 3, height: 14, background: 'var(--gold)', borderRadius: 2, flexShrink: 0 }} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: 'var(--text-secondary)',
        }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

function MiniStat({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="mini-stat" style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      padding: '18px 16px 14px',
      boxShadow: '0 2px 8px rgba(15,30,53,0.07), 0 1px 3px rgba(15,30,53,0.04)',
    }}>
      <div style={{
        fontSize: 28, fontWeight: 800, color,
        letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--text-muted)', marginTop: 8,
        fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function AlertBanner({ color, bg, border, text, href }: {
  color: string; bg: string; border: string; text: string; href: string
}) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 20px',
      marginBottom: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      boxShadow: '0 1px 4px rgba(15,30,53,0.06)',
    }}>
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{text}</span>
      <Link href={href} style={{ fontSize: 12, color, textDecoration: 'none', fontWeight: 700, flexShrink: 0 }}>
        Review →
      </Link>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
      {children}
    </div>
  )
}
