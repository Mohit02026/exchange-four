import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getReviews } from '@/lib/services/performanceReviews'
import ReviewCard from '@/components/hr/ReviewCard'
import type { PerfReviewStatus } from '@/lib/generated/prisma/client'

export const dynamic = 'force-dynamic'

const STATUS_TABS: { label: string; value: PerfReviewStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
]

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { status } = await searchParams
  const activeStatus = (status as PerfReviewStatus | undefined) ?? undefined

  const reviews = await getReviews(activeStatus ? { status: activeStatus } : undefined)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>
            Performance Reviews
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            30 / 60 / 90 day and annual reviews
          </p>
        </div>
        <Link
          href="/hr/reviews/new"
          style={{
            padding: '9px 20px',
            borderRadius: 8,
            background: '#1a1a1a',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + Schedule Review
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {STATUS_TABS.map((tab) => {
          const isActive = (tab.value === 'ALL' && !activeStatus) || tab.value === activeStatus
          return (
            <Link
              key={tab.value}
              href={tab.value === 'ALL' ? '/hr/reviews' : `/hr/reviews?status=${tab.value}`}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? '#1a1a1a' : '#f3f4f6',
                color: isActive ? '#fff' : '#6b7280',
                textDecoration: 'none',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14 }}>
          No reviews found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{
                id: review.id,
                type: review.type,
                status: review.status,
                dueDate: review.dueDate ? review.dueDate.toISOString() : null,
                employee: review.employee,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
