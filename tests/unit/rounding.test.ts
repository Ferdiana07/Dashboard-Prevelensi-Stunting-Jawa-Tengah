import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { validateDataset } from '../../src/lib/data'
import { buildExportRows } from '../../src/lib/export'
import { number, percent, roundHalfAway, signed } from '../../src/lib/format'
import type { Boundaries } from '../../src/types'

const csv = readFileSync('public/data/stunting.csv', 'utf8')
const geo = JSON.parse(readFileSync('public/data/jateng.geojson', 'utf8')) as Boundaries
const { rows } = validateDataset(csv, geo)
const source = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data

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
  it('k5_jarak_target_pp sama dengan k5_jarak_target untuk semua baris', () => {
    const exported = buildExportRows(rows, rows)
    expect(exported).toHaveLength(source.length)
    for (const row of exported) {
      const original = source.find(item => item.kode_wilayah === row.kode_wilayah && Number(item.tahun) === row.tahun)!
      expect(row.k5_jarak_target_pp).toBe(Number(original.k5_jarak_target))
    }
  })
})
