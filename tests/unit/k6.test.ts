import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateDataset } from '../../src/lib/data'
import { k6Direction, k6Entries, k6Groups, k6SummaryText } from '../../src/lib/calculations'
import type { Boundaries, Scope } from '../../src/types'

const csv = readFileSync('public/data/stunting.csv', 'utf8')
const geo = JSON.parse(readFileSync('public/data/jateng.geojson', 'utf8')) as Boundaries
const { rows } = validateDataset(csv, geo)

describe('K6 naik / tetap / turun per cakupan', () => {
  it.each<[Scope, number, number, number, number]>([
    ['all', 35, 6, 1, 28],
    ['Kabupaten', 29, 6, 1, 22],
    ['Kota', 6, 0, 0, 6],
  ])('%s: %i wilayah = %i naik, %i tetap, %i turun', (scope, total, up, flat, down) => {
    const entries = k6Entries(rows, scope)
    const groups = k6Groups(entries)
    expect(entries).toHaveLength(total)
    expect([groups.up.length, groups.flat.length, groups.down.length]).toEqual([up, flat, down])
  })
  it('mengurutkan dari kenaikan terbesar dan memakai 2019→2022 apa pun tahunnya', () => {
    const entries = k6Entries(rows, 'all')
    expect(entries.map(e => e.name).slice(0, 7)).toEqual(['Kab. Pati', 'Kab. Temanggung', 'Kab. Kebumen', 'Kab. Purbalingga', 'Kab. Rembang', 'Kab. Wonogiri', 'Kab. Pekalongan'])
    expect(entries.at(-1)!.name).toBe('Kab. Demak')
    expect(entries.at(-1)!.change).toBeCloseTo(-19.56, 10)
    for (let i = 1; i < entries.length; i++) expect(entries[i - 1].change).toBeGreaterThanOrEqual(entries[i].change)
  })
  it('menganggap Kab. Pekalongan (23,5 → 23,5) tetap, bukan naik atau turun', () => {
    expect(k6Groups(k6Entries(rows, 'all')).flat.map(e => e.name)).toEqual(['Kab. Pekalongan'])
    expect([k6Direction(0), k6Direction(0.004), k6Direction(-0.004), k6Direction(0.01), k6Direction(-0.01)]).toEqual(['flat', 'flat', 'flat', 'up', 'down'])
  })
})

describe('teks ringkasan K6', () => {
  it('Semua', () => {
    expect(k6SummaryText(k6Entries(rows, 'all'), 'all')).toBe('2019→2022: 6 wilayah naik · 1 tetap · 28 turun. Kenaikan terbesar Kab. Pati +3,6 pp.')
  })
  it('Kabupaten', () => {
    expect(k6SummaryText(k6Entries(rows, 'Kabupaten'), 'Kabupaten')).toBe('2019→2022: 6 kabupaten naik · 1 tetap · 22 turun. Kenaikan terbesar Kab. Pati +3,6 pp.')
  })
  it('Kota: tidak ada yang naik, menyebut penurunan paling lambat', () => {
    expect(k6SummaryText(k6Entries(rows, 'Kota'), 'Kota')).toBe('2019→2022: semua 6 kota turun. Penurunan paling lambat Kota Surakarta -2,6 pp.')
  })
  it('menghilangkan “· Y tetap” bila Y = 0 dan tidak memakai tanda pisah panjang', () => {
    const noFlat = k6Entries(rows, 'all').filter(e => e.direction !== 'flat')
    expect(k6SummaryText(noFlat, 'all')).toBe('2019→2022: 6 wilayah naik · 28 turun. Kenaikan terbesar Kab. Pati +3,6 pp.')
    for (const scope of ['all', 'Kabupaten', 'Kota'] as const) expect(k6SummaryText(k6Entries(rows, scope), scope)).not.toContain('—')
  })
})
