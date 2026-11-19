import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv } from '../../src/lib/data'
import { category, filterRows, mean, roundingShiftsCategory } from '../../src/lib/calculations'
import { exactPercent, percent } from '../../src/lib/format'
import { prevalenceScale, SERIES_STYLES } from '../../src/lib/visualEncoding'

const rows = parseCsv(readFileSync('public/data/stunting.csv', 'utf8'))
describe('encoding preserves numerical comparisons', () => {
  it('uses a zero-based dataset extent large enough for every observation', () => {
    expect(prevalenceScale(rows)).toEqual({ maximum: 40, ticks: [0, 10, 20, 30, 40] })
    expect(Math.max(...rows.map(row => row.prevalence))).toBeLessThan(40)
  })
  it('shows one decimal everywhere and keeps the category from the unrounded value', () => {
    const mean2021 = mean(filterRows(rows, 2021, 'all'))!
    expect(percent(mean2021)).toBe('20,0%')
    expect(exactPercent(mean2021)).toBe('19,96%')
    expect(category(mean2021)).toBe('moderate')
    expect(roundingShiftsCategory(mean2021)).toBe(true)
  })
  it.each([[14, false], [14.04, true], [19.96, true], [20, false], [29.1, false]])('roundingShiftsCategory(%s) = %s', (value, shifted) => {
    expect(roundingShiftsCategory(value)).toBe(shifted)
  })
  it('provides five distinct shapes and line styles for five simultaneous series', () => {
    expect(new Set(SERIES_STYLES.map(style => style.shape)).size).toBe(5)
    expect(new Set(SERIES_STYLES.map(style => style.dash ?? 'solid')).size).toBe(5)
  })
  it('retains correct half-up decimal display without binary toFixed rounding', () => {
    expect(percent(19.65)).toBe('19,7%')
  })
})
