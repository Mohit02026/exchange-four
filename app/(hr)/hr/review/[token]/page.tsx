import { redirect, notFound } from 'next/navigation'
import { getApplicationByReviewToken } from '@/lib/services/reviews'

export default async function ReviewTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const app = await getApplicationByReviewToken(token)
  if (!app) notFound()
  if (app.reviewTokenExpiry && app.reviewTokenExpiry < new Date()) notFound()
  redirect(`/hr/applications/${app.id}`)
}
