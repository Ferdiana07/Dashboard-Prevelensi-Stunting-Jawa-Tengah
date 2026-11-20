import { useEffect, useState } from 'react'
import { Download, Info, LoaderCircle } from 'lucide-react'
import { useDataset } from './hooks/useDataset'
import { filterRows } from './lib/calculations'
import { exportCsv } from './lib/export'
import { Filters } from './components/Filters'
import { Scorecards } from './components/Scorecards'
import { MapPanel } from './components/MapPanel'
import { ComparisonChart } from './components/ComparisonChart'
import { RankingTable } from './components/RankingTable'
import { TrendPanel } from './components/TrendPanel'
import { RegionDetails } from './components/RegionDetails'
import { K6Chart } from './components/K6Chart'
import type { Scope, Year } from './types'

// Smooth scrolling unless the user asked for reduced motion.
const scrollBehavior = (): ScrollBehavior => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
function detailHeading() { return document.getElementById('details-title') }

export default function App() {
  const { data, error } = useDataset()
  const [year, setYear] = useState<Year>(2022)
  const [scope, setScope] = useState<Scope>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [scrollRequest, setScrollRequest] = useState(0)
  // Dropdown choices scroll the detail panel into view once it has rendered; focus stays on the dropdown.
  useEffect(() => {
    if (scrollRequest) detailHeading()?.closest('section')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }, [scrollRequest])
  if (error) return <main className="status-page"><Info size={32} /><h1>Data belum dapat ditampilkan</h1><p role="alert">{error}</p><button className="button" onClick={() => window.location.reload()}>Coba muat ulang</button></main>
  if (!data) return <main className="status-page" aria-busy="true"><LoaderCircle className="loading-icon" size={30} /><h1>Menyiapkan dashboard</h1><p>Membaca dan memvalidasi CSV serta 35 batas wilayah…</p></main>
  const areas = data.rows.filter(row => row.year === 2019)
  // Scope filters the panels; selection only highlights a region and opens its details.
  const rows = filterRows(data.rows, year, scope)
  const selectedRow = data.rows.find(row => row.code === selected && row.year === year)
  const outOfScope = selectedRow !== undefined && !rows.some(row => row.code === selectedRow.code)
  const scopeLabel = scope === 'all' ? 'Semua kabupaten/kota' : scope === 'Kota' ? 'Semua kota' : 'Semua kabupaten'
  function chooseRegion(value: string) {
    if (value === 'all' || value === 'Kabupaten' || value === 'Kota') { setScope(value); setSelected(null) }
    else {
      setSelected(value)
      setAnnouncement(`Detail ${areas.find(row => row.code === value)?.name ?? value} ditampilkan di bawah`)
      setScrollRequest(count => count + 1)
    }
  }
  // A K6 bar selects exactly like the map (highlight + details, no scroll) and reuses the Tahap 1 live region,
  // because the detail panel opens above the chart, outside the user's view.
  function selectFromK6(code: string) {
    setSelected(code)
    setAnnouncement(`Detail ${areas.find(row => row.code === code)?.name ?? code} ditampilkan di atas grafik K6`)
  }
  function showDetails(event: React.MouseEvent) {
    event.preventDefault()
    const heading = detailHeading()
    heading?.focus({ preventScroll: true })
    heading?.closest('section')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }
  function reset() { setYear(2022); setScope('all'); setSelected(null); setAnnouncement(''); setResetKey(value => value + 1) }
  return <main className="dashboard">
    <a className="skip-link" href="#overview">Lewati ke dashboard</a>
    <div className="sr-only" role="status" aria-live="polite">{selectedRow ? announcement : ''}</div>
    <section className="dashboard-overview" aria-label="Ringkasan dashboard">
    <header className="page-header"><h1>Dashboard Prioritas Intervensi Stunting Kabupaten/Kota di Jawa Tengah</h1><Filters year={year} region={selected ?? scope} areas={areas} onYear={setYear} onRegion={chooseRegion} onReset={reset} /></header>
    <div id="overview"><Scorecards rows={rows} /></div>
    <div className="dashboard-grid"><MapPanel boundaries={data.boundaries} rows={rows} all={data.rows} year={year} selected={selected} onSelect={setSelected} resetKey={resetKey} /><div className="analysis-column"><ComparisonChart rows={rows} all={data.rows} year={year} /><RankingTable key={`${resetKey}:${scope}`} rows={rows} all={data.rows} year={year} scope={scope} selected={selected} onSelect={setSelected} /></div></div>
    <div className="overview-footer"><p><span className="status-dot" />{rows.length} wilayah · {year} · {scopeLabel}</p><div>{selectedRow && <a className="detail-link" href="#details-title" onClick={showDetails}>Detail {selectedRow.name} ↓</a>}<a href="#k6-title">Lihat perubahan K6</a><a href="#trend-title">Lihat analisis tren</a><button className="export-button" onClick={() => exportCsv(rows, data.rows)}><Download size={15} />Ekspor CSV cakupan</button></div></div>
    </section>
    {selectedRow && <RegionDetails row={selectedRow} all={data.rows} scopeLabel={outOfScope ? scopeLabel : null} onClear={() => { setSelected(null); setAnnouncement('') }} />}
    <K6Chart all={data.rows} scope={scope} scopeLabel={scopeLabel} selected={selected} onSelect={selectFromK6} detailName={selectedRow?.name ?? null} onShowDetails={showDetails} />
    <TrendPanel key={resetKey} all={data.rows} areas={areas} scope={scope} year={year} selected={selected} />
    <footer className="page-footer"><Info size={17} aria-hidden="true" /><div><p>Rata-rata sederhana antarwilayah, bukan rata-rata tertimbang jumlah balita. Target 14% merupakan acuan historis untuk periode analisis.</p><p>Dashboard mendukung prioritisasi berdasarkan prevalensi dan tidak menggantikan penentuan lokus intervensi resmi yang dapat menggunakan indikator tambahan.</p><p className="source-note">Sumber data: Dinas Kesehatan Provinsi Jawa Tengah melalui <a href="https://data.jatengprov.go.id/dataset/42f-sdjt-prevalensi-stunting" target="_blank" rel="noreferrer">Portal Satu Data Jawa Tengah</a> (CC-BY). Batas wilayah: <a href="https://github.com/cahyadsn/wilayah_boundaries" target="_blank" rel="noreferrer">cahyadsn/wilayah_boundaries</a> (MIT). Data bersih: <a href="https://doi.org/10.5281/zenodo.24267455" target="_blank" rel="noreferrer">Zenodo, DOI 10.5281/zenodo.24267455</a>.</p><p className="source-note">35 wilayah · 2019, 2021, 2022 · <a href="data/stunting.csv" download>Unduh data asli</a></p></div></footer>
  </main>
}
