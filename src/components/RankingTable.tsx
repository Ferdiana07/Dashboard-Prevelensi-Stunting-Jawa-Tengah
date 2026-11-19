import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { category, CATEGORIES, K6_LABEL, k6Change, K6_NOTE, prevalenceRank, TARGET } from '../lib/calculations'
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
      const av = sort === 'change' ? k6Change(all, a.code) ?? 0 : a.prevalence
      const bv = sort === 'change' ? k6Change(all, b.code) ?? 0 : b.prevalence
      return (descending ? bv - av : av - bv) || a.code.localeCompare(b.code)
    })
  const base = showAll ? filtered : filtered.slice(0, 5)
  // A selected region stays in the table even when it falls outside the default list (unless a search hides it on purpose).
  const selectedRow = selected && !query ? ranked.find(row => row.code === selected) : undefined
  const visible = selectedRow && !base.some(row => row.code === selectedRow.code) ? [...base, selectedRow] : base
  const [seenSelection, setSeenSelection] = useState(selected)
  if (selected !== seenSelection) {
    setSeenSelection(selected)
    // Picking a region from the map or dropdown clears a search that would hide it.
    const picked = rows.find(row => row.code === selected)
    if (picked && !picked.name.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID'))) setQuery('')
  }
  function sortBy(key: Sort) {
    if (key === sort) setDescending(!descending)
    else { setSort(key); setDescending(true) }
  }
  function sortIcon(key: Sort) { return sort === key ? descending ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : <ArrowUpDown size={12} /> }
  return <section className="panel ranking-panel" aria-labelledby="ranking-title">
    <h2 id="ranking-title">Peringkat Wilayah <span>(Prevalensi Tertinggi, {year})</span></h2>
    <div className="table-toolbar"><div className="search-wrap"><Search size={15} aria-hidden="true" /><input aria-label="Cari wilayah" placeholder="Cari kabupaten / kota…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Tampilkan 5 besar' : `Lihat semua (${rows.length})`}</button></div>
    <div className={`table-scroll ${showAll ? 'expanded' : ''}`} tabIndex={0} aria-label="Tabel peringkat wilayah, dapat digulir">
      <table><thead><tr><th scope="col" className="rank-col">No.</th><th scope="col">Kabupaten/Kota</th><th scope="col" aria-sort={sort === 'prevalence' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('prevalence')}>Prevalensi {sortIcon('prevalence')}</button></th><th scope="col" aria-sort={sort === 'target' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('target')} title="Selisih prevalensi terhadap target 14%">Target {sortIcon('target')}</button></th><th scope="col" aria-sort={sort === 'change' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('change')} title="Prevalensi 2022 dikurangi prevalensi 2019, tidak bergantung pada tahun yang dipilih">{K6_LABEL} {sortIcon('change')}</button></th></tr></thead>
        <tbody>{visible.map(row => {
          const delta = k6Change(all, row.code)
          const info = CATEGORIES[category(row.prevalence)]
          return <tr key={row.code} className={selected === row.code ? 'selected-row' : ''}>
            <td><span className="rank-badge">{prevalenceRank(rows, row.prevalence)}</span></td><th scope="row"><button className="area-name" onClick={() => onSelect(row.code)} aria-pressed={selected === row.code}>{row.name}</button></th><td><span className="prevalence-badge" style={{ background: info.soft, color: info.text }}>{percent(row.prevalence)}</span></td><td>{signed(row.prevalence - TARGET)}</td><td className={delta === null || Math.abs(delta) < 0.005 ? 'muted' : delta > 0 ? 'change-up' : 'change-down'}>{signed(delta)}</td>
          </tr>
        })}</tbody>
      </table>{!filtered.length && <div className="empty-state">Tidak ada wilayah yang cocok dengan “{query}”. <button className="text-button" onClick={() => setQuery('')}>Hapus pencarian</button></div>}
    </div>
    <p className="table-note">Target: selisih dari 14% · {K6_NOTE}<br />pp = poin persentase · Peringkat berdasarkan cakupan filter</p>
  </section>
}
