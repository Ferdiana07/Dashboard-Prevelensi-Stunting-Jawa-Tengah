import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv, validateBoundaries, validateDataset } from '../../src/lib/data'
import { CATEGORIES, category, changeFrom2019, changeLabel, filterRows, mean, metrics, previousChange, TARGET } from '../../src/lib/calculations'
import { percent, signed } from '../../src/lib/format'
import { YEARS, type Boundaries } from '../../src/types'

const csv = readFileSync('public/data/stunting.csv', 'utf8')
const geo = JSON.parse(readFileSync('public/data/jateng.geojson', 'utf8')) as Boundaries
const { rows } = validateDataset(csv, geo)

describe('data asli dan geometri', () => {
  it('memuat 105 baris dan 35 kode per tahun', () => {
    expect(rows).toHaveLength(105)
    for (const year of YEARS) expect(new Set(filterRows(rows, year, 'all').map(row => row.code)).size).toBe(35)
  })
  it('memetakan 35 kode CSV satu-ke-satu dengan GeoJSON asli', () => {
    expect(new Set(geo.features.map(feature => feature.properties.kode_wilayah))).toEqual(new Set(rows.map(row => row.code)))
    expect(geo.features.some(feature => feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates.length > 1)).toBe(true)
  })
  it('menolak duplikat tahun dan kode', () => { expect(() => parseCsv(csv.trim() + '\n' + csv.split('\n')[1])).toThrow('Duplikat') })
  it('menolak tahun 2020', () => { expect(() => parseCsv(csv.replace(',2019,', ',2020,'))).toThrow('Tahun tidak didukung') })
  it.each(['-1', '101', 'NaN', ''])('menolak prevalensi tidak valid %s', value => { expect(() => parseCsv(csv.replace(',23.18,', `,${value},`))).toThrow('Prevalensi tidak valid') })
  it('menolak tahun yang tidak lengkap', () => { expect(() => parseCsv(csv.split('\n').filter((_, index) => index !== 1).join('\n'))).toThrow('35 wilayah') })
  it('menolak header yang hilang', () => { expect(() => parseCsv(csv.replace('kode_wilayah', 'kode_lain'))).toThrow('Kolom wajib') })
  it('menolak tipe wilayah yang salah', () => { expect(() => parseCsv(csv.replace(',Kabupaten,', ',Desa,'))).toThrow('Tipe wilayah') })
  it('menolak kode geometri yang tidak cocok', () => {
    const bad = structuredClone(geo); bad.features[0].properties.kode_wilayah = '9999'
    expect(() => validateBoundaries(bad, rows)).toThrow('tidak cocok')
  })
  it('menolak duplikat geometri dan koordinat yang tidak valid', () => {
    const bad = structuredClone(geo); bad.features[0] = bad.features[1]
    expect(() => validateBoundaries(bad, rows)).toThrow('duplikat')
    const coords = structuredClone(geo); coords.features[0].geometry.coordinates = []
    expect(() => validateBoundaries(coords, rows)).toThrow('Geometri tidak valid')
  })
})
describe('enam KPI dengan presisi asli', () => {
  it.each([
    [2019, '27,1%', 35, '3,1 pp', '0,0%'],
    [2021, '20,0%', 32, '1,0 pp', '8,6%'],
    [2022, '20,7%', 33, '5,9 pp', '5,7%'],
  ] as const)('memvalidasi K1–K4 tahun %i', (year, average, above, gap, achievement) => {
    const kpi = metrics(filterRows(rows, year, 'all'))
    expect(percent(kpi.average!)).toBe(average); expect(kpi.above).toBe(above)
    expect(signed(kpi.gap)).toBe(`+${gap}`); expect(percent(kpi.achievement!)).toBe(achievement)
  })
  it('menghasilkan 2 hijau, 15 kuning, 18 merah pada 2022', () => {
    const r = filterRows(rows, 2022, 'all')
    expect(Object.keys(CATEGORIES).map(key => r.filter(row => category(row.prevalence) === key).length)).toEqual([2, 15, 18])
  })
  it('menghasilkan lima wilayah prioritas dari data', () => {
    expect(filterRows(rows, 2022, 'all').sort((a, b) => b.prevalence - a.prevalence).slice(0, 5).map(row => [row.name, row.prevalence]))
      .toEqual([['Kab. Brebes', 29.1], ['Kab. Temanggung', 28.9], ['Kab. Magelang', 28.2], ['Kab. Purbalingga', 26.8], ['Kab. Blora', 25.8]])
  })
  it('menghitung K5 terbesar +15,1 pp untuk Brebes', () => {
    expect(Math.max(...filterRows(rows, 2022, 'all').map(row => row.prevalence - TARGET))).toBeCloseTo(15.1)
  })
  it('membedakan K6 Temanggung +3,11 pp dari perubahan 2021 +8,4 pp', () => {
    const temanggung = rows.find(row => row.name === 'Kab. Temanggung' && row.year === 2022)!
    expect(changeFrom2019(rows, temanggung)).toBeCloseTo(3.11)
    expect(previousChange(rows, temanggung).year).toBe(2021)
    expect(previousChange(rows, temanggung).delta).toBeCloseTo(8.4)
  })
  it('menghitung K6 meningkat terbesar untuk Pati +3,62 pp', () => {
    const result = filterRows(rows, 2022, 'all').sort((a, b) => changeFrom2019(rows, b)! - changeFrom2019(rows, a)!)[0]
    expect(result.name).toBe('Kab. Pati'); expect(changeFrom2019(rows, result)).toBeCloseTo(3.62)
  })
  it('menggunakan 2019 sebagai tahun sebelumnya untuk 2021, dan tanpa pembanding pada 2019', () => {
    expect(previousChange(rows, filterRows(rows, 2021, 'all')[0]).year).toBe(2019)
    expect(previousChange(rows, rows[0])).toEqual({ year: null, delta: null })
    expect(changeFrom2019(rows, rows[0])).toBeNull()
    expect(changeLabel(2021)).not.toContain('K6')
  })
  it('tidak membulatkan sebelum menghitung', () => { expect(mean(filterRows(rows, 2019, 'all'))).toBeCloseTo(27.0968571428571, 10) })
})
describe('cakupan filter dan kategori batas', () => {
  it('menghitung ulang mean kota dari 6 kota, tanpa gap kelompok palsu', () => {
    const kpi = metrics(filterRows(rows, 2022, 'Kota'))
    expect(kpi.total).toBe(6); expect(kpi.average).toBeCloseTo(15.7666666667)
    expect(kpi.gap).toBeNull(); expect(kpi.district).toBeNull()
  })
  it('membedakan Kabupaten Semarang dan Kota Semarang lewat kode', () => {
    expect(filterRows(rows, 2022, '3322')[0].name).toBe('Kab. Semarang')
    expect(filterRows(rows, 2022, '3374')[0].name).toBe('Kota Semarang')
  })
  it('memfilter tepat 29 kabupaten dan satu wilayah individual', () => {
    expect(filterRows(rows, 2021, 'Kabupaten')).toHaveLength(29)
    expect(filterRows(rows, 2019, '3301')).toHaveLength(1)
  })
  it.each([[0, 'achieved'], [14, 'achieved'], [14.001, 'moderate'], [19.999, 'moderate'], [20, 'high'], [100, 'high']])('mengategorikan batas %s', (value, expected) => {
    expect(category(Number(value))).toBe(expected)
  })
  it('menangani himpunan kosong dan format angka negatif', () => {
    expect(metrics([]).average).toBeNull(); expect(metrics([]).gap).toBeNull(); expect(metrics([]).achievement).toBeNull()
    expect(signed(null)).toBe('—'); expect(signed(-2.15)).toBe('-2,2 pp')
  })
})
