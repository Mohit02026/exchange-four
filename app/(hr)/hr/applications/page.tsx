import { getApplicationQueue } from '@/lib/services/reviews'
import ApplicantQueue from '@/components/hr/ApplicantQueue'

export default async function ApplicationsPage() {
  const queue = await getApplicationQueue()

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af' }}>
        Exchange Four Personnel Desk
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Applications</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{queue.length} total</span>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <ApplicantQueue items={queue} />
      </div>
    </div>
  )
}
