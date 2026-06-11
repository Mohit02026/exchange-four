import Link from 'next/link'
import EthicsAlertBadge from '@/components/hr/EthicsAlertBadge'

interface EthicsReport {
  id: string
  category: string
  severity: string
  status: string
  isSensitive: boolean
  createdAt: string
  reporter: { name: string | null; email: string }
}

interface EthicsTabProps {
  reports: EthicsReport[]
  employeeId: string
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#f0fdf4', text: '#166534' },
  MEDIUM: { bg: '#fffbeb', text: '#92400e' },
  HIGH: { bg: '#fff1f2', text: '#be123c' },
  SENSITIVE: { bg: '#1e1b4b', text: '#e0e7ff' },
}

export default function EthicsTab({ reports, employeeId }: EthicsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
          <EthicsAlertBadge count={reports.length} />
        </div>
        <Link
          href={`/hr/ethics/new`}
          className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
        >
          + File Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No ethics reports on file.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map(r => {
            const sev = SEVERITY_COLORS[r.severity] ?? SEVERITY_COLORS.LOW
            return (
              <li key={r.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{r.category}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sev.bg, color: sev.text }}
                    >
                      {r.severity}
                    </span>
                    {r.isSensitive && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-100">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-xs text-gray-400">{r.status.replace('_', ' ')}</span>
                    <Link href={`/hr/ethics/${r.id}`} className="text-xs text-blue-600 hover:underline">
                      View →
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Filed by {r.reporter.name ?? r.reporter.email} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
