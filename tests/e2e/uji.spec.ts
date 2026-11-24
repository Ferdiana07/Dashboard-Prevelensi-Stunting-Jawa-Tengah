import { test, expect, type Page } from '@playwright/test'

const ROLE = {
  A: 'Anda berperan sebagai staf teknis Dinas Kesehatan yang memakai dashboard ini untuk pemantauan rutin dan pengambilan keputusan taktis.',
  B: 'Anda berperan sebagai warga yang membuka dashboard ini untuk mencari informasi sendiri tentang kondisi daerah.',
}

// Teks form yang terlihat responden (di luar iframe dashboard) tidak boleh memuat "K6".
async function noK6(page: Page) {
  await expect(page.locator('body')).not.toContainText('K6')
}
async function profile(page: Page, persona: 'A' | 'B', preset: boolean) {
  await page.getByRole('button', { name: 'Mulai uji' }).click()
  // Persona adalah peran: terkunci bila datang dari tautan penguji, selain itu dipilih sesuai arahan penguji.
  await expect(page.locator('fieldset legend').first()).toHaveText(preset ? 'Peran Anda' : 'Pilih peran sesuai arahan penguji')
  await expect(page.locator(`.persona-${persona}`)).toContainText(ROLE[persona])
  await noK6(page)
  await page.getByLabel('Nama lengkap').fill(`Responden Uji ${persona}`)
  await page.getByLabel('Usia').selectOption('20–29')
  if (!preset) await page.locator(`.persona-${persona}`).click()
  await page.locator('.scale label').nth(2).click()
  await page.getByRole('button', { name: 'Lanjut' }).click()
  // Persetujuan: tombol menolak tanpa centang, dan peran disebut sebagai peran.
  const title = persona === 'A' ? 'Operator Internal' : 'Warga Publik'
  await expect(page.locator('.consent-letter')).toContainText(`responden dengan peran ${title} (Persona ${persona})`)
  await page.getByRole('button', { name: /Saya bersedia/ }).click()
  await expect(page.locator('.msg')).toContainText('Centang semua')
  for (const box of await page.locator('.checks input').all()) await box.check()
  await page.getByRole('button', { name: /Saya bersedia/ }).click()
}
async function level3(page: Page, persona: 'A' | 'B') {
  // Pengantar: kartu peran dan daftar opsi lengkap, tanpa diagram.
  await expect(page.locator('.role-card')).toContainText(ROLE[persona])
  await expect(page.locator('.option-preview')).toContainText('sama untuk ketiga diagram')
  await expect(page.getByAltText('Diagram uji tanpa judul')).toHaveCount(0)
  await noK6(page)
  const kpiIntro = await page.locator('.option-preview .choice').nth(0).locator('li b').allTextContents()
  const cbqIntro = await page.locator('.option-preview .choice').nth(1).locator('li b').allTextContents()
  expect(kpiIntro).toHaveLength(3)
  expect(cbqIntro).toHaveLength(3)
  await page.getByRole('button', { name: 'Saya siap' }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Tampilkan diagram' }).click()
    await expect(page.getByAltText('Diagram uji tanpa judul')).toBeVisible()
    await expect(page.locator('.stimulus')).not.toContainText(/Peta Prevalensi|Rata-rata Prevalensi: Kota/)
    // Urutan opsi diacak sekali per responden: sama dengan pengantar di ketiga diagram.
    expect(await page.locator('fieldset').nth(0).locator('label b').allTextContents()).toEqual(kpiIntro)
    expect(await page.locator('fieldset').nth(1).locator('label b').allTextContents()).toEqual(cbqIntro)
    await expect(page.getByRole('button', { name: 'Kunci jawaban' })).toBeDisabled()
    await page.locator('fieldset').nth(0).locator('label').first().click()
    await page.locator('fieldset').nth(1).locator('label').first().click()
    await page.getByRole('button', { name: 'Kunci jawaban' }).click()
    await page.locator('.confidence button').nth(3).click()
  }
  await expect(page.locator('.role-card')).toContainText(ROLE[persona])
  await noK6(page)
  await page.getByRole('button', { name: /misi pertama/ }).click()
}
async function startTask(page: Page) {
  await noK6(page)
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
const B2_ANSWER = { 'Kelompok dengan rata-rata terbesar': 'Kabupaten', 'Rata-rata prevalensi': '20,1' }

test('Persona A: role chosen on the profile, blinded charts, cross-filter task, comparison task, SUS and payload', async ({ page }) => {
  await page.goto('/uji/')
  await profile(page, 'A', false)
  await level3(page, 'A')
  const frame = await startTask(page)
  await frame.locator('[data-region="3329"]').click()
  await expect(frame.locator('#region')).toHaveValue('3329')
  await answer(page, { 'Wilayah dengan prevalensi tertinggi 2022': 'Kab. Brebes', 'Periode terjadinya lonjakan': '2019 → 2021' })
  await expect(page.locator('.sheet .msg')).toContainText('belum tepat')
  await page.locator('.sheet .fld', { hasText: 'Periode' }).locator('select').selectOption('2021 → 2022')
  await page.getByRole('button', { name: 'Kirim jawaban' }).click()
  await expect(page.locator('.mission-intro')).toContainText('Perbandingan Lintas Kelompok')
  await expect(page.locator('.mission-intro')).toContainText('kolom “Perubahan 2019→2022” pada tabel “Peringkat Wilayah”')
  await startTask(page)
  await noK6(page)
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

test('Persona B: locked role, Temanggung task, B2 accepted with the year still at 2021', async ({ page }) => {
  await page.goto('/uji/?persona=B')
  await profile(page, 'B', true)
  await level3(page, 'B')
  await expect(page.locator('.mission-intro')).toContainText('Bayangkan Anda tinggal di Kabupaten Temanggung')
  const frame = await startTask(page)
  await frame.locator('[data-region="3323"]').click()
  await expect(frame.locator('#region')).toHaveValue('3323')
  await answer(page, { 'Prevalensi Kab. Temanggung': '28,9', 'Kondisi 2021': 'Memburuk (prevalensi naik)' })
  await expect(page.locator('.mission-intro')).toContainText('Ubah filter Tahun menjadi 2021')
  await expect(page.locator('.mission-intro')).not.toContainText(/posisi awal|reset/i)
  const frame2 = await startTask(page)
  await frame2.locator('#year').selectOption('2021')
  // Jawaban benar langsung diterima walau dashboard masih di tahun 2021: tidak perlu reset.
  await answer(page, B2_ANSWER)
  await sus(page)
  await expect(page.locator('.stat.green dd')).toHaveText('2/2')
  await expect(page.locator('textarea.out')).toContainText('[L4];B2;sukses 1')
  await expect(page.locator('textarea.out')).not.toContainText('reset')
  const p = await stored(page)
  expect(p.l4[0]).toMatchObject({ task: 'B1', success: true, crossfilter: true })
  expect(p.l4[1]).toMatchObject({ task: 'B2', success: true, wrongSubmits: 0, crossfilter: null })
  expect(p.l4[1]).not.toHaveProperty('reset')
  expect(p.l4[1].filterChanges).toBeGreaterThanOrEqual(1)
  await expect(page.locator('.status')).toContainText('Pengiriman otomatis belum diaktifkan')
})
