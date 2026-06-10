export type TrendDirection = 'UP' | 'DOWN' | 'FLAT' | 'NO_DATA'

export function computeTrend(entries: { value: number }[]): TrendDirection {
  if (entries.length < 2) return 'NO_DATA'
  const recent = entries.slice(0, 3)
  let up = true
  let down = true
  for (let i = 0; i < recent.length - 1; i++) {
    if (recent[i].value <= recent[i + 1].value) up = false
    if (recent[i].value >= recent[i + 1].value) down = false
  }
  if (up) return 'UP'
  if (down) return 'DOWN'
  return 'FLAT'
}
