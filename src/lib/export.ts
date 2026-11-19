import Papa from 'papaparse'
import { CATEGORIES, category, k6Change, prevalenceRank, TARGET } from './calculations'
import { roundHalfAway } from './format'
import type { StuntingRow } from '../types'

// Export is data, not display: keep the source precision (2 decimals) and only
// strip floating point noise, so K5/K6 match the cleaned CSV exactly.
const clean = (value: number | null) => value === null ? null : roundHalfAway(value, 2)

export const EXPORT_COLUMNS = ['kode_wilayah', 'wilayah', 'nama_asli', 'tipe_wilayah', 'tahun', 'prevalensi', 'peringkat', 'kategori', 'k5_jarak_target', 'k6_perubahan_2019_2022'] as const

// Same ten columns as public/data/stunting.csv, limited to the visible year and scope.
// Rank and category are the source's own: rank is among all 35 regions of that year, not within the scope.
export function buildExportRows(visible: StuntingRow[], all: StuntingRow[]) {
  return visible.map(row => ({
    kode_wilayah: row.code, wilayah: row.name, nama_asli: row.sourceName, tipe_wilayah: row.type, tahun: row.year, prevalensi: row.prevalence,
    peringkat: prevalenceRank(all.filter(item => item.year === row.year), row.prevalence),
    kategori: CATEGORIES[category(row.prevalence)].label,
    k5_jarak_target: clean(row.prevalence - TARGET),
    k6_perubahan_2019_2022: clean(k6Change(all, row.code)),
  }))
}

export function exportCsv(visible: StuntingRow[], all: StuntingRow[]) {
  const csv = Papa.unparse(buildExportRows(visible, all), { columns: [...EXPORT_COLUMNS] })
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `stunting-jateng-${visible[0]?.year ?? 'data'}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
