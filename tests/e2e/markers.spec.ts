import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page) { await page.goto('/'); await expect(page.getByRole('heading', { name: 'Peta Prevalensi Stunting' })).toBeVisible() }
// Clicks a spot that really belongs to the region (bounding-box centres of concave regions can land on a neighbour).
async function mouseClickRegion(page: Page, code: string) {
  const point = await page.evaluate(code => {
    const el = document.querySelector(`[data-region="${code}"]`)!
    const r = el.getBoundingClientRect()
    for (let y = r.top; y < r.bottom; y += 3) for (let x = r.left; x < r.right; x += 3) if (document.elementFromPoint(x, y) === el) return { x, y }
    return null
  }, code)
  await page.mouse.click(point!.x, point!.y)
}
const skipTop = (page: Page) => page.locator('.skip-link').evaluate(node => Math.round(node.getBoundingClientRect().top))

test('P12: selected region is marked by an outline that follows its border, with no focus box', async ({ page }) => {
  await ready(page)
  await mouseClickRegion(page, '3315')
  const region = page.locator('[data-region="3315"]')
  await expect(region).toHaveClass(/selected/)
  const outline = page.locator('[data-outline="selected"]')
  await expect(outline).toHaveAttribute('data-code', '3315')
  // The marker is the region's own geometry (not a rectangle) and sits above its neighbours.
  expect(await outline.locator('.outline-selected').getAttribute('d')).toBe(await region.getAttribute('d'))
  await expect(outline.locator('.outline-selected')).toHaveCSS('fill', 'none')
  // No browser focus box on the focused path, whichever way it got focus.
  await expect(region).toHaveCSS('outline-style', 'none')
  await expect(page.locator('[data-outline="focus"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset Filter', exact: true }).click()
  await expect(page.locator('[data-outline]')).toHaveCount(0)
})

test('P12: keyboard focus on a region shows a stroke outline, not a box', async ({ page }) => {
  await ready(page)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.hasAttribute('data-region'))) break
  }
  const code = await page.evaluate(() => document.activeElement?.getAttribute('data-region'))
  expect(code).toBeTruthy()
  const focused = page.locator(`[data-region="${code}"]`)
  await expect(focused).toHaveCSS('outline-style', 'none')
  const ring = page.locator('[data-outline="focus"]')
  await expect(ring).toHaveAttribute('data-code', code!)
  expect(await ring.locator('.outline-focus').getAttribute('d')).toBe(await focused.getAttribute('d'))
  await page.screenshot({ path: '.impeccable/review/p12-focus.png', clip: { x: 0, y: 300, width: 840, height: 520 } })
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('[data-outline="focus"]')).toHaveCount(0)
})

test('P12: the skip link appears for keyboard navigation only, never after mouse use', async ({ page }) => {
  await ready(page)
  expect(await skipTop(page)).toBeLessThan(0)
  await page.getByRole('link', { name: 'Lihat tren ↓', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByLabel('Tahun:', { exact: true }).selectOption('2021')
  await page.getByLabel('Wilayah:', { exact: true }).selectOption('3374')
  await mouseClickRegion(page, '3315')
  await page.locator('.detail-link').click()
  await page.getByRole('button', { name: 'Reset Filter', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  expect(await skipTop(page)).toBeLessThan(0)
  // Keyboard: Tab from the top reveals it.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Peta Prevalensi Stunting' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  expect(await skipTop(page)).toBeGreaterThanOrEqual(0)
  // Leaving the keyboard flow (Escape from the link, then mouse clicks) hides it again.
  await page.mouse.click(5, 5)
  await page.getByLabel('Tahun:', { exact: true }).selectOption('2021')
  expect(await skipTop(page)).toBeLessThan(0)
})
