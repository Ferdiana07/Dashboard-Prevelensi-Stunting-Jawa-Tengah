import { test, expect, type Page } from '@playwright/test'

// Membuat ulang stimulus Level 3 dari dashboard saat ini (tampilan awal: 2022, semua wilayah, tren Rata-rata).
// Jalankan hanya bila tampilan dashboard berubah:  UJI_STIMULI=1 npx playwright test tests/e2e/uji-stimulus.spec.ts
// Anotasi yang menamai metrik (judul, subjudul, nama seri, catatan, link, kontrol) disembunyikan;
// teks berisi data (marks, label nilai, label wilayah, sumbu, legenda kategori, garis acuan 14%, inset Karimunjawa) dipertahankan.
const hidden = '.panel h2,.map-heading p,.map-footer h3,.trend-heading p,.scope-note,.map-help,.trend-notes,.table-note,.chart-explanation,.mode-tabs,.trend-selection,.multi-select,.map-controls,.skip-link,.panel-link,.series-legend {visibility:hidden!important} vite-error-overlay {display:none!important}'
// Baris judul/kontrol yang hanya menyisakan ruang kosong dihapus dari tata letak, khusus saat capture.
// Hanya untuk panel yang ukuran SVG-nya tidak berubah karenanya; peta ikut membesar bila judulnya dihapus,
// sehingga peta tetap memakai visibility:hidden dan screenshot-nya dipotong mulai dari kanvas peta.
const removed = '.comparison-heading,.trend-heading,.series-legend,.trend-notes {display:none!important}'
const panels = [
  { file: 'batang', panel: '.comparison-panel', chart: '.comparison-panel svg.recharts-surface', clipFrom: null },
  { file: 'tren', panel: '.trend-panel', chart: '.trend-panel svg.recharts-surface', clipFrom: null },
  { file: 'peta', panel: '.map-panel', chart: '.map-canvas > svg', clipFrom: '.map-canvas' },
]

const size = async (page: Page, selector: string) => {
  const box = (await page.locator(selector).first().boundingBox())!
  return { width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 }
}

test('capture masked stimuli for the Level 3 test form', async ({ page }) => {
  test.skip(!process.env.UJI_STIMULI, 'Set UJI_STIMULI=1 to regenerate docs/pengujian/stimulus')
  await page.goto('/')
  await expect(page.locator('[data-region]')).toHaveCount(35)
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(0, 0)
  const normal = await Promise.all(panels.map(item => size(page, item.chart)))
  await page.addStyleTag({ content: hidden })
  await page.addStyleTag({ content: removed })
  for (const [i, item] of panels.entries()) {
    // Area grafik di stimulus harus sama persis dengan render normal tanpa mask.
    expect(await size(page, item.chart), item.file).toEqual(normal[i])
    const target = page.locator(item.panel)
    if (!item.clipFrom) { await target.screenshot({ path: `docs/pengujian/stimulus/${item.file}.png`, animations: 'disabled' }); continue }
    await target.scrollIntoViewIfNeeded()
    const panel = (await target.boundingBox())!
    const top = (await page.locator(item.clipFrom).boundingBox())!.y
    await page.screenshot({ path: `docs/pengujian/stimulus/${item.file}.png`, animations: 'disabled', clip: { x: panel.x, y: top, width: panel.width, height: panel.y + panel.height - top } })
  }
})
