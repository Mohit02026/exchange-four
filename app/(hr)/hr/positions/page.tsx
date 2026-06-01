import { db } from '@/lib/db'
import PositionsManager from '@/components/hr/PositionsManager'

export const dynamic = 'force-dynamic'

export default async function HRPositionsPage() {
  const positions = await db.position.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <PositionsManager initial={positions} />
}
