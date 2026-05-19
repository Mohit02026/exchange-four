import { notFound } from 'next/navigation'
import { getCSWById } from '@/lib/services/csw'
import CSWEditor from '@/components/hr/CSWEditor'

export default async function CSWPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const csw = await getCSWById(id)
  if (!csw) notFound()

  return <CSWEditor csw={csw as Parameters<typeof CSWEditor>[0]['csw']} />
}
