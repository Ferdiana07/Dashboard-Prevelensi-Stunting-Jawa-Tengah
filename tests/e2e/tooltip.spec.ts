import { test, expect, type Page } from '@playwright/test'

async function safeTooltip(page: Page, x: number, y: number) {
  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toBeVisible()
  const box = (await tooltip.boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(8)
  expect(box.y).toBeGreaterThanOrEqual(8)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 8 + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 8 + 1)
  expect(Math.max(box.x - x, x - box.x - box.width, box.y - y, y - box.y - box.height)).toBeGreaterThanOrEqual(17)
  await expect(tooltip).toHaveCSS('pointer-events', 'none')
  await expect(tooltip).toHaveCSS('position', 'fixed')
  return box
}

test('Wonogiri preview follows the cursor without covering it and still allows selection', async ({ page }) => {
  await page.goto('/')
  const region = page.locator('[data-region="3312"]')
  await region.hover({ force: true })
  const point = await region.evaluate(element => {
    const box = element.getBoundingClientRect()
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  })
  await page.mouse.move(point.x, point.y)
  await expect(page.getByRole('tooltip')).toContainText('Kab. Wonogiri')
  const first = await safeTooltip(page, point.x, point.y)
  await page.mouse.move(point.x + 6, point.y - 4)
  const next = await safeTooltip(page, point.x + 6, point.y - 4)
  expect(next.x).not.toBe(first.x)
  await page.mouse.click(point.x + 6, point.y - 4)
  await expect(page.locator('#region')).toHaveValue('3312')
  await expect(page.locator('.detail-panel')).toContainText('Kab. Wonogiri')
})

test('popup flips at viewport edges using the rendered size, including narrow screens', async ({ page }) => {
  await page.goto('/')
  const region = page.locator('[data-region="3312"]')
  await expect(region).toBeVisible()
  for (const viewport of [{ width: 1366, height: 650 }, { width: 390, height: 600 }]) {
    await page.setViewportSize(viewport)
    for (const point of [{ x: 30, y: 30 }, { x: viewport.width - 20, y: 30 }, { x: viewport.width - 20, y: viewport.height - 20 }, { x: 30, y: viewport.height - 20 }, { x: viewport.width / 2, y: viewport.height / 2 }]) {
      // Exercise the real pointer handler at boundary coordinates that small
      // geographic polygons do not necessarily occupy on the initial map.
      await region.dispatchEvent('pointermove', { pointerType: 'mouse', clientX: point.x, clientY: point.y })
      await safeTooltip(page, point.x, point.y)
    }
  }
})

test('keyboard preview still works, Escape dismisses it, and page scroll clears a stale preview', async ({ page }) => {
  await page.goto('/')
  const region = page.locator('[data-region="3312"]')
  await region.focus()
  await expect(page.getByRole('tooltip')).toContainText('Kab. Wonogiri')
  await expect(region).toHaveAttribute('aria-describedby', /tooltip$/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await region.hover({ force: true })
  await expect(page.getByRole('tooltip')).toBeVisible()
  await page.mouse.wheel(0, 180)
  await expect(page.getByRole('tooltip')).toHaveCount(0)
})
