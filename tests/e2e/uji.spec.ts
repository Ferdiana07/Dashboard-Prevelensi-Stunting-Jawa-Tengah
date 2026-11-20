import { test, expect, type Page } from '@playwright/test'

async function profile(page: Page, persona: 'A' | 'B') {
  await page.getByRole('button', { name: 'Mulai uji' }).click()
  await page.getByLabel('Nama lengkap').fill(`Responden Uji ${persona}`)
  await page.getByLabel('Usia').selectOption('20–29')
  if (persona === 'A') await page.locator('.persona-A').click()
  await page.locator('.scale label').nth(2).click()
  await page.getByRole('button', { name: 'Lanjut' }).click()
  // Persetujuan: tombol menolak tanpa centang dan tanda tangan.
  await page.getByRole('button', { name: /Saya bersedia/ }).click()
  await expect(page.locator('.msg')).toContainText('Centang semua')
  for (const box of await page.locator('.checks input').all()) await box.check()
  await page.getByRole('button', { name: /Saya bersedia/ }).click()
}
async function level3(page: Page) {
  await page.getByRole('button', { name: 'Saya siap' }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Tampilkan diagram' }).click()
    await expect(page.getByAltText('Diagram uji tanpa judul')).toBeVisible()
    await expect(page.locator('.stimulus')).not.toContainText(/Peta Prevalensi|Rata-rata Prevalensi: Kota/)
    await expect(page.getByRole('button', { name: 'Kunci jawaban' })).toBeDisabled()
    await page.locator('fieldset').nth(0).locator('label').first().click()
    await page.locator('fieldset').nth(1).locator('label').first().click()
    await page.getByRole('button', { name: 'Kunci jawaban' }).click()
    await page.locator('.confidence button').nth(3).click()
  }
  await page.getByRole('button', { name: /misi pertama/ }).click()
}
async function startTask(page: Page) {
  await page.getByRole('button', { name: 'Mulai misi' }).click()
  await expect(page.locator('.timer.live')).toBeVisible({ timeout: 20000 })
  return page.frameLocator('iframe')
}
async function answer(page: Page, values: Record<string, string>) {
  await page.getByRole('button', { name: 'Jawab', exact: true }).click()
  for (const [label, value] of Object.entries(values)) {
    const field = page.locator('.sheet .fld', { hasText: label }).locator('select, input')
    if (await field.evaluate(el => el.tagName) === 'SELECT') await field.selectOption(value); else await field.fill(value)
  }
  await page.getByRole('button', { name: 'Kirim jawaban' }).click()
}
async function sus(page: Page) {
  // Butir ganjil = 4, butir genap = 2 → skor 75. Setiap jawaban otomatis maju ke pernyataan berikutnya.
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.sus-count')).toHaveText(`Pernyataan ${i + 1} dari 10`)
    await page.locator('.agree button').nth(i % 2 ? 1 : 3).click()
  }
  await page.getByRole('button', { name: 'Selesai, lanjut' }).click()
  await page.getByRole('button', { name: 'Kirim hasil' }).click()
  await expect(page.locator('.status')).toBeVisible()
}
async function stored(page: Page) {
  return page.evaluate(() => { const key = Object.keys(localStorage).find(k => k.startsWith('uji_stunting_'))!; return JSON.parse(localStorage.getItem(key)!) })
}

test('Persona A: blinded charts, cross-filter task, comparison task, SUS and payload', async ({ page }) => {
  await page.goto('/uji/')
  await profile(page, 'A')
  await level3(page)
  const frame = await startTask(page)
  await frame.locator('[data-region="3329"]').click()
  await expect(frame.locator('#region')).toHaveValue('3329')
  await answer(page, { 'Wilayah dengan prevalensi tertinggi 2022': 'Kab. Brebes', 'Periode terjadinya lonjakan': '2019 → 2021' })
  await expect(page.locator('.sheet .msg')).toContainText('belum tepat')
  await page.locator('.sheet .fld', { hasText: 'Periode' }).locator('select').selectOption('2021 → 2022')
  await page.getByRole('button', { name: 'Kirim jawaban' }).click()
  await expect(page.locator('.mission-intro')).toContainText('Perbandingan Lintas Kelompok')
  await startTask(page)
  await answer(page, { 'Kelompok dengan rata-rata tertinggi': 'Kabupaten', 'Rata-rata prevalensi': '21,7', 'kenaikan prevalensi terbesar': 'Kab. Pati' })
  await sus(page)
  await expect(page.locator('.stat.green dd')).toHaveText('2/2')
  await expect(page.locator('.stat.purple dd')).toHaveText('75')
  const p = await stored(page)
  expect(p.id).toMatch(/^A-/)
  expect(p.profile).toMatchObject({ persona: 'A', literacy: 3 })
  expect(p.consent.at).toMatch(/^\d{4}-/)
  expect(p.l3).toHaveLength(3)
  expect(new Set(p.l3.map((a: { diagram: string }) => a.diagram))).toEqual(new Set(['D1', 'D2', 'D3']))
  expect(p.l4[0]).toMatchObject({ task: 'A1', success: true, wrongSubmits: 1, crossfilter: true })
  expect(p.l4[0].clicks).toBeGreaterThan(0)
  expect(p.l4[1]).toMatchObject({ task: 'A2', success: true, wrongSubmits: 0 })
  expect(p.susScore).toBe(75)
})

test('Persona B: fixed Temanggung task, answer accepted at any filter', async ({ page }) => {
  await page.goto('/uji/?persona=B')
  await profile(page, 'B')
  await level3(page)
  await expect(page.locator('.mission-intro')).toContainText('Bayangkan Anda tinggal di Kabupaten Temanggung')
  const frame = await startTask(page)
  await frame.locator('[data-region="3323"]').click()
  await expect(frame.locator('#region')).toHaveValue('3323')
  await answer(page, { 'Prevalensi Kab. Temanggung': '28,9', 'Kondisi 2021': 'Memburuk (prevalensi naik)' })
  const frame2 = await startTask(page)
  await frame2.locator('#year').selectOption('2021')
  await answer(page, { 'Kelompok dengan rata-rata terbesar': 'Kabupaten', 'Rata-rata prevalensi': '20,1' })
  await sus(page)
  const p = await stored(page)
  expect(p.l4[0]).toMatchObject({ task: 'B1', success: true, crossfilter: true })
  // Filter dibiarkan di 2021: jawaban tetap diterima.
  expect(p.l4[1]).toMatchObject({ task: 'B2', success: true, wrongSubmits: 0 })
  expect(p.l4[1].filterChanges).toBeGreaterThanOrEqual(1)
  await expect(page.locator('.status')).toContainText('Pengiriman otomatis belum diaktifkan')
})
