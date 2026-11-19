import Papa from 'papaparse'
import { YEARS, type Boundaries, type Dataset, type StuntingRow } from '../types'

const REQUIRED = ['kode_wilayah', 'wilayah', 'tipe_wilayah', 'tahun', 'prevalensi']
export function parseCsv(text: string): StuntingRow[] {
  const result = Papa.parse<Record<string, string>>(text.replace(/\r\n?/g, '\n'), { header: true, delimiter: ',', skipEmptyLines: 'greedy', transformHeader: value => value.replace(/^\uFEFF/, '').trim() })
  if (result.errors.length) throw new Error(`CSV tidak valid: ${result.errors[0].message}`)
  if (REQUIRED.some(key => !result.meta.fields?.includes(key))) throw new Error('Kolom wajib CSV tidak lengkap.')
  const seen = new Set<string>()
  const rows = result.data.map((raw, index) => {
    const code = raw.kode_wilayah.trim()
    const year = Number(raw.tahun)
    const prevalenceText = raw.prevalensi.trim()
    const prevalence = Number(prevalenceText.replace(',', '.'))
    if (!YEARS.includes(year as StuntingRow['year'])) throw new Error(`Tahun tidak didukung pada baris ${index + 2}.`)
    if (!prevalenceText || !Number.isFinite(prevalence) || prevalence < 0 || prevalence > 100) throw new Error(`Prevalensi tidak valid pada baris ${index + 2}.`)
    if (!/^33\d{2}$/.test(code) || !raw.wilayah.trim()) throw new Error(`Identitas wilayah tidak valid pada baris ${index + 2}.`)
    if (raw.tipe_wilayah !== 'Kota' && raw.tipe_wilayah !== 'Kabupaten') throw new Error(`Tipe wilayah tidak valid pada baris ${index + 2}.`)
    const key = `${year}-${code}`
    if (seen.has(key)) throw new Error(`Duplikat tahun dan kode wilayah: ${key}.`)
    seen.add(key)
    return { code, name: raw.wilayah.trim(), sourceName: (raw.nama_asli ?? raw.wilayah).trim(), type: raw.tipe_wilayah, year, prevalence } as StuntingRow
  })
  const referenceCodes = rows.filter(row => row.year === 2019).map(row => row.code).sort().join(',')
  for (const year of YEARS) {
    const yearRows = rows.filter(row => row.year === year)
    if (yearRows.length !== 35) throw new Error(`Tahun ${year} harus memuat 35 wilayah; ditemukan ${yearRows.length}.`)
    if (yearRows.map(row => row.code).sort().join(',') !== referenceCodes) throw new Error(`Cakupan wilayah tahun ${year} tidak konsisten.`)
    for (const row of yearRows) {
      const base = rows.find(item => item.year === 2019 && item.code === row.code)
      if (base && (base.name !== row.name || base.type !== row.type)) throw new Error(`Identitas kode ${row.code} berubah antartahun.`)
    }
  }
  return rows
}
export function validateBoundaries(value: unknown, rows: StuntingRow[]): Boundaries {
  const geo = value as Boundaries
  if (geo?.type !== 'FeatureCollection' || !Array.isArray(geo.features) || geo.features.length !== 35) throw new Error('GeoJSON harus berisi 35 geometri kabupaten/kota.')
  const codes = new Set<string>()
  function coordinatesValid(coords: unknown): boolean {
    if (!Array.isArray(coords) || !coords.length) return false
    if (typeof coords[0] === 'number') return coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]) && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90
    return coords.every(coordinatesValid)
  }
  for (const feature of geo.features) {
    const code = String(feature.properties?.kode_wilayah)
    if (codes.has(code) || !rows.some(row => row.code === code)) throw new Error(`Kode geometri tidak cocok atau duplikat: ${code}.`)
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type) || !coordinatesValid(feature.geometry.coordinates)) throw new Error(`Geometri tidak valid: ${code}.`)
    codes.add(code)
    feature.properties.kode_wilayah = code
  }
  if (rows.some(row => !codes.has(row.code))) throw new Error('Ada wilayah CSV yang tidak memiliki geometri.')
  return geo
}
export function validateDataset(csv: string, geometry: unknown): Dataset {
  const rows = parseCsv(csv)
  return { rows, boundaries: validateBoundaries(geometry, rows) }
}
export async function loadDataset(signal?: AbortSignal): Promise<Dataset> {
  const base = import.meta.env.BASE_URL
  const [csv, geo] = await Promise.all([fetch(`${base}data/stunting.csv`, { signal }), fetch(`${base}data/jateng.geojson`, { signal })])
  if (!csv.ok || !geo.ok) throw new Error('Berkas CSV atau GeoJSON tidak dapat dimuat. Periksa folder public/data.')
  return validateDataset(await csv.text(), await geo.json())
}
