import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { category, CATEGORIES, k6Entries, k6Change, K6_NOTE, k6SummaryText, prevalenceRank, rankingTitle, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import type { Scope, StuntingRow, Year } from '../types'

interface Props { rows: StuntingRow[]; all: StuntingRow[]; year: Year; scope: Scope; selected: string | null; onSelect: (code: string) => void }
type Sort = 'prevalence' | 'target' | 'change'
export const DEFAULT_ROWS = 5
export function RankingTable({ rows, all, year, scope, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState<Sort>('prevalence')
  const [descending, setDescending] = useState(true)
  // K6 is fixed to 2019→2022, so the summary follows the scope only, never the selected year.
  const k6 = useMemo(() => k6Entries(all, scope), [all, scope])
  const ranked = useMemo(() => [...rows].sort((a, b) => b.prevalence - a.prevalence || a.code.localeCompare(b.code)), [rows])
  const filtered = ranked.filter(row => row.name.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')))
    .sort((a, b) => {
      const av = sort === 'change' ? k6Change(all, a.code) ?? 0 : a.prevalence
      const bv = sort === 'change' ? k6Change(all, b.code) ?? 0 : b.prevalence
      return (descending ? bv - av : av - bv) || a.code.localeCompare(b.code)
    })
  const base = showAll ? filtered : filtered.slice(0, DEFAULT_ROWS)
  // Interaksi di peta/dropdown tidak mengubah isi tabel: wilayah terpilih disorot. Bila di luar 5 besar, wilayah itu
  // ditampilkan tepat di bawah baris ke-5 dengan nomor peringkat aslinya (kecuali pencarian sengaja menyembunyikannya).
  const selectedRow = selected && !query ? ranked.find(row => row.code === selected) : undefined
  const visible = selectedRow && !base.some(row => row.code === selectedRow.code) ? [...base, selectedRow] : base
  const appended = selectedRow && visible.length > base.length ? selectedRow.code : null
  const scroller = useRef<HTMLDivElement>(null)
  // Saat semua wilayah tampil (atau tabel bergulir di dalam panel), gulir tabel saja ke baris terpilih; halaman tidak ikut bergulir.
  useEffect(() => {
    const box = scroller.current
    const row = box?.querySelector<HTMLElement>('tr.selected-row')
    if (!box || !row || box.scrollHeight <= box.clientHeight) return
    const head = box.querySelector('thead')?.getBoundingClientRect().height ?? 0
    const offset = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    const top = Math.max(0, offset - head - (box.clientHeight - head - row.offsetHeight) / 2)
    box.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [selected, showAll, sort, descending])
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
    <h2 id="ranking-title">Peringkat Wilayah <span>({rankingTitle(sort, descending, year)})</span></h2>
    <div className="table-toolbar"><div className="search-wrap"><Search size={15} aria-hidden="true" /><input aria-label="Cari wilayah" placeholder="Cari kabupaten / kota…" value={query} onChange={e => setQuery(e.target.value)} /></div>{rows.length > DEFAULT_ROWS && <button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? `Tampilkan ${DEFAULT_ROWS} besar` : `Lihat semua (${rows.length})`}</button>}</div>
    <div ref={scroller} className={`table-scroll ${showAll ? 'expanded' : ''}`} tabIndex={0} aria-label="Tabel peringkat wilayah, dapat digulir">
      <table><thead><tr><th scope="col" className="rank-col">Peringkat prevalensi</th><th scope="col">Kabupaten/Kota</th><th scope="col" aria-sort={sort === 'prevalence' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('prevalence')}>Prevalensi {sortIcon('prevalence')}</button></th><th scope="col" aria-sort={sort === 'target' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('target')} title="Selisih prevalensi terhadap target 14%">Target {sortIcon('target')}</button></th><th scope="col" aria-sort={sort === 'change' ? descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortBy('change')} title="Prevalensi 2022 dikurangi prevalensi 2019, tidak bergantung pada tahun yang dipilih"><span className="th-line">Perubahan</span> <span className="th-line">2019→2022</span> {sortIcon('change')}</button></th></tr></thead>
        <tbody>{visible.map(row => {
          const delta = k6Change(all, row.code)
          const info = CATEGORIES[category(row.prevalence)]
          return <tr key={row.code} className={`${selected === row.code ? 'selected-row' : ''} ${appended === row.code ? 'appended-row' : ''}`.trim()}>
            <td><span className="rank-badge">{prevalenceRank(rows, row.prevalence)}</span></td><th scope="row"><button className="area-name" onClick={() => onSelect(row.code)} aria-pressed={selected === row.code}>{row.name}</button></th><td><span className="prevalence-badge" style={{ background: info.soft, color: info.text }}>{percent(row.prevalence)}</span></td><td>{signed(row.prevalence - TARGET)}</td><td className={delta === null || Math.abs(delta) < 0.005 ? 'muted' : delta > 0 ? 'change-up' : 'change-down'}>{signed(delta)}</td>
          </tr>
        })}</tbody>
      </table>{!filtered.length && <div className="empty-state">Tidak ada wilayah yang cocok dengan “{query}”. <button className="text-button" onClick={() => setQuery('')}>Hapus pencarian</button></div>}
    </div>
    <p className="k6-summary">{k6SummaryText(k6, scope)} <a href="#k6-title">Lihat grafik perubahan ↓</a></p>
    <p className="table-note">Target: selisih dari 14% · pp = poin persentase · Peringkat berdasarkan cakupan filter<br />{K6_NOTE}</p>
  </section>
}
