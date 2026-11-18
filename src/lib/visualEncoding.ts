import type { StuntingRow } from '../types'
import { category } from './calculations'

// A rounded label must never place a point on the other side of a color boundary.
// Example: the 2021 mean is 19.96%, so a yellow point must not read "20.0%".
export function prevalenceLabel(value: number) {
  const normalized = Number(value.toPrecision(15))
  for (let precision = 1; precision <= 6; precision++) {
    const label = normalized.toLocaleString('id-ID', { minimumFractionDigits: precision, maximumFractionDigits: precision, useGrouping: false })
    const rounded = Number(label.replace(',', '.'))
    if (category(rounded) === category(value)) return label + '%'
  }
  return value.toLocaleString('id-ID', { maximumFractionDigits: 12, useGrouping: false }) + '%'
}

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
