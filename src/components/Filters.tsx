import { ChevronDown, Download, RotateCcw } from 'lucide-react'
import { YEARS, type StuntingRow, type Year } from '../types'

interface Props { year: Year; region: string; areas: StuntingRow[]; onYear: (year: Year) => void; onRegion: (region: string) => void; onReset: () => void; onExport: () => void }
export function Filters({ year, region, areas, onYear, onRegion, onReset, onExport }: Props) {
  return <div className="filters">
    <div className="select-wrap"><label htmlFor="year">Tahun:</label><select id="year" value={year} onChange={e => onYear(Number(e.target.value) as Year)}>{YEARS.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>
    <div className="select-wrap region-select"><label htmlFor="region">Wilayah:</label><select id="region" value={region} onChange={e => onRegion(e.target.value)}>
      <option value="all">Semua Kab/Kota</option><option value="Kabupaten">Semua Kabupaten</option><option value="Kota">Semua Kota</option>
      <optgroup label="Kabupaten / Kota">{areas.map(row => <option key={row.code} value={row.code}>{row.name}</option>)}</optgroup>
    </select><ChevronDown size={16} aria-hidden="true" /></div>
    <button className="icon-button reset-filter" onClick={onReset} aria-label="Reset Filter" title="Reset Filter"><RotateCcw size={16} aria-hidden="true" /></button>
    <button className="export-button" onClick={onExport}><Download size={16} aria-hidden="true" />Unduh CSV</button>
  </div>
}
