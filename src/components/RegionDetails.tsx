import { X } from 'lucide-react'
import { CATEGORIES, category, K6_LABEL, k6Change, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import { YEARS, type StuntingRow } from '../types'

export function RegionDetails({ row, all, scopeLabel, onClear }: { row: StuntingRow; all: StuntingRow[]; scopeLabel: string | null; onClear: () => void }) {
  const info = CATEGORIES[category(row.prevalence)]
  return <section className="panel detail-panel" aria-labelledby="details-title">
    <div className="detail-heading"><div><h2 id="details-title" tabIndex={-1}>{row.name}</h2><p>Kode {row.code} · {row.type} · <span style={{ color: info.text }}>{info.label}</span></p>{scopeLabel && <p className="scope-note">Di luar cakupan filter saat ini ({scopeLabel}); panel lain tidak memuat wilayah ini.</p>}</div><button className="icon-button" aria-label="Tutup detail wilayah" onClick={onClear}><X size={19} /></button></div>
    <div className="detail-values"><div><span>Prevalensi {row.year}</span><strong>{percent(row.prevalence)}</strong><small>{row.prevalence <= TARGET ? 'Target historis tercapai' : 'Target historis belum tercapai'}</small></div><div><span>Jarak ke target 14%</span><strong>{signed(row.prevalence - TARGET)}</strong><small>Nilai negatif berarti di bawah target</small></div><div><span>{K6_LABEL}</span><strong>{signed(k6Change(all, row.code))}</strong><small>Prevalensi 2022 − prevalensi 2019</small></div></div>
    <div className="detail-history">{YEARS.map(year => <span key={year}><span>{year}</span><strong>{percent(all.find(item => item.code === row.code && item.year === year)!.prevalence)}</strong></span>)}<small>2020: data tidak tersedia</small></div>
  </section>
}
