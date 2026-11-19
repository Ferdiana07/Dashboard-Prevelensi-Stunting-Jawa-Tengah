import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { labelText, layoutLabels, lowCategoryRows, overlaps, type Box, type LabelInput } from '../../src/lib/mapLabels'
import type { StuntingRow, Year } from '../../src/types'

const rows = Papa.parse<Record<string, string>>(readFileSync('public/data/stunting.csv', 'utf8'), { header: true, skipEmptyLines: true }).data
  .map(r => ({ code: r.kode_wilayah, name: r.wilayah, type: r.tipe_wilayah, year: Number(r.tahun), prevalence: Number(r.prevalensi) })) as unknown as StuntingRow[]
const lowIn = (year: Year, type?: string) => lowCategoryRows(rows.filter(row => row.year === year && (!type || row.type === type))).map(labelText).sort()

describe('P10 low-category labels', () => {
  it('lists the expected regions per year', () => {
    expect(lowIn(2019)).toEqual([])
    expect(lowIn(2021)).toEqual(['Kab. Grobogan 9,6%', 'Kab. Wonogiri 14,0%', 'Kota Magelang 13,3%'])
    expect(lowIn(2022)).toEqual(['Kota Magelang 13,9%', 'Kota Semarang 10,4%'])
  })
  it('respects the scope', () => {
    expect(lowIn(2022, 'Kabupaten')).toEqual([])
    expect(lowIn(2022, 'Kota')).toHaveLength(2)
  })
})

describe('label layout', () => {
  const frame: Box = { x: 4, y: 4, width: 752, height: 432 }
  const inset: Box = { x: 15, y: 12, width: 145, height: 110 }
  const buttons: Box = { x: 720, y: 10, width: 32, height: 106 }
  it('keeps labels apart and away from the inset and zoom buttons, even when anchors crowd together', () => {
    const inputs: LabelInput[] = [[60, 60], [70, 66], [700, 40], [400, 200], [405, 204]].map(([x, y], index) => ({ code: String(index), text: `Kota Contoh ${index} 10,4%`, anchor: [x, y], bounds: { x: x - 10, y: y - 10, width: 20, height: 20 }, marker: true }))
    const placed = layoutLabels(inputs, [inset, buttons], frame, 11)
    placed.forEach((label, index) => {
      expect(overlaps(label.box, inset)).toBe(false)
      expect(overlaps(label.box, buttons)).toBe(false)
      placed.slice(index + 1).forEach(other => expect(overlaps(label.box, other.box)).toBe(false))
    })
    // Anchors 0 and 1 sit under the inset, so they are skipped; the three crowded ones all get a label.
    expect(placed.map(label => label.code).sort()).toEqual(['2', '3', '4'])
  })
  it('puts the label inside a large region and uses a leader line for a small one', () => {
    const [large] = layoutLabels([{ code: 'a', text: 'Kab. A 9,6%', anchor: [300, 200], bounds: { x: 240, y: 150, width: 120, height: 100 }, marker: false }], [], frame, 11)
    expect(large.leader).toBeNull()
    const [small] = layoutLabels([{ code: 'b', text: 'Kota Magelang 13,9%', anchor: [300, 200], bounds: { x: 292, y: 192, width: 16, height: 16 }, marker: true }], [], frame, 11)
    expect(small.leader).not.toBeNull()
  })
})
