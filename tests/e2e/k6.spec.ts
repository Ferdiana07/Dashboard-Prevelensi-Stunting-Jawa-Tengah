import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { test, expect, type Page } from '@playwright/test'

// Independent reference read straight from the CSV, without the app's parsing, rounding or formatting.
interface RawRow { kode_wilayah: string; wilayah: string; tipe_wilayah: string; tahun: string; prevalensi: string; k6_perubahan_2019_2022: string }
const source = Papa.parse<RawRow>(readFileSync('public/data/stunting.csv', 'utf8'), { header: true, skipEmptyLines: true }).data
const hundredths = (value: string) => Math.round(Number(value) * 100)
// Half away from zero on whole hundredths, so no float tie is ever judged (e.g. -5,55 → -5,6).
const tenths = (h: number) => Math.sign(h) * Math.floor((Math.abs(h) + 5) / 10)
const label = (h: number) => { const t = tenths(h); return `${t > 0 ? '+' : ''}${(t / 10).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` }
function expected(scope: 'all' | 'Kabupaten' | 'Kota') {
  const at = (code: string, year: string) => source.find(row => row.kode_wilayah === code && row.tahun === year)!
  return source.filter(row => row.tahun === '2019' && (scope === 'all' || row.tipe_wilayah === scope)).map(row => {
    const change = hundredths(at(row.kode_wilayah, '2022').prevalensi) - hundredths(row.prevalensi)
    // The cleaned CSV carries K6 too; it must agree with the prevalence difference.
    expect(hundredths(row.k6_perubahan_2019_2022)).toBe(change)
    return { code: row.kode_wilayah, name: row.wilayah, change }
  }).sort((a, b) => b.change - a.change || a.code.localeCompare(b.code))
}

async function ready(page: Page) { await page.goto('/'); await expect(page.locator('[data-region]')).toHaveCount(35); await expect(page.locator('[data-k6-bar]').first()).toBeAttached() }
const scopeSelect = (page: Page) => page.getByLabel('Wilayah:', { exact: true })

test('K6 panel: bars per scope, order and labels match the CSV', async ({ page }) => {
  await ready(page)
  await expect(page.locator('#k6-title')).toHaveText('Perubahan Prevalensi 2019→2022 (K6)')
  await expect(page.locator('.k6-heading p')).toHaveText('Menjawab CBQ 2: wilayah yang naik atau turunnya paling lambat. Diurutkan dari kenaikan terbesar.')
  for (const [scope, count, up, flat, down] of [['all', 35, 6, 1, 28], ['Kabupaten', 29, 6, 1, 22], ['Kota', 6, 0, 0, 6]] as const) {
    await scopeSelect(page).selectOption(scope)
    const reference = expected(scope)
    await expect(page.locator('[data-k6-bar]')).toHaveCount(count)
    expect(reference).toHaveLength(count)
    await expect(page.locator('[data-k6-bar] .k6-name')).toHaveText(reference.map(row => row.name))
    await expect(page.locator('[data-k6-bar] .k6-value')).toHaveText(reference.map(row => label(row.change)))
    const directions = await page.locator('[data-k6-bar]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-direction')))
    expect(directions).toEqual(reference.map(row => row.change > 0 ? 'up' : row.change < 0 ? 'down' : 'flat'))
    await expect(page.locator('[data-k6-card="up"] strong')).toHaveText(String(up))
    await expect(page.locator('[data-k6-card="flat"] strong')).toHaveText(String(flat))
    await expect(page.locator('[data-k6-card="down"] strong')).toHaveText(String(down))
    // Increases are bold and separated from the rest by a dashed line; a no-change region is a dot, not a bar.
    const weights = await page.locator('[data-k6-bar] .k6-name').evaluateAll(nodes => nodes.map(node => node.getAttribute('font-weight')))
    expect(weights).toEqual(directions.map(direction => direction === 'up' ? '700' : '450'))
    await expect(page.locator('.k6-separator')).toHaveCount(up > 0 ? 1 : 0)
    await expect(page.locator('[data-direction="flat"] circle')).toHaveCount(flat)
    // The year filter does not change K6.
    await page.getByLabel('Tahun:', { exact: true }).selectOption('2019')
    await expect(page.locator('[data-k6-bar] .k6-value')).toHaveText(reference.map(row => label(row.change)))
    await page.getByLabel('Tahun:', { exact: true }).selectOption('2022')
  }
  await scopeSelect(page).selectOption('all')
  await expect(page.locator('[data-k6-bar="3329"] .k6-value')).toHaveText('-5,6') // Kab. Brebes, -5,55 rounded away from zero
  await expect(page.locator('[data-k6-card="up"]')).toContainText('Terbesar: Kab. Pati +3,6 pp')
  await expect(page.locator('[data-k6-card="flat"]')).toContainText('Kab. Pekalongan 0,0 pp')
  await expect(page.locator('[data-k6-card="down"]')).toContainText('Terbesar: Kab. Demak -19,6 pp')
  await expect(page.locator('.k6-panel')).not.toContainText('—')
})

test('K6 axis: zero line, 5 pp ticks, data-driven domain and direction labels', async ({ page }) => {
  await ready(page)
  await expect(page.locator('.k6-tick')).toHaveText(['-20', '-15', '-10', '-5', '0'])
  await expect(page.locator('.k6-direction.down')).toHaveText('← Turun (membaik)')
  await expect(page.locator('.k6-direction.up')).toHaveText('Naik (memburuk) →')
  const zero = (await page.locator('.k6-zero').boundingBox())!
  for (const node of await page.locator('[data-direction="down"] rect').all()) expect((await node.boundingBox())!.x + (await node.boundingBox())!.width).toBeCloseTo(zero.x + zero.width / 2, 0)
  for (const node of await page.locator('[data-direction="up"] rect').all()) expect((await node.boundingBox())!.x).toBeCloseTo(zero.x + zero.width / 2, 0)
  // Colours: increase full red, decrease green at reduced opacity.
  expect(await page.locator('[data-direction="up"] rect').first().getAttribute('fill')).toBe('#a12b30')
  expect(await page.locator('[data-direction="down"] rect').first().getAttribute('fill')).toBe('#216a49')
  expect(Number(await page.locator('[data-direction="down"] rect').first().getAttribute('fill-opacity'))).toBeCloseTo(.55, 2)
  // Kota has no increase: the axis is not made symmetric, it only keeps room for the "Naik" label.
  await scopeSelect(page).selectOption('Kota')
  const ticks = await page.locator('.k6-tick').allTextContents()
  expect(ticks[0]).toBe('-15')
  expect(ticks.filter(t => t.startsWith('+')).length).toBeLessThanOrEqual(1)
})

type Box = { x: number; y: number; width: number; height: number; label: string }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width - .5 && b.x < a.x + a.width - .5 && a.y < b.y + b.height - .5 && b.y < a.y + a.height - .5
for (const width of [1672, 390]) {
  test(`K6 labels never overlap at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await ready(page)
    for (const scope of ['all', 'Kabupaten', 'Kota'] as const) {
      await scopeSelect(page).selectOption(scope)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(100)
      const { texts, marks, panel, cards, chart } = await page.evaluate(() => {
        const box = (node: Element, label: string) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, label } }
        return {
          texts: [...document.querySelectorAll('.k6-chart text')].map(node => box(node, `${node.getAttribute('class')}:${node.textContent}`)),
          marks: [...document.querySelectorAll('.k6-mark')].map(node => box(node, `mark:${node.closest('[data-k6-bar]')!.getAttribute('data-k6-bar')}`)),
          panel: box(document.querySelector('.k6-panel')!, 'panel'),
          cards: box(document.querySelector('.k6-side')!, 'cards'),
          chart: box(document.querySelector('.k6-chart svg')!, 'chart'),
        }
      })
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) expect(overlaps(texts[i], texts[j]), `${scope}: ${texts[i].label} × ${texts[j].label}`).toBe(false)
      for (const text of texts) for (const mark of marks) expect(overlaps(text, mark), `${scope}: ${text.label} × ${mark.label}`).toBe(false)
      for (const text of texts) {
        expect(text.x, `${scope}: ${text.label} inside panel`).toBeGreaterThanOrEqual(panel.x)
        expect(text.x + text.width, `${scope}: ${text.label} inside panel`).toBeLessThanOrEqual(panel.x + panel.width)
      }
      expect(overlaps(cards, chart)).toBe(false)
      // Phones: cards above a full-width chart. Desktop: cards beside it.
      if (width <= 560) { expect(cards.y + cards.height).toBeLessThanOrEqual(chart.y); expect(chart.width).toBeGreaterThan(panel.width - 40) }
      else expect(cards.x).toBeGreaterThanOrEqual(chart.x + chart.width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
