interface StatEntry {
  id: string
  value: number
  period: string
  enteredAt: string
}

interface Stat {
  id: string
  name: string
  unit: string
  frequency: string
  target: number | null
  definition: string
  entries: StatEntry[]
}

interface StatisticsProfileTabProps {
  statistics: Stat[]
}

function trend(entries: StatEntry[]): string {
  if (entries.length < 2) return '—'
  const last = entries[0].value
  const prev = entries[1].value
  if (last > prev) return '↑'
  if (last < prev) return '↓'
  return '→'
}

function trendColor(entries: StatEntry[]): string {
  if (entries.length < 2) return 'text-gray-400'
  const last = entries[0].value
  const prev = entries[1].value
  if (last > prev) return 'text-green-600'
  if (last < prev) return 'text-red-600'
  return 'text-gray-500'
}

export default function StatisticsProfileTab({ statistics }: StatisticsProfileTabProps) {
  if (statistics.length === 0) {
    return <p className="text-sm text-gray-500">No statistics assigned yet.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {statistics.map(stat => {
        const latest = stat.entries[0]
        return (
          <div key={stat.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{stat.name}</h4>
                <p className="text-xs text-gray-400">{stat.frequency} · {stat.unit}</p>
              </div>
              <span className={`text-2xl font-bold ${trendColor(stat.entries)}`}>
                {trend(stat.entries)}
              </span>
            </div>
            {latest ? (
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">{latest.value}</span>
                <span className="text-sm text-gray-400 ml-1">{stat.unit}</span>
                {stat.target != null && (
                  <span className="text-xs text-gray-400 ml-2">target: {stat.target}</span>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Period: {latest.period} · {new Date(latest.enteredAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No entries yet.</p>
            )}
            {stat.entries.length > 1 && (
              <div className="flex items-end gap-1 mt-3 h-8">
                {[...stat.entries].reverse().map(e => {
                  const max = Math.max(...stat.entries.map(x => x.value), 1)
                  const pct = Math.max(10, Math.round((e.value / max) * 100))
                  return (
                    <div
                      key={e.id}
                      className="flex-1 bg-blue-200 rounded-sm"
                      style={{ height: `${pct}%` }}
                      title={`${e.period}: ${e.value}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
