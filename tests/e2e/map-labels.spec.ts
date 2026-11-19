import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, year: string) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Peta Prevalensi Stunting' })).toBeVisible()
  await page.getByLabel('Tahun:', { exact: true }).selectOption(year)
}
const labelTexts = (page: Page) => page.locator('.map-label text').allTextContents()
type Rect = { left: number; top: number; right: number; bottom: number }
const hit = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

test('P10: low-category regions get a name and value label per year', async ({ page }) => {
  await ready(page, '2019')
  await expect(page.locator('.map-label')).toHaveCount(0)
  await page.getByLabel('Tahun:', { exact: true }).selectOption('2021')
  await expect.poll(() => labelTexts(page).then(list => list.sort())).toEqual(['Kab. Grobogan 9,6%', 'Kab. Wonogiri 14,0%', 'Kota Magelang 13,3%'])
  await page.screenshot({ path: '.impeccable/review/p10-2021-desktop.png' })
  await page.getByLabel('Tahun:', { exact: true }).selectOption('2022')
  await expect.poll(() => labelTexts(page).then(list => list.sort())).toEqual(['Kota Magelang 13,9%', 'Kota Semarang 10,4%'])
  await page.screenshot({ path: '.impeccable/review/p10-2022-desktop.png' })
  // Labels follow the scope: only Kabupaten leaves no label in 2022, only Kota keeps both.
  await page.getByLabel('Wilayah:', { exact: true }).selectOption('Kabupaten')
  await expect(page.locator('.map-label')).toHaveCount(0)
  await page.getByLabel('Wilayah:', { exact: true }).selectOption('Kota')
  await expect(page.locator('.map-label')).toHaveCount(2)
})

test('P10: labels are decorative, haloed, and never touch each other, the inset or the zoom buttons', async ({ page }) => {
  for (const [width, height] of [[1672, 941], [1366, 650], [390, 800]]) {
    await page.setViewportSize({ width, height })
    for (const year of ['2021', '2022']) {
      await ready(page, year)
      await expect(page.locator('.map-labels')).toHaveAttribute('aria-hidden', 'true')
      await expect(page.locator('.map-label text').first()).toHaveCSS('paint-order', /stroke/)
      await expect(page.locator('.map-label text').first()).toHaveCSS('stroke', 'rgb(255, 255, 255)')
      await expect(page.locator('.map-label')).toHaveCount(year === '2021' ? 3 : 2)
      const rects = await page.locator('.map-label text').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }))
      const inset = await page.locator('.inset rect').evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } })
      const buttons = await page.locator('.map-controls').evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } })
      const frame = await page.locator('.map-canvas > svg').evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } })
      rects.forEach((rect, index) => {
        expect(hit(rect, inset), `${width}px ${year}: label ${index} overlaps the inset`).toBe(false)
        expect(hit(rect, buttons), `${width}px ${year}: label ${index} overlaps the zoom buttons`).toBe(false)
        expect(rect.left >= frame.left && rect.right <= frame.right && rect.top >= frame.top && rect.bottom <= frame.bottom, `${width}px ${year}: label ${index} leaves the map`).toBe(true)
        rects.slice(index + 1).forEach(other => expect(hit(rect, other), `${width}px ${year}: labels overlap`).toBe(false))
      })
      if (width === 390) await page.screenshot({ path: `.impeccable/review/p10-${year}-mobile.png`, fullPage: true })
    }
  }
})

test('P10: labels follow zoom and pan but keep their font size', async ({ page }) => {
  await ready(page, '2022')
  const label = page.locator('[data-label="3374"] text')
  const before = { size: await label.evaluate(node => getComputedStyle(node).fontSize), rect: await label.evaluate(node => node.getBoundingClientRect().height) }
  const region = page.locator('[data-region="3374"]')
  const regionBefore = await region.boundingBox()
  await page.getByRole('button', { name: 'Perbesar peta' }).click()
  await page.getByRole('button', { name: 'Perbesar peta' }).click()
  await expect.poll(async () => (await region.boundingBox())!.width).toBeGreaterThan(regionBefore!.width * 1.5)
  const after = { size: await label.evaluate(node => getComputedStyle(node).fontSize), rect: await label.evaluate(node => node.getBoundingClientRect().height) }
  expect(after.size).toBe(before.size)
  expect(Math.abs(after.rect - before.rect)).toBeLessThan(1)
})
