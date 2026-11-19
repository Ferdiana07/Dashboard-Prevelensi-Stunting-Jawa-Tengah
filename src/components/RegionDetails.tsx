import { X } from 'lucide-react'
import { CATEGORIES, category, K6_LABEL, k6Change, previousChange, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import { YEARS, type StuntingRow } from '../types'

export function RegionDetails({ row, all, onClear }: { row: StuntingRow; all: StuntingRow[]; onClear: () => void }) {
  const info = CATEGORIES[category(row.prevalence)]
  const previous = previousChange(all, row)
  return <section className="panel detail-panel" aria-labelledby="details-title">
    <div className="detail-heading"><div><h2 id="details-title">{row.name}</h2><p>Kode {row.code} · {row.type} · <span style={{ color: info.text }}>{info.label}</span></p></div><button className="icon-button" aria-label="Tutup detail dan tampilkan semua wilayah" onClick={onClear}><X size={19} /></button></div>
    <div className="detail-values"><div><span>Prevalensi {row.year}</span><strong>{percent(row.prevalence)}</strong><small>{row.prevalence <= TARGET ? 'Target historis tercapai' : 'Target historis belum tercapai'}</small></div><div><span>Jarak ke target 14%</span><strong>{signed(row.prevalence - TARGET)}</strong><small>Nilai negatif berarti di bawah target</small></div><div><span>{K6_LABEL}</span><strong>{signed(k6Change(all, row.code))}</strong><small>Prevalensi 2022 − prevalensi 2019</small></div><div><span>Δ dari {previous.year ?? 'tahun sebelumnya'}</span><strong>{signed(previous.delta)}</strong><small>{previous.year === null ? 'Belum ada data tahun sebelumnya' : `Tahun sebelumnya yang tersedia: ${previous.year}`}</small></div></div>
    <div className="detail-history">{YEARS.map(year => <span key={year}><span>{year}</span><strong>{percent(all.find(item => item.code === row.code && item.year === year)!.prevalence)}</strong></span>)}<small>2020: data tidak tersedia</small></div>
  </section>
}
