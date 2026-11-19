import type { StuntingRow } from '../types'

// Both quantitative charts use the same zero-based extent for the whole dataset.
// Filtering changes the observations, never their apparent scale.
export function prevalenceScale(rows: StuntingRow[]) {
  const maximum = Math.max(30, Math.ceil(Math.max(0, ...rows.map(row => row.prevalence)) / 10) * 10)
  return { maximum, ticks: Array.from({ length: maximum / 10 + 1 }, (_, index) => index * 10) }
}

export const SERIES_STYLES = [
  { shape: 'circle', dash: undefined },
  { shape: 'square', dash: '7 4' },
  { shape: 'diamond', dash: '2 4' },
  { shape: 'triangle', dash: '9 3 2 3' },
  { shape: 'cross', dash: '12 4' },
] as const
export type SeriesShape = (typeof SERIES_STYLES)[number]['shape']
export const SERIES_INK = '#34465b'
