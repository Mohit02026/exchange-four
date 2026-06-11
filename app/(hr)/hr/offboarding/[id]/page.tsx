export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getCaseById } from '@/lib/services/offboarding'
import OffboardingChecklist from '@/components/hr/OffboardingChecklist'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#7c3aed',
  COMPLETE: '#16a34a',
}

export default async function OffboardingCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { id } = await params
  const raw = await getCaseById(id)
  if (!raw) notFound()

  const c = JSON.parse(JSON.stringify(raw))
  const empName = c.employee.user.name ?? c.employee.user.email
  const done = c.items.filter((i: { completedAt: string | null }) => i.completedAt).length

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 6, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        <Link href="/hr/offboarding" style={{ color: '#9ca3af', textDecoration: 'none' }}>Offboarding</Link> /
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '12px 0 24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>{empName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: (STATUS_COLOR[c.status] ?? '#6b7280') + '22',
              color: STATUS_COLOR[c.status] ?? '#6b7280',
              border: `1px solid ${STATUS_COLOR[c.status] ?? '#6b7280'}44`,
            }}>
              {c.status.replace('_', ' ')}
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {c.reason.charAt(0) + c.reason.slice(1).toLowerCase()}
            </span>
            {c.finalDay && (
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                · Final day: {new Date(c.finalDay).toLocaleDateString()}
              </span>
            )}
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              · {done}/{c.items.length} complete
            </span>
          </div>
        </div>
        <Link href={`/hr/employees/${c.employeeId}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>
          View Employee Profile →
        </Link>
      </div>

      {/* CEO approval status */}
      {c.requiresCeoApproval && (
        <div style={{
          background: c.ceoApproved === true ? '#f0fdf4' : c.ceoApproved === false ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${c.ceoApproved === true ? '#bbf7d0' : c.ceoApproved === false ? '#fca5a5' : '#fcd34d'}`,
          borderRadius: 8, padding: '12px 20px', marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>CEO Approval Required</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {c.ceoApproved === true
              ? `Approved on ${new Date(c.ceoDecidedAt).toLocaleDateString()}`
              : c.ceoApproved === false
              ? `Rejected on ${new Date(c.ceoDecidedAt).toLocaleDateString()}`
              : 'Awaiting Avi\'s decision — approval email sent.'}
          </p>
        </div>
      )}

      {/* Exit summary */}
      {c.exitSummary && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Exit Summary
          </div>
          <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.exitSummary}</p>
        </div>
      )}

      {/* Checklist */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700 }}>Offboarding Checklist</h3>
        <OffboardingChecklist caseId={c.id} items={c.items} />
      </div>

      {/* Filed by */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
        Case opened {new Date(c.createdAt).toLocaleDateString()}
        {c.createdBy?.name ? ` by ${c.createdBy.name}` : ''}
      </p>
    </div>
  )
}
