import { metrics } from '../lib/calculations'
import { number, percent } from '../lib/format'
import type { StuntingRow } from '../types'

export function Scorecards({ rows }: { rows: StuntingRow[] }) {
  const kpi = metrics(rows)
  const items = [
    { className: 'blue', title: 'Rata-rata prevalensi', value: kpi.average === null ? '—' : percent(kpi.average), note: `rata-rata ${kpi.total} wilayah` },
    { className: 'orange', title: 'Wilayah di atas 14%', value: `${kpi.above} dari ${kpi.total}`, note: `${number(kpi.total ? kpi.above / kpi.total * 100 : 0)}% wilayah` },
    { className: 'purple', title: 'Selisih kab–kota', value: kpi.gap === null ? 'Tidak berlaku' : `${number(kpi.gap)} pp`, note: kpi.gap === null ? 'Perlu kedua tipe wilayah dalam cakupan' : `kabupaten ${percent(kpi.district!)} vs kota ${percent(kpi.city!)}` },
    { className: 'green', title: '% capai target (≤ 14%)', value: kpi.achievement === null ? '—' : percent(kpi.achievement), note: `${kpi.achieved < kpi.total ? 'baru ' : ''}${kpi.achieved} dari ${kpi.total} wilayah` },
  ]
  return <section className="scorecards" aria-label="Indikator utama" aria-live="polite">
    {items.map(item => <article key={item.className} className={`scorecard ${item.className}`}>
      <h2>{item.title}</h2><p className={`score-value ${item.value === 'Tidak berlaku' ? 'unavailable' : ''}`}>{item.value}</p><p className="score-note">{item.note}</p>
    </article>)}
  </section>
}
