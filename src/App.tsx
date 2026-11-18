import { useState } from 'react'
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
import type { RegionFilter, Year } from './types'

export default function App() {
  const { data, error } = useDataset()
  const [year, setYear] = useState<Year>(2022)
  const [region, setRegion] = useState<RegionFilter>('all')
  const [resetKey, setResetKey] = useState(0)
  if (error) return <main className="status-page"><Info size={32} /><h1>Data belum dapat ditampilkan</h1><p role="alert">{error}</p><button className="button" onClick={() => window.location.reload()}>Coba muat ulang</button></main>
  if (!data) return <main className="status-page" aria-busy="true"><LoaderCircle className="loading-icon" size={30} /><h1>Menyiapkan dashboard</h1><p>Membaca dan memvalidasi CSV serta 35 batas wilayah…</p></main>
  const areas = data.rows.filter(row => row.year === 2019)
  const rows = filterRows(data.rows, year, region)
  const selected = areas.some(row => row.code === region) ? region : null
  const selectedRow = rows.find(row => row.code === selected)
  const scope = region === 'all' ? 'Semua kabupaten/kota' : region === 'Kota' ? 'Semua kota' : region === 'Kabupaten' ? 'Semua kabupaten' : areas.find(row => row.code === region)?.name ?? region
  function reset() { setYear(2022); setRegion('all'); setResetKey(value => value + 1) }
  return <main className="dashboard">
    <a className="skip-link" href="#overview">Lewati ke dashboard</a>
    <section className="dashboard-overview" aria-label="Ringkasan dashboard">
    <header className="page-header"><h1>Dashboard Prioritas Intervensi Stunting Kabupaten/Kota di Jawa Tengah</h1><Filters year={year} region={region} areas={areas} onYear={setYear} onRegion={setRegion} onReset={reset} /></header>
    <div id="overview"><Scorecards rows={rows} /></div>
    <div className="dashboard-grid"><MapPanel boundaries={data.boundaries} rows={rows} all={data.rows} year={year} selected={selected} onSelect={setRegion} resetKey={resetKey} /><div className="analysis-column"><ComparisonChart rows={rows} year={year} /><RankingTable key={`${resetKey}:${region}`} rows={rows} all={data.rows} year={year} selected={selected} onSelect={setRegion} /></div></div>
    <div className="overview-footer"><p><span className="status-dot" />{rows.length} wilayah · {year} · {scope}</p><div><a href="#trend-title">Lihat analisis tren</a><button className="export-button" onClick={() => exportCsv(rows, data.rows)}><Download size={15} />Ekspor CSV cakupan</button></div></div>
    </section>
    {selectedRow && <RegionDetails row={selectedRow} all={data.rows} onClear={() => setRegion('all')} />}
    <TrendPanel key={resetKey} all={data.rows} areas={areas} region={region} year={year} selected={selected} />
    <footer className="page-footer"><Info size={17} aria-hidden="true" /><div><p>Rata-rata sederhana antarwilayah, bukan rata-rata tertimbang jumlah balita. Target 14% merupakan acuan historis untuk periode analisis.</p><p>Dashboard mendukung prioritisasi berdasarkan prevalensi dan tidak menggantikan penentuan lokus intervensi resmi yang dapat menggunakan indikator tambahan.</p><p className="source-note">Sumber: CSV prevalensi dan GeoJSON yang dilampirkan · 35 wilayah · 2019, 2021, 2022 · <a href="data/stunting.csv" download>Unduh data asli</a></p></div></footer>
  </main>
}
