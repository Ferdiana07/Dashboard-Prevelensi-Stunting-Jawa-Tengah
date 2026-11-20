import { number, roundHalfAway, signed } from './format'
import { type AreaType, type Scope, type StuntingRow, type Year } from '../types'

export const TARGET = 14
export const CATEGORIES = {
  achieved: { label: 'Rendah', range: '≤ 14%', color: '#08a33e', soft: '#dcf4e2', text: '#11652e' },
  moderate: { label: 'Sedang', range: '> 14% – < 20%', color: '#ffd000', soft: '#fff3bf', text: '#735600' },
  high: { label: 'Tinggi', range: '≥ 20%', color: '#ed2429', soft: '#ffdada', text: '#9d1c22' },
}
// Categories are derived from unrounded values; 14 belongs to achieved and 20 to high.
export function category(value: number) { return value <= TARGET ? 'achieved' : value < 20 ? 'moderate' : 'high' }
// True when the one-decimal label would sit on the other side of a category boundary (e.g. 19,96 shown as 20,0).
export const roundingShiftsCategory = (value: number) => category(roundHalfAway(value, 1)) !== category(value)
export const mean = (rows: StuntingRow[]) => rows.length ? rows.reduce((sum, row) => sum + row.prevalence, 0) / rows.length : null
// Match the source's competition ranking: equal values share a rank (1, 2, 2, 4).
export const prevalenceRank = (rows: StuntingRow[], value: number) => 1 + rows.filter(row => row.prevalence > value).length
export function filterRows(rows: StuntingRow[], year: Year, scope: Scope) {
  return rows.filter(row => row.year === year && (scope === 'all' || row.type === scope))
}
export function metrics(rows: StuntingRow[]) {
  const district = mean(rows.filter(row => row.type === 'Kabupaten'))
  const city = mean(rows.filter(row => row.type === 'Kota'))
  const achieved = rows.filter(row => row.prevalence <= TARGET).length
  return { average: mean(rows), total: rows.length, above: rows.length - achieved, achieved,
    achievement: rows.length ? achieved / rows.length * 100 : null,
    district, city, gap: district === null || city === null ? null : district - city }
}
// Note under the K4 card: the card stays green, the wording avoids implying progress when there is none.
export function achievementNote(achieved: number, total: number) {
  if (achieved === 0) return 'belum ada wilayah yang mencapai target'
  if (achieved === total) return 'semua wilayah mencapai target'
  return `baru ${achieved} dari ${total} wilayah`
}
export function valueAt(rows: StuntingRow[], code: string, year: number) {
  return rows.find(row => row.code === code && row.year === year)?.prevalence ?? null
}
// K6 is always the 2019 to 2022 change, whatever year is selected.
export const K6_LABEL = 'Perubahan 2019→2022'
export const K6_NOTE = 'Perubahan = prevalensi 2022 − prevalensi 2019, sama untuk semua tahun yang dipilih'
export function k6Change(rows: StuntingRow[], code: string) {
  const start = valueAt(rows, code, 2019)
  const end = valueAt(rows, code, 2022)
  return start === null || end === null ? null : end - start
}
// K6 panel: hue encodes direction (increase = worse, decrease = better at reduced opacity).
export const K6_UP = '#a12b30'
export const K6_DOWN = '#216a49'
// Bar-end label: one decimal through the shared rounding helper, explicit sign, no unit (the axis says pp).
export const k6Value = (change: number) => `${change > 0 ? '+' : ''}${number(change)}`
// K6 per region for a scope, sorted from the largest increase to the largest decrease.
export type K6Direction = 'up' | 'flat' | 'down'
export const k6Direction = (change: number): K6Direction => Math.abs(change) < 0.005 ? 'flat' : change > 0 ? 'up' : 'down'
export interface K6Entry { code: string; name: string; type: AreaType; change: number; direction: K6Direction }
export function k6Entries(all: StuntingRow[], scope: Scope): K6Entry[] {
  return filterRows(all, 2019, scope).flatMap(row => {
    const change = k6Change(all, row.code)
    return change === null ? [] : [{ code: row.code, name: row.name, type: row.type, change, direction: k6Direction(change) }]
  }).sort((a, b) => b.change - a.change || a.code.localeCompare(b.code))
}
// Groups keep the K6 order: up[0] is the largest increase, down[0] the slowest decrease, down.at(-1) the largest decrease.
export function k6Groups(entries: K6Entry[]) {
  return { up: entries.filter(e => e.direction === 'up'), flat: entries.filter(e => e.direction === 'flat'), down: entries.filter(e => e.direction === 'down') }
}
const scopeNoun = (scope: Scope) => scope === 'Kota' ? 'kota' : scope === 'Kabupaten' ? 'kabupaten' : 'wilayah'
// One-line K6 summary under the ranking table.
export function k6SummaryText(entries: K6Entry[], scope: Scope) {
  const { up, flat, down } = k6Groups(entries)
  const noun = scopeNoun(scope)
  const counts = `${up.length} ${noun} naik${flat.length ? ` · ${flat.length} tetap` : ''} · ${down.length} turun`
  if (up.length) return `2019→2022: ${counts}. Kenaikan terbesar ${up[0].name} ${signed(up[0].change)}.`
  if (down.length && down.length === entries.length) return `2019→2022: semua ${entries.length} ${noun} turun. Penurunan paling lambat ${down[0].name} ${signed(down[0].change)}.`
  return `2019→2022: tidak ada ${noun} yang naik${flat.length ? ` · ${flat.length} tetap` : ''} · ${down.length} turun.`
}
// The heading follows the active sort so the title never contradicts the row order.
export function rankingTitle(sort: 'prevalence' | 'target' | 'change', descending: boolean, year: Year) {
  if (sort === 'prevalence') return `${descending ? 'Prevalensi Tertinggi' : 'Prevalensi Terendah'}, ${year}`
  if (sort === 'target') return `${descending ? 'Jarak ke Target Terbesar' : 'Jarak ke Target Terkecil'}, ${year}`
  return descending ? 'Kenaikan Terbesar / Penurunan Terkecil 2019→2022' : 'Penurunan Terbesar 2019→2022'
}
