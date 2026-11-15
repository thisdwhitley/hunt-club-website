// Display helpers for /reports.

export const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate * 100)}%`)
export const perSit = (rate: number | null) => (rate === null ? '-' : rate.toFixed(2))
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const SEASON_TYPE_LABELS: Record<string, string> = {
  archery: 'Archery',
  blackpowder: 'Blackpowder',
  gun: 'Gun',
}
export const SEASON_TYPE_ORDER = ['archery', 'blackpowder', 'gun']

export const thClass = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap'
export const tdClass = 'px-3 py-2.5 text-sm text-forest-shadow whitespace-nowrap'
