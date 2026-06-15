'use client'

import type { OrgEmployee } from '@/lib/services/org'

type Props = {
  employees: OrgEmployee[]
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

type TreeNode = OrgEmployee & { reports: TreeNode[] }

function buildTree(employees: OrgEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  for (const e of employees) {
    map.set(e.id, { ...e, reports: [] })
  }
  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.reports.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

function EmployeeCard({ emp, depth }: { emp: TreeNode; depth: number }) {
  const hasReports = emp.reports.length > 0
  const showChildren = depth < 3

  return (
    <div style={{ position: 'relative' }}>
      {/* Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(15,30,53,0.06)',
        marginBottom: 6,
        maxWidth: 380,
      }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: depth === 0 ? 'var(--navy-900)' : depth === 1 ? 'var(--navy-800)' : 'var(--navy-700)',
          color: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
          letterSpacing: '0.04em',
        }}>
          {initials(emp.firstName, emp.lastName)}
        </div>

        {/* Info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {emp.firstName} {emp.lastName}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
            {emp.positionTitle && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {emp.positionTitle}
              </span>
            )}
            {emp.department && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '1px 7px', borderRadius: 12,
                background: 'var(--navy-800)', color: '#fff',
              }}>
                {emp.department}
              </span>
            )}
            {emp.isOnboarding && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '1px 7px', borderRadius: 12,
                background: 'var(--status-amber-bg)', color: 'var(--status-amber-text)',
                border: '1px solid #fcd34d',
              }}>
                Onboarding
              </span>
            )}
          </div>
          {emp.startDate && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Since {formatDate(emp.startDate)}
            </div>
          )}
        </div>

        {/* Reports count badge when clamped */}
        {hasReports && !showChildren && (
          <div style={{
            marginLeft: 'auto', flexShrink: 0,
            fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 12,
            background: 'var(--surface-muted)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}>
            +{emp.reports.length}
          </div>
        )}
      </div>

      {/* Children indented with connecting line */}
      {hasReports && showChildren && (
        <div style={{
          marginLeft: 28,
          paddingLeft: 16,
          borderLeft: '2px solid var(--border-strong)',
          paddingTop: 2,
          paddingBottom: 2,
        }}>
          {emp.reports.map((child) => (
            <EmployeeCard key={child.id} emp={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgTree({ employees }: Props) {
  if (employees.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
        No active employees on record.
      </div>
    )
  }

  const roots = buildTree(employees)

  // Fall back to department groups if everyone is a root (no manager hierarchy set up)
  const allRoots = roots.length === employees.length

  if (allRoots && employees.length > 1) {
    // Group by department for readability
    const groups = new Map<string, OrgEmployee[]>()
    for (const e of employees) {
      const key = e.department ?? 'Unassigned'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }

    return (
      <div>
        <div style={{
          padding: '10px 14px', marginBottom: 20,
          background: 'var(--status-amber-bg)',
          border: '1px solid #fcd34d',
          borderRadius: 8, fontSize: 13,
          color: 'var(--status-amber-text)',
        }}>
          No manager relationships set yet — showing employees grouped by department.
          Set managers via each employee&apos;s profile page.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {Array.from(groups.entries()).map(([dept, emps]) => (
            <div key={dept}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: 10,
              }}>
                {dept}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {emps.map((e) => (
                  <EmployeeCard
                    key={e.id}
                    emp={{ ...e, reports: [] }}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {roots.map((node) => (
        <EmployeeCard key={node.id} emp={node} depth={0} />
      ))}
    </div>
  )
}
