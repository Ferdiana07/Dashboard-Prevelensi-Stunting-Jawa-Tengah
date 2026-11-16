import Papa from 'papaparse'
import { changeFrom2019, previousChange, TARGET } from './calculations'
import type { StuntingRow } from '../types'

export function exportCsv(visible: StuntingRow[], all: StuntingRow[]) {
  const csv = Papa.unparse(visible.map(row => ({ kode_wilayah: row.code, wilayah: row.name, tipe_wilayah: row.type, tahun: row.year, prevalensi: row.prevalence,
    k5_jarak_target_pp: row.prevalence - TARGET,
    [row.year === 2022 ? 'k6_perubahan_2019_2022_pp' : 'perubahan_dari_2019_pp']: changeFrom2019(all, row),
    tahun_pembanding_sebelumnya: previousChange(all, row).year,
    perubahan_tahun_sebelumnya_pp: previousChange(all, row).delta,
  })))
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `stunting-jateng-${visible[0]?.year ?? 'data'}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
