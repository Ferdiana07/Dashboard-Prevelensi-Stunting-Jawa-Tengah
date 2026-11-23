import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, width = 1672, height = 941) {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await expect(page.locator('[data-region]')).toHaveCount(35)
  await page.evaluate(() => document.fonts.ready)
}

const infoButton = (page: Page) => page.getByRole('button', { name: 'Keterangan tabel', exact: true })

test('ⓘ popover: click, Enter and Space open it; Escape closes it and returns focus; it holds the table legend', async ({ page }) => {
  await ready(page)
  const button = infoButton(page)
  const popover = page.locator(`#${await button.getAttribute('aria-controls')}`)
  // A 20x20 button right after the ranking title; the old footnote under the table is gone.
  expect(await button.evaluate(el => [el.getBoundingClientRect().width, el.getBoundingClientRect().height])).toEqual([20, 20])
  await expect(page.locator('.ranking-heading')).toContainText('Peringkat Wilayah')
  await expect(page.locator('.table-note')).toHaveCount(0)
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(popover).toBeHidden()

  await button.click()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(popover).toBeVisible()
  for (const text of ['Target: selisih dari 14%', 'pp = poin persentase', 'Peringkat berdasarkan cakupan filter', 'Perubahan = prevalensi 2022 − prevalensi 2019, sama untuk semua tahun yang dipilih']) await expect(popover).toContainText(text)
  await button.click()
  await expect(popover).toBeHidden()

  for (const key of ['Enter', 'Space']) {
    await button.focus()
    await page.keyboard.press(key)
    await expect(popover, key).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(popover).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('aria-expanded', 'false')
  }

  await button.click()
  await page.locator('#map-title').click()
  await expect(popover, 'a click outside closes it').toBeHidden()
})

test('ⓘ popover opens on hover and closes when the pointer leaves', async ({ page }) => {
  await ready(page)
  const popover = page.locator('.info-popover')
  await infoButton(page).hover()
  await expect(popover).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(popover).toBeHidden()
})

for (const [width, height] of [[1672, 941], [1536, 730], [1280, 720], [1100, 790], [390, 844]]) {
  test(`ⓘ popover stays inside the viewport and on top of every panel at ${width}x${height}`, async ({ page }) => {
    await ready(page, width, height)
    await infoButton(page).scrollIntoViewIfNeeded()
    await infoButton(page).click()
    const result = await page.locator('.info-popover').evaluate(el => {
      const r = el.getBoundingClientRect()
      const points = [[r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4], [r.left + r.width / 2, r.top + r.height / 2]]
      return { inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, onTop: points.every(([x, y]) => el.contains(document.elementFromPoint(x, y))), font: parseFloat(getComputedStyle(el).fontSize) }
    })
    expect(result.inside).toBe(true)
    expect(result.onTop).toBe(true)
    expect(result.font).toBeGreaterThanOrEqual(12)
  })
}

test('ⓘ button has a 32px touch area on phones', async ({ page }) => {
  await ready(page, 390, 844)
  const area = await infoButton(page).evaluate(el => { const s = getComputedStyle(el, '::before'); return [parseFloat(s.top), parseFloat(s.left), el.getBoundingClientRect().width] })
  expect(area).toEqual([-6, -6, 20])
})

test('K4 note at zero achievement fits one line at 1280x720, so the cards keep the same height in 2019 and 2022', async ({ page }) => {
  await ready(page, 1280, 720)
  const cards = () => page.locator('.scorecard').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height)))
  const notes = () => page.locator('.score-note').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight))))
  const heights2022 = await cards()
  await page.getByLabel('Tahun:', { exact: true }).selectOption('2019')
  await expect(page.locator('.scorecard.green .score-note')).toHaveText('belum ada yang mencapai target')
  expect(await cards()).toEqual(heights2022)
  expect(await notes()).toEqual([1, 1, 1, 1])
})
