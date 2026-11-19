import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, width: number, height = 844) {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Peta Prevalensi Stunting' })).toBeVisible()
}

test('P14: region name column stays pinned with a solid background while the table scrolls sideways', async ({ page }) => {
  await ready(page, 390)
  const scroller = page.locator('.table-scroll')
  expect(await scroller.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true)
  await scroller.evaluate(node => { node.scrollLeft = 160 })
  const frame = await scroller.boundingBox()
  for (const cell of [page.locator('thead th').nth(1), page.locator('tbody th').first(), page.locator('tbody th').nth(4)]) {
    const box = await cell.boundingBox()
    expect(Math.abs(box!.x - frame!.x)).toBeLessThan(3)
    const background = await cell.evaluate(node => getComputedStyle(node).backgroundColor)
    expect(background).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
    expect(await cell.evaluate(node => getComputedStyle(node).position)).toBe('sticky')
  }
  // Selected and hovered rows keep a solid name cell as well.
  await page.locator('tbody .area-name').nth(2).click()
  await page.mouse.move(2, 2)
  await expect(page.locator('.selected-row th')).toHaveCSS('background-color', 'rgb(234, 243, 252)')
  await page.screenshot({ path: '.impeccable/review/p14-table-390.png', clip: { x: 0, y: (await scroller.boundingBox())!.y - 40, width: 390, height: 420 } })
  // Horizontal scrolling is kept: the page itself does not overflow.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('P14: detail panel K6 card spans both columns exactly where the grid becomes two columns', async ({ page }) => {
  for (const [width, columns] of [[390, 2], [768, 2], [960, 2], [961, 3]] as const) {
    await ready(page, width)
    await page.getByLabel('Wilayah:', { exact: true }).selectOption('3329')
    const cards = page.locator('.detail-values > div')
    await expect(cards).toHaveCount(3)
    // Offsets are relative to the grid, so the smooth scroll to the panel cannot skew the measurement.
    const { grid, first, second, third } = await page.locator('.detail-values').evaluate(node => {
      const [a, b, c] = Array.from(node.children) as HTMLElement[]
      const of = (el: HTMLElement) => ({ y: el.offsetTop, width: el.offsetWidth })
      return { grid: { width: (node as HTMLElement).clientWidth }, first: of(a), second: of(b), third: of(c) }
    })
    if (columns === 2) {
      expect(Math.abs(third.width - grid.width), `${width}px: K6 card is full width`).toBeLessThan(2)
      expect(third.y, `${width}px: K6 card sits on its own second row`).toBeGreaterThan(first.y + 20)
      expect(Math.abs(first.y - second.y)).toBeLessThan(2)
    } else {
      expect(third.width, `${width}px: three columns, no span`).toBeLessThan(grid.width / 2)
      expect(Math.abs(first.y - third.y)).toBeLessThan(2)
    }
    if (width === 390) await page.locator('.detail-panel').screenshot({ path: '.impeccable/review/p14-detail-390.png' })
  }
})
