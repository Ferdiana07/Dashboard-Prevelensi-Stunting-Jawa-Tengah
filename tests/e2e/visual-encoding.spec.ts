import { test, expect, type Page } from '@playwright/test'

const mask = '.panel h2,.map-heading p,.map-footer h3,.trend-heading p,.scope-note,.map-help,.trend-notes,.table-note,.chart-explanation,.mode-tabs,.trend-selection,.multi-select,.map-controls,.skip-link {visibility:hidden!important}'
async function ready(page: Page) {
  await page.goto('/')
  await expect(page.locator('[data-region]')).toHaveCount(35)
  await page.evaluate(() => document.fonts.ready)
}

test('masked bars preserve zero, scale, category patterns, target and true length ratios', async ({ page }) => {
  await ready(page)
  await page.addStyleTag({ content: mask })
  await expect(page.locator('#comparison-title')).not.toBeVisible()
  const chart = page.locator('.bar-chart')
  for (const value of ['0%', '10%', '20%', '30%', '40%', '14%', 'Kota', 'Kabupaten', 'Prevalensi (%)']) await expect(chart).toContainText(value)
  const bars = chart.locator('.recharts-bar-rectangle path')
  const city = await bars.nth(0).boundingBox()
  const district = await bars.nth(1).boundingBox()
  expect(district!.width / city!.width).toBeCloseTo(21.69655172413793 / 15.766666666666666, 2)
  await expect(chart.locator('.category-pattern')).toHaveCount(2)
  for (const year of ['2019', '2021', '2022']) {
    await page.locator('#year').selectOption(year)
    await expect(chart.locator('.recharts-xAxis-tick-labels')).toContainText('40%')
  }
})

test('masked map retains geographic regions, three category keys and inert pattern overlays', async ({ page }) => {
  await ready(page)
  await page.addStyleTag({ content: mask })
  await expect(page.locator('#map-title')).not.toBeVisible()
  await expect(page.locator('.map-pattern')).toHaveCount(34) // 33 mainland + Jepara's island inset
  const patterns = await page.locator('.map-pattern').evaluateAll(elements => elements.map(el => ({ pointer: el.getAttribute('pointer-events'), fill: el.getAttribute('fill') })))
  expect(patterns.every(item => item.pointer === 'none' && item.fill?.startsWith('url('))).toBe(true)
  await expect(page.locator('.map-legend')).toContainText('≤ 14%')
  await expect(page.locator('.map-legend')).toContainText('> 14% – < 20%')
  await expect(page.locator('.map-legend')).toContainText('≥ 20%')
  await page.locator('[data-region="3329"]').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#region')).toHaveValue('3329')
  await expect(page.locator('.selected-row')).toContainText('Kab. Brebes')
})

test('masked trend uses category-colored points, a fixed scale, and a real gap in 2020', async ({ page }) => {
  await ready(page)
  await page.addStyleTag({ content: mask })
  const panel = page.locator('.trend-panel')
  await expect(page.locator('#trend-title')).not.toBeVisible()
  await expect(panel.locator('.trend-observation')).toHaveCount(3)
  await expect(panel.locator('.trend-observation[data-year="2020"]')).toHaveCount(0)
  await expect(panel.locator('.trend-observation[data-year="2021"]')).toHaveAttribute('fill', '#ffd000')
  await expect(panel).toContainText('19,96%')
  for (const text of ['0%', '40%', 'Prevalensi (%)', 'Tahun']) await expect(panel).toContainText(text)
  const curve = await panel.locator('.recharts-line-curve').getAttribute('d')
  expect(curve!.match(/M/g)!.length).toBe(2)
  const points = await panel.locator('.trend-observation').evaluateAll(elements => elements.map(el => Number(el.getAttribute('cx'))))
  expect((points[1] - points[0]) / (points[2] - points[1])).toBeCloseTo(2, 2)
  // Configure the stimulus programmatically because controls are deliberately masked.
  await page.locator('.mode-tabs button').last().evaluate(element => (element as HTMLButtonElement).click())
  const shapes = await panel.locator('.trend-observation[data-year="2022"]').evaluateAll(elements => elements.map(el => ({ tag: el.tagName, path: el.getAttribute('d') })))
  expect(shapes[0]).not.toEqual(shapes[1])
  const strokes = await panel.locator('.recharts-line-curve').evaluateAll(elements => elements.map(el => el.getAttribute('stroke-dasharray') ?? 'solid'))
  expect(new Set(strokes).size).toBe(2)
  await expect(panel.locator('.series-legend')).toContainText('Rata-rata kota')
  await expect(panel.locator('.series-legend')).toContainText('Rata-rata kabupaten')
})

test('all five series remain distinguishable and category-colored without hue as series identity', async ({ page }) => {
  await ready(page)
  await page.getByRole('button', { name: 'Multiwilayah', exact: true }).click()
  const choices = page.locator('.multi-select input')
  for (const index of [2, 3, 4]) await choices.nth(index).check()
  await expect(page.locator('.trend-observation')).toHaveCount(15)
  const points = await page.locator('.trend-observation[data-year="2022"]').evaluateAll(elements => elements.map(el => ({ series: el.getAttribute('data-series'), category: el.getAttribute('data-category'), fill: el.getAttribute('fill') })))
  const colors = { achieved: '#08a33e', moderate: '#ffd000', high: '#ed2429' }
  expect(new Set(points.map(point => point.series)).size).toBe(5)
  expect(points.every(point => point.fill === colors[point.category as keyof typeof colors])).toBe(true)
  const curves = await page.locator('.recharts-line-curve').evaluateAll(elements => elements.map(el => el.getAttribute('stroke-dasharray') ?? 'solid'))
  expect(new Set(curves).size).toBe(5)
  await expect(page.locator('.series-legend li')).toHaveCount(5)
})

test('capture title-masked desktop, mobile and grayscale stimuli for the human reverse-mapping test', async ({ page }) => {
  await ready(page)
  await page.addStyleTag({ content: mask })
  const panels = [['map', '.map-panel'], ['bar', '.comparison-panel'], ['trend', '.trend-panel']] as const
  for (const [key, selector] of panels) await page.locator(selector).screenshot({ path: `.impeccable/review/encoding-after-${key}.png` })
  await page.locator('.mode-tabs button').last().evaluate(element => (element as HTMLButtonElement).click())
  await page.locator('.trend-panel').screenshot({ path: '.impeccable/review/encoding-after-groups.png' })
  const gray = await page.addStyleTag({ content: '.map-panel,.comparison-panel,.trend-panel {filter:grayscale(1)}' })
  for (const [key, selector] of panels) await page.locator(selector).screenshot({ path: `.impeccable/review/encoding-grayscale-${key}.png` })
  await gray.evaluate(element => element.parentNode?.removeChild(element))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }) })
  await page.waitForTimeout(150)
  await page.screenshot({ path: '.impeccable/review/encoding-masked-mobile.png', fullPage: true })
  for (const [key, selector] of panels) await page.locator(selector).screenshot({ path: `.impeccable/review/encoding-mobile-${key}.png` })
})
