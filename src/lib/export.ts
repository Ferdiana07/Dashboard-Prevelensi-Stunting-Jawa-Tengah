import Papa from 'papaparse'
import { k6Change, previousChange, TARGET } from './calculations'
import { roundHalfAway } from './format'
import type { StuntingRow } from '../types'

// Export is data, not display: keep the source precision (2 decimals) and only
// strip floating point noise, so K5/K6 match the cleaned CSV exactly.
const clean = (value: number | null) => value === null ? null : roundHalfAway(value, 2)

export function buildExportRows(visible: StuntingRow[], all: StuntingRow[]) {
  return visible.map(row => ({ kode_wilayah: row.code, wilayah: row.name, tipe_wilayah: row.type, tahun: row.year, prevalensi: row.prevalence,
    k5_jarak_target_pp: clean(row.prevalence - TARGET),
    k6_perubahan_2019_2022_pp: clean(k6Change(all, row.code)),
    tahun_pembanding_sebelumnya: previousChange(all, row).year,
    perubahan_tahun_sebelumnya_pp: clean(previousChange(all, row).delta),
  }))
}

export function exportCsv(visible: StuntingRow[], all: StuntingRow[]) {
  const csv = Papa.unparse(buildExportRows(visible, all))
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `stunting-jateng-${visible[0]?.year ?? 'data'}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
