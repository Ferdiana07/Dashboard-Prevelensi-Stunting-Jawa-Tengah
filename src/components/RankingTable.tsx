import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { category, CATEGORIES, changeFrom2019, changeLabel, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import type { StuntingRow, Year } from '../types'

interface Props { rows: StuntingRow[]; all: StuntingRow[]; year: Year; selected: string | null; onSelect: (code: string) => void }
type Sort = 'prevalence' | 'target' | 'change'
export function RankingTable({ rows, all, year, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState<Sort>('prevalence')
  const [descending, setDescending] = useState(true)
  const ranked = useMemo(() => [...rows].sort((a, b) => b.prevalence - a.prevalence || a.code.localeCompare(b.code)), [rows])
  const filtered = ranked.filter(row => row.name.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')))
    .sort((a, b) => {
      const av = sort === 'change' ? changeFrom2019(all, a) ?? 0 : a.prevalence
      const bv = sort === 'change' ? changeFrom2019(all, b) ?? 0 : b.prevalence
      return (descending ? bv - av : av - bv) || a.code.localeCompare(b.code)
    })
  const visible = showAll ? filtered : filtered.slice(0, 5)
  function sortBy(key: Sort) {
    if (key === sort) setDescending(!descending)
    else { setSort(key); setDescending(true) }
  }
  function sortIcon(key: Sort) { return sort === key ? descending ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : <ArrowUpDown size={12} /> }
  return <section className="panel ranking-panel" aria-labelledby="ranking-title">
    <h2 id="ranking-title">Peringkat Wilayah <span>(Prevalensi Tertinggi, {year})</span></h2>
    <div className="table-toolbar"><div className="search-wrap"><Search size={15} aria-hidden="true" /><input aria-label="Cari wilayah" placeholder="Cari kabupaten / kota…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Tampilkan 5 besar' : `Lihat semua (${rows.length})`}</button></div>
    <div className={`table-scroll ${showAll ? 'expanded' : ''}`} tabIndex={0} aria-label="Tabel peringkat wilayah, dapat digulir">
      <table><thead><tr><th scope="col" className="rank-col">No.</th><th scope="col">Kabupaten/Kota</th><th scope="col" aria-sort={sort === 'prevalence' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('prevalence')}>Prevalensi {sortIcon('prevalence')}</button></th><th scope="col" aria-sort={sort === 'target' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('target')} title="Selisih prevalensi terhadap target 14%">Target {sortIcon('target')}</button></th><th scope="col" aria-sort={sort === 'change' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('change')} title={year === 2019 ? '2019 adalah tahun awal pembanding; belum ada periode perubahan' : `Prevalensi ${year} dikurangi prevalensi 2019`}>{changeLabel(year)} {sortIcon('change')}</button></th></tr></thead>
        <tbody>{visible.map(row => {
          const delta = changeFrom2019(all, row)
          const info = CATEGORIES[category(row.prevalence)]
          return <tr key={row.code} className={selected === row.code ? 'selected-row' : ''}>
            <td><span className="rank-badge">{ranked.findIndex(item => item.code === row.code) + 1}</span></td><th scope="row"><button className="area-name" onClick={() => onSelect(row.code)} aria-pressed={selected === row.code}>{row.name}</button></th><td><span className="prevalence-badge" style={{ background: info.soft, color: info.text }}>{percent(row.prevalence)}</span></td><td>{signed(row.prevalence - TARGET)}</td><td title={delta === null ? '2019 adalah tahun awal pembanding, bukan data prevalensi yang hilang' : undefined} className={delta === null ? 'muted' : delta > 0 ? 'change-up' : 'change-down'}>{signed(delta)}</td>
          </tr>
        })}</tbody>
      </table>{!visible.length && <div className="empty-state">Tidak ada wilayah yang cocok dengan “{query}”. <button className="text-button" onClick={() => setQuery('')}>Hapus pencarian</button></div>}
    </div>
    <p className="table-note">Target: selisih dari 14% · {year === 2019 ? '2019 adalah tahun awal pembanding; perubahan belum dapat dibandingkan.' : `${changeLabel(year)}: nilai ${year} − nilai 2019`}<br />pp = poin persentase · Peringkat berdasarkan cakupan filter</p>
  </section>
}
