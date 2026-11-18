import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { changeFrom2019, filterRows, mean, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import type { RegionFilter, StuntingRow, Year } from '../types'

type Mode = 'average' | 'area' | 'multiple' | 'groups'
const PALETTE = ['#2563a6', '#a14399', '#bd5c12', '#117866', '#5f55bb']
interface Props { all: StuntingRow[]; region: RegionFilter; year: Year; areas: StuntingRow[]; selected: string | null }
export function TrendPanel({ all, region, year, areas, selected }: Props) {
  const [mode, setMode] = useState<Mode>('average')
  const [area, setArea] = useState(areas[0].code)
  const [codes, setCodes] = useState<string[]>(areas.slice(0, 2).map(row => row.code))
  const [override, setOverride] = useState<string | null>(null)
  // A newly selected map/table area takes precedence, while the trend controls remain usable.
  const followSelected = selected !== null && override !== selected
  const effectiveMode = followSelected ? 'area' : mode
  const effectiveArea = followSelected ? selected : area
  const series = effectiveMode === 'average' ? [{ key: 'average', name: region === 'all' ? 'Rata-rata 35 wilayah' : region === 'Kota' || region === 'Kabupaten' ? `Rata-rata ${region.toLowerCase()}` : areas.find(row => row.code === region)?.name ?? 'Rata-rata cakupan', color: PALETTE[0] }]
    : effectiveMode === 'groups' ? [{ key: 'Kota', name: 'Rata-rata kota', color: '#2563a6' }, { key: 'Kabupaten', name: 'Rata-rata kabupaten', color: '#a14399' }]
    : (effectiveMode === 'area' ? [effectiveArea] : codes).filter((code): code is string => code !== null).map((code, index) => ({ key: code, name: areas.find(row => row.code === code)?.name ?? code, color: PALETTE[index % PALETTE.length] }))
  const data = [2019, 2020, 2021, 2022].map(t => {
    const point: Record<string, number | null> = { year: t }
    for (const item of series) {
      point[item.key] = t === 2020 ? null : effectiveMode === 'average' ? mean(filterRows(all, t as Year, region))
        : effectiveMode === 'groups' ? mean(all.filter(row => row.year === t && row.type === item.key))
        : all.find(row => row.year === t && row.code === item.key)?.prevalence ?? null
    }
    return point
  })
  const focusRows = filterRows(all, year, region)
  const changes = focusRows.map(row => ({ row, delta: changeFrom2019(all, row) })).filter((item): item is { row: StuntingRow; delta: number } => item.delta !== null).sort((a, b) => b.delta - a.delta)
  function chooseMode(value: Mode) { setMode(value); setOverride(selected); if (selected) setArea(selected) }
  return <section className="panel trend-panel" aria-labelledby="trend-title">
    <div className="trend-heading"><div><h2 id="trend-title">Analisis Tren Temporal</h2><p>Fitur pelengkap: perbandingan prevalensi pada 2019, 2021, dan 2022</p></div><div className="mode-tabs" role="group" aria-label="Mode analisis tren">{([['average', 'Rata-rata'], ['area', 'Satu wilayah'], ['multiple', 'Multiwilayah'], ['groups', 'Kota vs Kab.']] as const).map(([key, label]) => <button key={key} aria-pressed={effectiveMode === key} onClick={() => chooseMode(key)}>{label}</button>)}</div></div>
    {effectiveMode === 'area' && <div className="trend-selection"><label htmlFor="trend-area">Wilayah tren</label><select id="trend-area" value={effectiveArea ?? area} onChange={e => { setOverride(selected); setMode('area'); setArea(e.target.value) }}>{areas.map(row => <option key={row.code} value={row.code}>{row.name}</option>)}</select>{followSelected && <span>Mengikuti wilayah terpilih</span>}</div>}
    {effectiveMode === 'multiple' && <fieldset className="multi-select"><legend>Pilih hingga 5 wilayah untuk dibandingkan <span>({codes.length}/5)</span></legend><div>{areas.map(row => <label key={row.code}><input type="checkbox" checked={codes.includes(row.code)} disabled={!codes.includes(row.code) && codes.length >= 5} onChange={e => setCodes(e.target.checked ? [...codes, row.code] : codes.filter(code => code !== row.code))} />{row.name}</label>)}</div></fieldset>}
    {effectiveMode === 'groups' && <p className="scope-note">Perbandingan menggunakan seluruh kota dan kabupaten tingkat provinsi agar kedua kelompok dapat dibandingkan.</p>}
    {!series.length ? <div className="empty-state">Pilih setidaknya satu wilayah untuk menampilkan tren.</div> : <div className="trend-chart" role="img" aria-label="Grafik tren prevalensi 2019, 2021, 2022. Tahun 2020 tidak memiliki data.">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 25, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#e8ebef" vertical={false} /><XAxis dataKey="year" type="number" domain={[2019, 2022]} ticks={[2019, 2020, 2021, 2022]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#626a76' }} /><YAxis domain={[0, (max: number) => Math.ceil(Math.max(max, 20) / 10) * 10]} tickFormatter={value => `${value}%`} axisLine={false} tickLine={false} width={45} tick={{ fontSize: 12, fill: '#626a76' }} />
          <ReferenceLine y={TARGET} stroke="#69716e" strokeDasharray="5 4" label={{ value: 'Target 14%', position: 'insideTopRight', fill: '#515a56', fontSize: 11 }} />
          <ReferenceLine x={2020} stroke="#b8bec7" strokeDasharray="3 5" label={{ value: '2020: data tidak tersedia', position: 'insideTopRight', fill: '#636c78', fontSize: 11 }} />
          <Tooltip labelFormatter={label => `Tahun ${label}`} formatter={value => [percent(Number(value))]} contentStyle={{ borderRadius: 10, border: '1px solid #dce0e5', fontSize: 13 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
          {series.map(item => <Line key={item.key} type="linear" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2.5} dot={{ r: 4.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>}
    <div className="trend-notes"><p>2020 tidak memiliki data. Garis dibiarkan terputus; tidak ada interpolasi atau estimasi.</p>{changes[0] && <p><strong>{changes[0].delta > 0 ? 'Peningkatan terbesar' : changes[0].delta < 0 ? 'Penurunan paling lambat' : 'Tidak ada perubahan'} dalam cakupan:</strong> {changes[0].row.name}, {signed(changes[0].delta)} (2019–{year}).</p>}</div>
  </section>
}
