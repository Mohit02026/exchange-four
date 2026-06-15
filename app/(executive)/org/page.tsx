export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrgData, getHeadcountByDepartment } from '@/lib/services/org'
import OrgGrid from '@/components/hr/OrgGrid'
import OrgTree from '@/components/hr/OrgTree'
import Link from 'next/link'

type SearchParams = Promise<{ view?: string }>

export default async function ExecutiveOrgPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'EXECUTIVE') redirect('/login')

  const { view } = await searchParams
  const showTree = view === 'tree'

  const employees = await getOrgData()
  const headcount = await getHeadcountByDepartment(employees)

  const totalActive = employees.filter((e) => !e.isOnboarding).length
  const totalOnboarding = employees.filter((e) => e.isOnboarding).length
  const totalAll = employees.length

  const newestHire = employees
    .filter((e) => e.startDate !== null)
    .sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime())[0] ?? null

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .org-in { animation: fadeUp 0.45s cubic-bezier(0,0,0.2,1) 0.08s both; }
        .metric-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(15,30,53,0.14) !important;
        }
        .view-btn {
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
      `}</style>

      {/* ── Hero header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #070E1A 0%, #0F1E35 45%, #162B4D 100%)',
        borderRadius: 16,
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
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(201,160,32,0.15)',
                  border: '1px solid rgba(201,160,32,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  🏢
                </div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                  Org Board
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                {totalAll} employee{totalAll !== 1 ? 's' : ''} · {totalActive} active · {totalOnboarding} onboarding
              </p>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(201,160,32,0.15)',
              border: '1px solid rgba(201,160,32,0.25)',
              color: '#C9A020',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Read-only
            </span>
          </div>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div className="org-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="metric-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          boxShadow: '0 1px 6px rgba(15,30,53,0.06)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy-800)', lineHeight: 1 }}>{totalAll}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Total Staff</div>
        </div>

        <div className="metric-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          boxShadow: '0 1px 6px rgba(15,30,53,0.06)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-green)', lineHeight: 1 }}>{totalActive}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Active</div>
        </div>

        <div className="metric-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          boxShadow: '0 1px 6px rgba(15,30,53,0.06)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-amber)', lineHeight: 1 }}>{totalOnboarding}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Onboarding</div>
        </div>

        {newestHire && (
          <div className="metric-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 1px 6px rgba(15,30,53,0.06)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-800)', lineHeight: 1.3 }}>
              {newestHire.firstName} {newestHire.lastName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>Newest Hire</div>
          </div>
        )}
      </div>

      {/* ── Department pills ── */}
      {headcount.length > 0 && (
        <div className="org-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {headcount.map(({ department, count }) => (
            <span key={department} style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: 'var(--navy-800)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}>
              {department} <span style={{ opacity: 0.65, marginLeft: 3 }}>{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── View toggle + content ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(15,30,53,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-raised)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {showTree ? 'Hierarchy View' : 'Grid View'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/org?view=grid"
              className="view-btn"
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: !showTree ? 'var(--navy-800)' : 'transparent',
                color: !showTree ? '#fff' : 'var(--text-secondary)',
                border: !showTree ? '1px solid var(--navy-800)' : '1px solid var(--border-strong)',
              }}
            >
              Grid
            </Link>
            <Link
              href="/org?view=tree"
              className="view-btn"
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: showTree ? 'var(--navy-800)' : 'transparent',
                color: showTree ? '#fff' : 'var(--text-secondary)',
                border: showTree ? '1px solid var(--navy-800)' : '1px solid var(--border-strong)',
              }}
            >
              Tree
            </Link>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {showTree
            ? <OrgTree employees={employees} />
            : <OrgGrid employees={employees} />
          }
        </div>
      </div>
    </div>
  )
}
