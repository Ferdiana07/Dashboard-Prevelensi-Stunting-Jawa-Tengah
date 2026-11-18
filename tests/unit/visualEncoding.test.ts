import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv } from '../../src/lib/data'
import { category } from '../../src/lib/calculations'
import { prevalenceLabel, prevalenceScale, SERIES_STYLES } from '../../src/lib/visualEncoding'

const rows = parseCsv(readFileSync('public/data/stunting.csv', 'utf8'))
describe('encoding preserves numerical comparisons', () => {
  it('uses a zero-based dataset extent large enough for every observation', () => {
    expect(prevalenceScale(rows)).toEqual({ maximum: 40, ticks: [0, 10, 20, 30, 40] })
    expect(Math.max(...rows.map(row => row.prevalence))).toBeLessThan(40)
  })
  it.each([13.999, 14, 14.01, 19.96, 19.999, 20, 29.1])('keeps the displayed value %s inside its actual category', value => {
    const label = prevalenceLabel(value)
    expect(category(Number(label.replace('%', '').replace(',', '.')))).toBe(category(value))
  })
  it('shows the 2021 mean below 20% without changing the KPI value', () => {
    expect(prevalenceLabel(19.959999999999997)).toBe('19,96%')
  })
  it('provides five distinct shapes and line styles for five simultaneous series', () => {
    expect(new Set(SERIES_STYLES.map(style => style.shape)).size).toBe(5)
    expect(new Set(SERIES_STYLES.map(style => style.dash ?? 'solid')).size).toBe(5)
  })
  it('retains correct half-up decimal display without binary toFixed rounding', () => {
    expect(prevalenceLabel(19.65)).toBe('19,7%')
  })
})
