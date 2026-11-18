import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { test, expect } from '@playwright/test'

// Independent audit reference: read the attachment copy directly, without using
// the application's parsing, calculation, formatting, or ranking functions.
interface RawRow {
  kode_wilayah: string; wilayah: string; tipe_wilayah: string; tahun: string
  prevalensi: string; peringkat: string; kategori: string
  k5_jarak_target: string; k6_perubahan_2019_2022: string
}
const source = Papa.parse<RawRow>(readFileSync('public/data/stunting.csv', 'utf8'), { header: true, skipEmptyLines: true }).data
const display = (value: number) => value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const pct = (value: number) => `${display(value)}%`
const chartPct = (value: number) => {
  const rounded = Number(value.toFixed(1))
  const band = (number: number) => number <= 14 ? 0 : number < 20 ? 1 : 2
  return band(rounded) === band(value) ? pct(value) : `${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
const delta = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${display(value)} pp`
const units = (value: string) => Math.round(Number(value) * 100)
const difference = (end: string, start: string) => (units(end) - units(start)) / 100
const average = (rows: RawRow[]) => rows.length ? rows.reduce((sum, row) => sum + units(row.prevalensi), 0) / rows.length / 100 : null
const selected = (year: number, scope: string) => source.filter(row => Number(row.tahun) === year && (scope === 'all' || row.tipe_wilayah === scope || row.kode_wilayah === scope))
const color = (row: RawRow) => Number(row.prevalensi) <= 14 ? '#08a33e' : Number(row.prevalensi) < 20 ? '#ffd000' : '#ed2429'

for (const year of [2019, 2021, 2022]) {
  test(`audit all displayed data for ${year}, across all 38 region scopes`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/')
    await page.locator('.scorecard').first().waitFor()
    await page.locator('#year').selectOption(String(year))
    const scopes = ['all', 'Kabupaten', 'Kota', ...selected(year, 'all').map(row => row.kode_wilayah)]
    for (const scope of scopes) {
      await page.locator('#region').selectOption(scope)
      const rows = selected(year, scope)
      const cities = average(rows.filter(row => row.tipe_wilayah === 'Kota'))
      const districts = average(rows.filter(row => row.tipe_wilayah === 'Kabupaten'))
      const achieved = rows.filter(row => Number(row.prevalensi) <= 14).length
      await expect(page.locator('.score-value'), `${year}/${scope}: scorecards`).toHaveText([
        pct(average(rows)!), `${rows.length - achieved} dari ${rows.length}`,
        cities === null || districts === null ? 'Tidak berlaku' : `${display(districts - cities)} pp`,
        pct(achieved / rows.length * 100),
      ])
      const allButton = page.getByRole('button', { name: `Lihat semua (${rows.length})`, exact: true })
      if (await allButton.count()) await allButton.click()
      const actual = await page.evaluate(() => ({
        paths: Array.from(document.querySelectorAll('[data-region]')).map(el => [el.getAttribute('data-region'), el.getAttribute('fill')]),
        legend: Array.from(document.querySelectorAll('.map-legend > div')).map(el => el.textContent),
        table: Array.from(document.querySelectorAll('tbody tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent?.trim())),
        bars: document.querySelector('.bar-chart')?.textContent ?? '',
        barColors: Array.from(document.querySelectorAll('.recharts-bar-rectangle path')).map(el => el.getAttribute('fill')),
      }))
      expect(actual.paths, `${year}/${scope}: all 35 map colors`).toEqual(selected(year, 'all').map(row => [row.kode_wilayah, rows.includes(row) ? color(row) : '#e2e5e9']))
      const counts = [achieved, rows.filter(row => Number(row.prevalensi) > 14 && Number(row.prevalensi) < 20).length, rows.filter(row => Number(row.prevalensi) >= 20).length]
      actual.legend.forEach((label, index) => expect(label, `${year}/${scope}: legend`).toContain(`(${counts[index]} wilayah)`))
      if (cities !== null) expect(actual.bars).toContain(chartPct(cities))
      if (districts !== null) expect(actual.bars).toContain(chartPct(districts))
      const expectedBars = [cities, districts].filter((value): value is number => value !== null).map(value => value <= 14 ? '#08a33e' : value < 20 ? '#ffd000' : '#ed2429')
      expect(actual.barColors, `${year}/${scope}: bar category colors`).toEqual(expectedBars)
      const sorted = [...rows].sort((a, b) => Number(b.prevalensi) - Number(a.prevalensi) || a.kode_wilayah.localeCompare(b.kode_wilayah))
      const expected = sorted.map(row => [
        String(scope === 'all' ? Number(row.peringkat) : 1 + rows.filter(other => Number(other.prevalensi) > Number(row.prevalensi)).length),
        row.wilayah, pct(Number(row.prevalensi)), delta(Number(row.k5_jarak_target)),
        year === 2019 ? '—' : delta(difference(row.prevalensi, source.find(item => item.kode_wilayah === row.kode_wilayah && item.tahun === '2019')!.prevalensi)),
      ])
      expect(actual.table, `${year}/${scope}: names, source ranks, prevalence, target and changes`).toEqual(expected)
      if (rows.length === 1) {
        const row = rows[0]
        const baseline = source.find(item => item.kode_wilayah === row.kode_wilayah && item.tahun === '2019')!
        const previous = year === 2019 ? null : source.find(item => item.kode_wilayah === row.kode_wilayah && Number(item.tahun) === (year === 2021 ? 2019 : 2021))!
        const change = year === 2019 ? null : difference(row.prevalensi, baseline.prevalensi)
        const previousChange = previous ? difference(row.prevalensi, previous.prevalensi) : null
        await expect(page.locator('.detail-values strong')).toHaveText([pct(Number(row.prevalensi)), delta(Number(row.k5_jarak_target)), delta(change), delta(previousChange)])
        await expect(page.locator('.detail-history > span > strong')).toHaveText([2019, 2021, 2022].map(t => pct(Number(source.find(item => item.kode_wilayah === row.kode_wilayah && Number(item.tahun) === t)!.prevalensi))))
        await page.locator(`[data-region="${row.kode_wilayah}"]`).focus()
        await expect(page.getByRole('tooltip')).toContainText(row.wilayah)
        await expect(page.getByRole('tooltip').locator('dd')).toHaveText([Number(row.prevalensi) <= 14 ? 'Tercapai' : 'Belum tercapai', delta(Number(row.k5_jarak_target)), delta(previousChange), delta(change)])
      }
    }
  })
}

test('selecting a map area after searching reveals that selected area in the table', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Cari wilayah').fill('Semarang')
  await page.locator('[data-region="3329"]').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.selected-row')).toContainText('Kab. Brebes')
  await expect(page.getByLabel('Cari wilayah')).toHaveValue('')
  await page.locator('#region').selectOption('3326')
  await expect(page.locator('.trend-notes')).toContainText('Tidak ada perubahan')
  await expect(page.locator('.trend-notes')).toContainText('0,0 pp')
})

test('audit exported values for all 105 source observations', async ({ page }) => {
  await page.goto('/')
  await page.locator('.scorecard').first().waitFor()
  for (const year of [2019, 2021, 2022]) {
    await page.locator('#year').selectOption(String(year))
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Ekspor CSV cakupan' }).click()
    const download = await pending
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
    const exported = Papa.parse<Record<string, string>>(Buffer.concat(chunks).toString('utf8'), { header: true, skipEmptyLines: true }).data
    expect(exported).toHaveLength(35)
    for (const row of selected(year, 'all')) {
      const actual = exported.find(item => item.kode_wilayah === row.kode_wilayah)!
      expect(actual.wilayah).toBe(row.wilayah)
      expect(Number(actual.prevalensi)).toBe(Number(row.prevalensi))
      expect(Number(actual.k5_jarak_target_pp)).toBeCloseTo(Number(row.k5_jarak_target), 10)
      const field = year === 2022 ? 'k6_perubahan_2019_2022_pp' : 'perubahan_dari_2019_pp'
      if (year === 2019) expect(actual[field]).toBe('')
      else expect(Number(actual[field])).toBeCloseTo(Number(row.prevalensi) - Number(source.find(item => item.kode_wilayah === row.kode_wilayah && item.tahun === '2019')!.prevalensi), 10)
    }
  }
})

test('audit every individual trend point against the source, plus average and group trends', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.locator('.scorecard').first().waitFor()
  const panel = page.locator('.trend-panel')
  await page.getByRole('button', { name: 'Satu wilayah', exact: true }).click()
  for (const row of selected(2019, 'all')) {
    await page.getByLabel('Wilayah tren').selectOption(row.kode_wilayah)
    const dots = panel.locator('.recharts-line-dot')
    await expect(dots).toHaveCount(3)
    for (const [index, year] of [2019, 2021, 2022].entries()) {
      await dots.nth(index).hover({ force: true })
      const tooltip = panel.locator('.recharts-tooltip-wrapper')
      await expect(tooltip).toContainText(`Tahun ${year}`)
      await expect(tooltip).toContainText(chartPct(Number(source.find(item => item.kode_wilayah === row.kode_wilayah && Number(item.tahun) === year)!.prevalensi)))
    }
  }
  await page.getByRole('button', { name: 'Rata-rata', exact: true }).click()
  for (const scope of ['all', 'Kota', 'Kabupaten']) {
    await page.locator('#region').selectOption(scope)
    for (const [index, year] of [2019, 2021, 2022].entries()) {
      await panel.locator('.recharts-line-dot').nth(index).hover({ force: true })
      await expect(panel.locator('.recharts-tooltip-wrapper')).toContainText(chartPct(average(selected(year, scope))!))
    }
  }
  await page.getByRole('button', { name: 'Kota vs Kab.', exact: true }).click()
  await expect(panel.locator('.recharts-line-dot')).toHaveCount(6)
  for (const [index, year] of [2019, 2021, 2022].entries()) {
    await panel.locator('.recharts-line-dot').nth(index).hover({ force: true })
    const tooltip = panel.locator('.recharts-tooltip-wrapper')
    await expect(tooltip).toContainText(chartPct(average(selected(year, 'Kota'))!))
    await expect(tooltip).toContainText(chartPct(average(selected(year, 'Kabupaten'))!))
  }
  await page.getByRole('button', { name: 'Multiwilayah', exact: true }).click()
  const choices = panel.locator('.multi-select input')
  await choices.nth(2).check()
  await expect(panel.locator('.recharts-line-dot')).toHaveCount(9)
  for (const [index, year] of [2019, 2021, 2022].entries()) {
    await panel.locator('.recharts-line-dot').nth(index).hover({ force: true })
    for (const row of selected(2019, 'all').slice(0, 3)) {
      await expect(panel.locator('.recharts-tooltip-wrapper')).toContainText(chartPct(Number(source.find(item => item.kode_wilayah === row.kode_wilayah && Number(item.tahun) === year)!.prevalensi)))
    }
  }
})
