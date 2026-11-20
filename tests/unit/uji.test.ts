import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv } from '../../src/lib/data'
import { fieldCorrect, parseNumber, respondentId, shuffle, susGrade, susScore } from '../../src/uji/scoring'
import { STATIC_TASKS, REGIONS } from '../../src/uji/content'
import { mean, k6Change } from '../../src/lib/calculations'

const rows = parseCsv(readFileSync('public/data/stunting.csv', 'utf8'))

describe('SUS', () => {
  it('scores the standard extremes and a mixed case', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100)
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0)
    expect(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50)
    expect(susScore([4, 2, 4, 2, 4, 2, 4, 2, 4, 2])).toBe(75)
    expect(susScore([4, 2, 4])).toBeNull()
  })
  it('places the 75 target in grade B', () => {
    expect(susGrade(75).grade).toBe('B')
    expect(susGrade(80.3).grade).toBe('A')
    expect(susGrade(50).grade).toBe('F')
  })
})

describe('answer checking', () => {
  it('accepts Indonesian and English decimals within display rounding', () => {
    expect(parseNumber('21,7')).toBe(21.7)
    expect(parseNumber(' 21.7 % ')).toBe(21.7)
    expect(parseNumber('dua puluh')).toBeNull()
    const field = { key: 'x', label: '', type: 'number' as const, unit: '%', answer: 21.7 }
    expect(fieldCorrect(field, '21,7')).toBe(true)
    expect(fieldCorrect(field, '21,6')).toBe(false)
    expect(fieldCorrect(field, '22')).toBe(false)
  })
})

describe('answer keys match the dataset', () => {
  const at = (name: string, year: number) => rows.find(r => r.name === name && r.year === year)!.prevalence
  it('A1: Brebes is highest in 2022 and jumps 2021 → 2022', () => {
    const y2022 = rows.filter(r => r.year === 2022).sort((a, b) => b.prevalence - a.prevalence)
    expect(y2022[0].name).toBe(STATIC_TASKS[0].fields[0].answer)
    expect(at('Kab. Brebes', 2022) > at('Kab. Brebes', 2021)).toBe(true)
    expect(at('Kab. Brebes', 2021) < at('Kab. Brebes', 2019)).toBe(true)
  })
  it('A2: kabupaten average 2022 and largest K6 increase among kabupaten', () => {
    const kab = rows.filter(r => r.year === 2022 && r.type === 'Kabupaten')
    expect(mean(kab)!).toBeCloseTo(21.7, 1)
    const worst = kab.map(r => ({ name: r.name, d: k6Change(rows, r.code)! })).sort((a, b) => b.d - a.d)[0]
    expect(worst.name).toBe('Kab. Pati')
  })
  it('B2: kabupaten average is larger in 2021', () => {
    const kab = mean(rows.filter(r => r.year === 2021 && r.type === 'Kabupaten'))!
    const kota = mean(rows.filter(r => r.year === 2021 && r.type === 'Kota'))!
    expect(kab).toBeGreaterThan(kota)
    expect(Math.round(kab * 10) / 10).toBe(20.1)
  })
  it('B1: Temanggung 2022 value and 2021 → 2022 direction', () => {
    const b1 = STATIC_TASKS.find(t => t.id === 'B1')!
    const [value, trend] = b1.fields
    expect(b1.target).toBe(rows.find(r => r.name === 'Kab. Temanggung')!.code)
    expect(value.type === 'number' && value.answer).toBeCloseTo(at('Kab. Temanggung', 2022), 1)
    expect(at('Kab. Temanggung', 2022) > at('Kab. Temanggung', 2021)).toBe(true)
    expect(trend.answer).toBe('Memburuk (prevalensi naik)')
  })
  it('A1 target is Brebes', () => {
    expect(STATIC_TASKS[0].target).toBe(rows.find(r => r.name === 'Kab. Brebes')!.code)
  })
  it('region list matches the CSV', () => {
    expect(REGIONS.map(r => `${r.code}:${r.name}`)).toEqual(rows.filter(r => r.year === 2019).map(r => `${r.code}:${r.name}`))
  })
})

describe('helpers', () => {
  it('shuffle keeps all items and ids carry the persona', () => {
    expect(shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3])
    expect(respondentId('B')).toMatch(/^B-[A-HJ-NP-Z2-9]{4}$/)
  })
})
