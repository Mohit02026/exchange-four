import { notFound } from 'next/navigation'
import { getApplicationById } from '@/lib/services/reviews'
import ReviewForm from '@/components/hr/ReviewForm'

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await getApplicationById(id)
  if (!application) notFound()

  return <ReviewForm application={application as Parameters<typeof ReviewForm>[0]['application']} />
}
