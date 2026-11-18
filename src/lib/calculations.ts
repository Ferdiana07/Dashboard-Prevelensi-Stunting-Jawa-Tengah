import { YEARS, type RegionFilter, type StuntingRow, type Year } from '../types'

export const TARGET = 14
export const CATEGORIES = {
  achieved: { label: 'Mencapai target', range: '≤ 14%', color: '#08a33e', soft: '#dcf4e2', text: '#11652e' },
  moderate: { label: 'Perlu perhatian', range: '> 14% – < 20%', color: '#ffd000', soft: '#fff3bf', text: '#735600' },
  high: { label: 'Prioritas tinggi', range: '≥ 20%', color: '#ed2429', soft: '#ffdada', text: '#9d1c22' },
}
// Categories are derived from unrounded values; 14 belongs to achieved and 20 to high.
export function category(value: number) { return value <= TARGET ? 'achieved' : value < 20 ? 'moderate' : 'high' }
export const mean = (rows: StuntingRow[]) => rows.length ? rows.reduce((sum, row) => sum + row.prevalence, 0) / rows.length : null
// Match the source's competition ranking: equal values share a rank (1, 2, 2, 4).
export const prevalenceRank = (rows: StuntingRow[], value: number) => 1 + rows.filter(row => row.prevalence > value).length
export function filterRows(rows: StuntingRow[], year: Year, region: RegionFilter) {
  return rows.filter(row => row.year === year && (region === 'all' || row.type === region || row.code === region))
}
export function metrics(rows: StuntingRow[]) {
  const district = mean(rows.filter(row => row.type === 'Kabupaten'))
  const city = mean(rows.filter(row => row.type === 'Kota'))
  const achieved = rows.filter(row => row.prevalence <= TARGET).length
  return { average: mean(rows), total: rows.length, above: rows.length - achieved, achieved,
    achievement: rows.length ? achieved / rows.length * 100 : null,
    district, city, gap: district === null || city === null ? null : district - city }
}
export function valueAt(rows: StuntingRow[], code: string, year: number) {
  return rows.find(row => row.code === code && row.year === year)?.prevalence ?? null
}
export function changeFrom2019(rows: StuntingRow[], row: StuntingRow) {
  const baseline = valueAt(rows, row.code, 2019)
  return row.year === 2019 || baseline === null ? null : row.prevalence - baseline
}
export function previousChange(rows: StuntingRow[], row: StuntingRow) {
  const previousYear = [...YEARS].reverse().find(year => year < row.year)
  const previous = previousYear ? valueAt(rows, row.code, previousYear) : null
  return { year: previousYear ?? null, delta: previous === null ? null : row.prevalence - previous }
}
export function changeLabel(year: Year) { return year === 2019 ? 'Perubahan dari 2019' : `Perubahan 2019–${year}` }
