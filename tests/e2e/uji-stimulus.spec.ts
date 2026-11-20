import { test, expect } from '@playwright/test'

// Membuat ulang stimulus Level 3 dari dashboard saat ini (tampilan awal: 2022, semua wilayah, tren Rata-rata).
// Jalankan hanya bila tampilan dashboard berubah:  UJI_STIMULI=1 npx playwright test tests/e2e/uji-stimulus.spec.ts
// Masking sama dengan tests/e2e/visual-encoding.spec.ts: judul, subjudul, catatan, kontrol, dan anotasi disembunyikan;
// marks, angka data, sumbu, legenda kategori, dan garis acuan dipertahankan.
const mask = '.panel h2,.map-heading p,.map-footer h3,.trend-heading p,.scope-note,.map-help,.trend-notes,.table-note,.chart-explanation,.mode-tabs,.trend-selection,.multi-select,.map-controls,.skip-link {visibility:hidden!important} vite-error-overlay {display:none!important}'

test('capture masked stimuli for the Level 3 test form', async ({ page }) => {
  test.skip(!process.env.UJI_STIMULI, 'Set UJI_STIMULI=1 to regenerate docs/pengujian/stimulus')
  await page.goto('/')
  await expect(page.locator('[data-region]')).toHaveCount(35)
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: mask })
  await page.mouse.move(0, 0)
  for (const [file, selector] of [['peta', '.map-panel'], ['batang', '.comparison-panel'], ['tren', '.trend-panel']]) {
    await page.locator(selector).screenshot({ path: `docs/pengujian/stimulus/${file}.png`, animations: 'disabled' })
  }
})
