import { db } from '@/lib/db'
import PositionCard from '@/components/applicant/PositionCard'
import Link from 'next/link'

export const revalidate = 60

export default async function PositionsPage() {
  const positions = await db.position.findMany({
    where: { status: 'OPEN' },
    include: { orgBoardUnit: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Open Positions</h1>
      <p className="text-sm text-gray-400 mb-8">
        {positions.length} position{positions.length !== 1 ? 's' : ''} available
      </p>

      <div className="space-y-3">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}

        <div className="border border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-between">
          <div>
            <h2 className="font-medium text-gray-900">General Application</h2>
            <p className="mt-1 text-sm text-gray-500">
              Don&apos;t see a role that fits? Submit a general application and we&apos;ll keep you in mind.
            </p>
          </div>
          <Link
            href="/apply"
            className="ml-6 shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            Apply
          </Link>
        </div>
      </div>
    </main>
  )
}
