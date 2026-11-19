import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Analisis Tren Temporal' })).toBeVisible()
}
const mode = (page: Page, name: string) => page.locator('.mode-tabs').getByRole('button', { name, exact: true }).click()
const labels = (page: Page) => page.locator('.trend-value-label')
const rects = (page: Page) => labels(page).evaluateAll(nodes => nodes.map(node => {
  const r = node.getBoundingClientRect()
  return { text: node.textContent, series: node.getAttribute('data-series'), year: node.getAttribute('data-year'), position: node.getAttribute('data-position'), left: r.left, right: r.right, top: r.top, bottom: r.bottom }
}))
const hit = (a: { left: number; right: number; top: number; bottom: number }, b: typeof a) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

test('P13: modes with at most two series show value labels, Multiwilayah does not', async ({ page }) => {
  await ready(page)
  await expect(labels(page)).toHaveText(['27,1%', '20,0%', '20,7%'])
  await mode(page, 'Satu wilayah')
  await expect(labels(page)).toHaveCount(3)
  await mode(page, 'Kota vs Kab.')
  await expect(labels(page)).toHaveCount(6)
  await mode(page, 'Multiwilayah')
  await expect(labels(page)).toHaveCount(0)
  await expect(page.locator('.trend-chart')).toBeVisible()
})

test('P13: Kota vs Kab. labels sit on opposite sides of their points and never collide', async ({ page }) => {
  await ready(page)
  await mode(page, 'Kota vs Kab.')
  await expect(labels(page)).toHaveCount(6)
  const all = await rects(page)
  expect(all.map(item => `${item.year}:${item.series}:${item.text}`).sort()).toEqual([
    '2019:Kabupaten:27,6%', '2019:Kota:24,5%', '2021:Kabupaten:20,1%', '2021:Kota:19,1%', '2022:Kabupaten:21,7%', '2022:Kota:15,8%',
  ])
  for (const year of ['2019', '2021', '2022']) {
    const kab = all.find(item => item.year === year && item.series === 'Kabupaten')!
    const kota = all.find(item => item.year === year && item.series === 'Kota')!
    expect(kab.position, `${year}: the higher series (Kabupaten) is labelled above`).toBe('above')
    expect(kota.position, `${year}: the lower series (Kota) is labelled below`).toBe('below')
    expect(hit(kab, kota), `${year}: labels overlap`).toBe(false)
  }
  all.forEach((item, index) => all.slice(index + 1).forEach(other => expect(hit(item, other), `${item.year} ${item.series} vs ${other.year} ${other.series}`).toBe(false)))
  // Labels do not sit on top of the data markers either.
  const markers = await page.locator('.trend-observation').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom } }))
  all.forEach(item => markers.forEach(marker => expect(hit(item, marker), `${item.year} ${item.series} label covers a marker`).toBe(false)))
  await page.locator('.trend-panel').screenshot({ path: '.impeccable/review/p13-groups.png' })
})

test('P13: the 2019 point stays unconnected and 2020 has no label', async ({ page }) => {
  await ready(page)
  for (const name of ['Rata-rata', 'Kota vs Kab.']) {
    await mode(page, name)
    const paths = await page.locator('.recharts-line-curve').evaluateAll(nodes => nodes.map(node => node.getAttribute('d') ?? ''))
    for (const d of paths) {
      const segments = d.split('M').filter(Boolean)
      expect(segments.length, 'a gap splits the line into two pieces').toBe(2)
      expect(segments[0].includes('L'), '2019 stays a lone point, no connector to 2021').toBe(false)
      expect(segments[1].includes('L'), '2021 to 2022 stays connected').toBe(true)
    }
    expect((await rects(page)).some(item => item.year === '2020')).toBe(false)
  }
})
