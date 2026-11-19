import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { validateDataset } from '../../src/lib/data'
import { filterRows } from '../../src/lib/calculations'
import { buildExportRows, EXPORT_COLUMNS } from '../../src/lib/export'
import { number, percent, roundHalfAway, signed } from '../../src/lib/format'
import type { Boundaries } from '../../src/types'

const csv = readFileSync('public/data/stunting.csv', 'utf8')
const geo = JSON.parse(readFileSync('public/data/jateng.geojson', 'utf8')) as Boundaries
const { rows } = validateDataset(csv, geo)

describe('pembulatan setengah menjauhi nol', () => {
  it.each([
    [34.65, '34,7'], [23.45, '23,5'], [19.65, '19,7'], [29.1 - 34.65, '-5,6'], [19.65 - 14, '5,7'],
    [-0.04, '0,0'], [0.05, '0,1'], [-0.05, '-0,1'], [14, '14,0'], [19.96, '20,0'],
  ])('number(%s) = %s', (value, expected) => { expect(number(value)).toBe(expected) })
  it('percent dan signed memakai aturan yang sama', () => {
    expect(percent(34.65)).toBe('34,7%'); expect(signed(29.1 - 34.65)).toBe('-5,6 pp'); expect(signed(19.65 - 14)).toBe('+5,7 pp')
  })
  it('roundHalfAway tidak bergantung pada galat floating point', () => {
    expect(roundHalfAway(29.1 - 34.65, 2)).toBe(-5.55)
    expect(roundHalfAway(19.65 - 14, 2)).toBe(5.65)
    expect(roundHalfAway(1.005, 2)).toBe(1.01)
    expect(Object.is(roundHalfAway(-0.001, 2), -0)).toBe(false)
  })
})

describe('ekspor CSV identik dengan CSV sumber', () => {
  const columns = ['kode_wilayah', 'wilayah', 'nama_asli', 'tipe_wilayah', 'tahun', 'prevalensi', 'peringkat', 'kategori', 'k5_jarak_target', 'k6_perubahan_2019_2022']
  const numeric = ['prevalensi', 'k5_jarak_target', 'k6_perubahan_2019_2022', 'tahun', 'peringkat']
  const sourceRaw = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: true })
  const roundTrip = (visible: typeof rows) => Papa.parse<Record<string, string>>(Papa.unparse(buildExportRows(visible, rows), { columns: [...EXPORT_COLUMNS] }), { header: true, skipEmptyLines: true })
  it('memakai 10 kolom yang sama persis dengan urutan sumber', () => {
    expect(sourceRaw.meta.fields).toEqual(columns)
    expect([...EXPORT_COLUMNS]).toEqual(columns)
    expect(roundTrip(rows).meta.fields).toEqual(columns)
  })
  it('semua 105 baris sama dengan baris CSV sumber, nilai demi nilai', () => {
    const exported = roundTrip(rows).data
    expect(exported).toHaveLength(sourceRaw.data.length)
    for (const row of exported) {
      const original = sourceRaw.data.find(item => item.kode_wilayah === row.kode_wilayah && item.tahun === row.tahun)!
      for (const column of columns) {
        const label = `${row.kode_wilayah} ${row.tahun} ${column}`
        // "14" and "14.0" are the same number; text columns must match exactly.
        if (numeric.includes(column)) expect(Number(row[column]), label).toBe(Number(original[column]))
        else expect(row[column], label).toBe(original[column])
      }
    }
  })
  it('hanya memuat tahun dan cakupan terpilih, dengan peringkat tetap dari 35 wilayah', () => {
    for (const year of [2019, 2021, 2022] as const) for (const scope of ['all', 'Kota', 'Kabupaten'] as const) {
      const exported = roundTrip(filterRows(rows, year, scope)).data
      expect(exported, `${year} ${scope}`).toHaveLength(scope === 'all' ? 35 : scope === 'Kota' ? 6 : 29)
      for (const row of exported) {
        const original = sourceRaw.data.find(item => item.kode_wilayah === row.kode_wilayah && item.tahun === String(year))!
        expect(row.tahun).toBe(String(year)); expect(row.peringkat).toBe(original.peringkat); expect(row.kategori).toBe(original.kategori)
      }
    }
  })
  it('tidak memuat kolom perubahan tahun sebelumnya', () => {
    const keys = Object.keys(buildExportRows(rows, rows)[0])
    expect(keys).toHaveLength(10)
    expect(keys.join()).not.toContain('sebelumnya')
  })
})
