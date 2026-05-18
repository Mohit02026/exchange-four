import Link from 'next/link'

interface Position {
  id: string
  title: string
  orgBoardUnit: { name: string } | null
  employmentType: string | null
  location: string | null
  compensationRange: string | null
}

export default function PositionCard({ position }: { position: Position }) {
  const meta = [
    position.orgBoardUnit?.name,
    position.employmentType,
    position.location,
  ].filter(Boolean)

  return (
    <div className="border border-gray-200 rounded-lg p-6 flex items-start justify-between hover:border-gray-300 transition-colors">
      <div>
        <h2 className="font-medium text-gray-900">{position.title}</h2>
        {meta.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">{meta.join(' · ')}</p>
        )}
        {position.compensationRange && (
          <p className="mt-1 text-xs text-gray-400">{position.compensationRange}</p>
        )}
      </div>
      <Link
        href={`/apply?position=${position.id}`}
        className="ml-6 shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
      >
        Apply
      </Link>
    </div>
  )
}
