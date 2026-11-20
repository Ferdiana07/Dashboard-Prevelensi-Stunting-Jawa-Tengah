import { test, expect, type Page } from '@playwright/test'

async function ready(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Peta Prevalensi Stunting' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
const SIZES: [number, number][] = [[1672, 941], [1366, 768], [1280, 720]]

for (const [width, height] of SIZES) {
  test(`Karimunjawa inset keeps its size, leaves the mainland alone and hides no city marker at ${width}x${height}`, async ({ page }) => {
    await ready(page, width, height)
    const result = await page.evaluate(() => {
      const rect = document.querySelector<SVGRectElement>('.inset rect')!
      const box = rect.getBoundingClientRect()
      // Inset size in SVG units: must stay the original 145 x 110 whatever the map scale.
      const scale = rect.ownerSVGElement!.getScreenCTM()!.a
      const paths = [...document.querySelectorAll<SVGGeometryElement>('path[data-region]')]
      let land = 0, samples = 0
      for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
        samples++
        const x = box.left + box.width * i / 12, y = box.top + box.height * j / 12
        if (paths.some(path => path.isPointInFill(new DOMPoint(x, y).matrixTransform(path.getScreenCTM()!.inverse())))) land++
      }
      const markers = [...document.querySelectorAll('.city-marker')].map(marker => {
        const b = marker.getBoundingClientRect()
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        return { visible: top === marker || marker.contains(top), insideInset: b.left + b.width / 2 > box.left && b.left + b.width / 2 < box.right && b.top + b.height / 2 > box.top && b.top + b.height / 2 < box.bottom }
      })
      const text = document.querySelector('.inset text')!
      const caption = text.getBoundingClientRect()
      const textScale = (text as SVGGraphicsElement).getScreenCTM()!.a
      return { widthUnits: box.width / scale, heightUnits: box.height / scale, landShare: land / samples, markers, captionInside: caption.left >= box.left && caption.right <= box.right && caption.top >= box.top && caption.bottom <= box.bottom, captionPx: parseFloat(getComputedStyle(text).fontSize) * textScale }
    })
    expect(result.widthUnits).toBeCloseTo(145, 0)
    expect(result.heightUnits).toBeCloseTo(110, 0)
    // The box may only touch the Brebes/Tegal coast corner it always did (about 5% of the box), never the west of the province.
    expect(result.landShare).toBeLessThan(0.08)
    expect(result.markers).toHaveLength(6)
    expect(result.markers.every(marker => marker.visible && !marker.insideInset)).toBe(true)
    expect(result.captionInside).toBe(true)
    expect(result.captionPx).toBeGreaterThanOrEqual(12)
  })

  test(`the 'Perubahan 2019→2022' header breaks into two lines and the table does not scroll sideways at ${width}x${height}`, async ({ page }) => {
    await ready(page, width, height)
    await expect(page.locator('tbody tr')).toHaveCount(5)
    const lines = await page.locator('.th-line').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top))
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBeGreaterThan(lines[0] + 8)
    const box = await page.locator('.table-scroll').evaluate(node => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, height: node.clientHeight }))
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
    expect(box.height).toBeGreaterThanOrEqual(80)
    // The sort icon stays beside the two lines, inside the same button and column.
    const button = await page.getByRole('button', { name: 'Perubahan 2019→2022' }).boundingBox()
    const icon = await page.getByRole('button', { name: 'Perubahan 2019→2022' }).locator('svg').boundingBox()
    expect(icon!.x).toBeGreaterThan(button!.x)
    expect(icon!.x + icon!.width).toBeLessThanOrEqual(button!.x + button!.width + 1)
  })
}
