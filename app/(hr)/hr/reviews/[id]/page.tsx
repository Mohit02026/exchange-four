import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getReview } from '@/lib/services/performanceReviews'
import ConductReviewForm from '@/components/hr/ConductReviewForm'

export const dynamic = 'force-dynamic'

type Rating = { category: string; score: number; notes: string }

const TYPE_LABELS: Record<string, string> = {
  DAY_30: '30-Day Review',
  DAY_60: '60-Day Review',
  DAY_90: '90-Day Review',
  ANNUAL: 'Annual Review',
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 4 ? '#166534' : score >= 3 ? '#92400e' : '#991b1b'
  const bg = score >= 4 ? '#dcfce7' : score >= 3 ? '#fef3c7' : '#fee2e2'
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color }}>
      {score}/5
    </span>
  )
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') redirect('/login')

  const { id } = await params
  const review = await getReview(id)
  if (!review) notFound()

  const ratings = Array.isArray(review.ratings) ? (review.ratings as Rating[]) : []
  const avgScore =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : null

  const isCompleted = review.status === 'COMPLETED'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 780 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          <a href="/hr/reviews" style={{ color: '#6b7280', textDecoration: 'none' }}>Reviews</a>
          {' / '}
          {review.employee.firstName} {review.employee.lastName}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>
          {TYPE_LABELS[review.type] ?? review.type} — {review.employee.firstName} {review.employee.lastName}
        </h1>
        {review.dueDate && (
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            Due {new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {isCompleted ? (
        /* Read-only completed view */
        <div>
          {avgScore && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 20px', marginBottom: 28 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Average Score</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{avgScore}</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>/ 5</span>
            </div>
          )}

          {/* Ratings table */}
          {ratings.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 12 }}>Ratings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ratings.map((r) => (
                  <div key={r.category} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{r.category}</span>
                      <ScoreBadge score={r.score} />
                    </div>
                    {r.notes && (
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0' }}>{r.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {review.summary && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Summary</div>
              <p style={{ fontSize: 14, color: '#374151', background: '#f9fafb', borderRadius: 8, padding: '12px 16px', margin: 0 }}>
                {review.summary}
              </p>
            </div>
          )}

          {/* Goals */}
          {review.goalsSet && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 6 }}>Goals Set</div>
              <p style={{ fontSize: 14, color: '#374151', background: '#f9fafb', borderRadius: 8, padding: '12px 16px', margin: 0 }}>
                {review.goalsSet}
              </p>
            </div>
          )}

          {/* Employee comments */}
          {review.employeeComments && (
            <div style={{ marginTop: 24, padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 6 }}>Employee Comments</div>
              <p style={{ fontSize: 13, color: '#78350f', margin: 0 }}>{review.employeeComments}</p>
            </div>
          )}
        </div>
      ) : (
        /* Conduct form for PENDING / IN_PROGRESS */
        <ConductReviewForm
          reviewId={review.id}
          initialRatings={ratings.length > 0 ? ratings : undefined}
          initialSummary={review.summary ?? undefined}
          initialGoals={review.goalsSet ?? undefined}
          currentStatus={review.status}
        />
      )}
    </div>
  )
}
