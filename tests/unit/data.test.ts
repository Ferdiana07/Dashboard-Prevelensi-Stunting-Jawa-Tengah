import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv, validateBoundaries, validateDataset } from '../../src/lib/data'
import { achievementNote, rankingTitle, CATEGORIES, category, K6_LABEL, k6Change, filterRows, mean, metrics, TARGET } from '../../src/lib/calculations'
import { percent, signed } from '../../src/lib/format'
import { YEARS, type Boundaries } from '../../src/types'
import Papa from 'papaparse'
import { prevalenceRank } from '../../src/lib/calculations'

describe('nama kategori', () => {
  it('memakai Rendah, Sedang, Tinggi dengan rentang di legenda', () => {
    expect(Object.values(CATEGORIES).map(item => item.label)).toEqual(['Rendah', 'Sedang', 'Tinggi'])
    expect(Object.values(CATEGORIES).map(item => item.range)).toEqual(['≤ 14%', '> 14% – < 20%', '≥ 20%'])
  })
})

const csv = readFileSync('public/data/stunting.csv', 'utf8')
const geo = JSON.parse(readFileSync('public/data/jateng.geojson', 'utf8')) as Boundaries
const { rows } = validateDataset(csv, geo)
const source = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data

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
  it('mencocokkan peringkat, kategori, jarak target, dan perubahan seluruh 105 baris sumber', () => {
    for (const original of source) {
      const row = rows.find(item => item.code === original.kode_wilayah && item.year === Number(original.tahun))!
      const cohort = rows.filter(item => item.year === row.year)
      expect(prevalenceRank(cohort, row.prevalence)).toBe(Number(original.peringkat))
      expect(row.prevalence - TARGET).toBeCloseTo(Number(original.k5_jarak_target), 10)
      expect({ achieved: 'Rendah', moderate: 'Sedang', high: 'Tinggi' }[category(row.prevalence)]).toBe(original.kategori)
      const start = rows.find(item => item.code === row.code && item.year === 2019)!
      const end = rows.find(item => item.code === row.code && item.year === 2022)!
      expect(end.prevalence - start.prevalence).toBeCloseTo(Number(original.k6_perubahan_2019_2022), 10)
    }
  })
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
  it('K6 Temanggung +3,11 pp', () => {
    const temanggung = rows.find(row => row.name === 'Kab. Temanggung' && row.year === 2022)!
    expect(k6Change(rows, temanggung.code)).toBeCloseTo(3.11)
  })
  it('menghitung K6 meningkat terbesar untuk Pati +3,62 pp', () => {
    const result = filterRows(rows, 2022, 'all').sort((a, b) => k6Change(rows, b.code)! - k6Change(rows, a.code)!)[0]
    expect(result.name).toBe('Kab. Pati'); expect(k6Change(rows, result.code)).toBeCloseTo(3.62)
  })
  it('K6 selalu 2019 ke 2022, sama dengan kolom k6_perubahan_2019_2022 untuk semua tahun', () => {
    expect(K6_LABEL).toBe('K6: 2019→2022')
    for (const item of source) expect(k6Change(rows, item.kode_wilayah)).toBeCloseTo(Number(item.k6_perubahan_2019_2022), 10)
  })
  it('K6: 6 wilayah naik, Kab. Pekalongan 0,0, penurunan terbesar Kab. Demak', () => {
    const changes = filterRows(rows, 2019, 'all').map(row => ({ name: row.name, delta: k6Change(rows, row.code)! }))
    const up = changes.filter(item => item.delta > 0.005).sort((a, b) => b.delta - a.delta)
    expect(up.map(item => [item.name, Math.round(item.delta * 10) / 10])).toEqual([['Kab. Pati', 3.6], ['Kab. Temanggung', 3.1], ['Kab. Kebumen', 2.5], ['Kab. Purbalingga', 1.8], ['Kab. Rembang', 0.9], ['Kab. Wonogiri', 0.3]])
    expect(Math.abs(changes.find(item => item.name === 'Kab. Pekalongan')!.delta)).toBeLessThan(0.005)
    expect(changes.reduce((low, item) => item.delta < low.delta ? item : low).name).toBe('Kab. Demak')
    expect(signed(changes.find(item => item.name === 'Kab. Demak')!.delta)).toBe('-19,6 pp')
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
    expect(rows.find(row => row.year === 2022 && row.code === '3322')!.name).toBe('Kab. Semarang')
    expect(rows.find(row => row.year === 2022 && row.code === '3374')!.name).toBe('Kota Semarang')
  })
  it('memfilter cakupan: 29 kabupaten, 6 kota, 35 semua; satu wilayah tidak pernah menjadi cakupan', () => {
    expect(filterRows(rows, 2021, 'Kabupaten')).toHaveLength(29)
    expect(filterRows(rows, 2021, 'Kota')).toHaveLength(6)
    expect(filterRows(rows, 2021, 'all')).toHaveLength(35)
  })
  it.each([[0, 'achieved'], [14, 'achieved'], [14.001, 'moderate'], [19.999, 'moderate'], [20, 'high'], [100, 'high']])('mengategorikan batas %s', (value, expected) => {
    expect(category(Number(value))).toBe(expected)
  })
  it('menangani himpunan kosong dan format angka negatif', () => {
    expect(metrics([]).average).toBeNull(); expect(metrics([]).gap).toBeNull(); expect(metrics([]).achievement).toBeNull()
    expect(signed(null)).toBe('—'); expect(signed(-2.15)).toBe('-2,2 pp')
  })
  it('membulatkan selisih desimal matematis, tanpa terpengaruh galat floating point', () => {
    expect(signed(19.65 - 14)).toBe('+5,7 pp')
    expect(signed(14 - 19.65)).toBe('-5,7 pp')
    expect(signed(29.1 - 34.65)).toBe('-5,6 pp')
    expect(percent(19.65)).toBe('19,7%')
  })
})

describe('teks kartu K4', () => {
  it('memilih kalimat sesuai jumlah wilayah yang mencapai target', () => {
    expect(achievementNote(0, 35)).toBe('belum ada wilayah yang mencapai target')
    expect(achievementNote(35, 35)).toBe('semua wilayah mencapai target')
    expect(achievementNote(6, 6)).toBe('semua wilayah mencapai target')
    expect(achievementNote(2, 35)).toBe('baru 2 dari 35 wilayah')
  })
  it('sesuai data asli untuk setiap tahun dan cakupan', () => {
    const rows = parseCsv(readFileSync('public/data/stunting.csv', 'utf8'))
    const expected: Record<string, string> = {
      '2019:all': 'belum ada wilayah yang mencapai target', '2019:Kota': 'belum ada wilayah yang mencapai target', '2019:Kabupaten': 'belum ada wilayah yang mencapai target',
      '2021:all': 'baru 3 dari 35 wilayah', '2021:Kota': 'baru 1 dari 6 wilayah', '2021:Kabupaten': 'baru 2 dari 29 wilayah',
      '2022:all': 'baru 2 dari 35 wilayah', '2022:Kota': 'baru 2 dari 6 wilayah', '2022:Kabupaten': 'belum ada wilayah yang mencapai target',
    }
    for (const year of YEARS) for (const scope of ['all', 'Kota', 'Kabupaten'] as const) {
      const { achieved, total } = metrics(filterRows(rows, year, scope))
      expect(achievementNote(achieved, total), `${year} ${scope}`).toBe(expected[`${year}:${scope}`])
    }
  })
})

describe('judul tabel mengikuti urutan aktif', () => {
  it('prevalensi, jarak target, dan K6 di dua arah', () => {
    expect(rankingTitle('prevalence', true, 2022)).toBe('Prevalensi Tertinggi, 2022')
    expect(rankingTitle('prevalence', false, 2021)).toBe('Prevalensi Terendah, 2021')
    expect(rankingTitle('target', true, 2022)).toBe('Jarak ke Target Terbesar, 2022')
    expect(rankingTitle('target', false, 2019)).toBe('Jarak ke Target Terkecil, 2019')
    expect(rankingTitle('change', true, 2022)).toBe('Kenaikan Terbesar / Penurunan Terkecil 2019→2022')
    expect(rankingTitle('change', false, 2021)).toBe('Penurunan Terbesar 2019→2022')
  })
})
