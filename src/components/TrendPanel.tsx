import { useId, useState } from 'react'
import { CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { category, CATEGORIES, changeFrom2019, filterRows, mean, TARGET } from '../lib/calculations'
import { signed } from '../lib/format'
import type { RegionFilter, StuntingRow, Year } from '../types'
import { prevalenceLabel, prevalenceScale, SERIES_INK, SERIES_STYLES } from '../lib/visualEncoding'
import { CategoryLegend, SeriesSymbol } from './visuals/Encoding'

type Mode = 'average' | 'area' | 'multiple' | 'groups'
interface Props { all: StuntingRow[]; region: RegionFilter; year: Year; areas: StuntingRow[]; selected: string | null }
export function TrendPanel({ all, region, year, areas, selected }: Props) {
  const prefix = `trend-${useId().replace(/:/g, '')}`
  const { maximum, ticks } = prevalenceScale(all)
  const [mode, setMode] = useState<Mode>('average')
  const [area, setArea] = useState(areas[0].code)
  const [codes, setCodes] = useState<string[]>(areas.slice(0, 2).map(row => row.code))
  const [override, setOverride] = useState<string | null>(null)
  // A newly selected map/table area takes precedence, while the trend controls remain usable.
  const followSelected = selected !== null && override !== selected
  const effectiveMode = followSelected ? 'area' : mode
  const effectiveArea = followSelected ? selected : area
  const series = (effectiveMode === 'average' ? [{ key: 'average', name: region === 'all' ? 'Rata-rata 35 wilayah' : region === 'Kota' || region === 'Kabupaten' ? `Rata-rata ${region.toLowerCase()}` : areas.find(row => row.code === region)?.name ?? 'Rata-rata cakupan' }]
    : effectiveMode === 'groups' ? [{ key: 'Kota', name: 'Rata-rata kota' }, { key: 'Kabupaten', name: 'Rata-rata kabupaten' }]
    : (effectiveMode === 'area' ? [effectiveArea] : codes).filter((code): code is string => code !== null).map(code => ({ key: code, name: areas.find(row => row.code === code)?.name ?? code })))
    .map((item, index) => ({ ...item, ...SERIES_STYLES[index % SERIES_STYLES.length] }))
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
  function point(item: (typeof series)[number], input: unknown, active = false) {
    const { cx, cy, payload } = input as { cx?: number; cy?: number; payload?: Record<string, number | null> }
    const value = payload?.[item.key]
    if (cx === undefined || cy === undefined || value === undefined || value === null) return <g />
    const kind = category(value)
    return <SeriesSymbol className={active ? 'trend-active-point' : 'recharts-line-dot trend-observation'} shape={item.shape} cx={cx} cy={cy} radius={active ? 6.5 : 4.7}
      fill={CATEGORIES[kind].color} stroke={SERIES_INK} strokeWidth={1.5} data-year={payload?.year ?? undefined} data-value={value} data-category={kind} data-series={item.key} />
  }
  function seriesLegend() {
    return <ul className="series-legend" aria-label="Identitas seri: bentuk titik dan pola garis">{series.map(item => <li key={item.key}>
      <svg width="41" height="18" viewBox="0 0 41 18" aria-hidden="true"><path d="M1 9H40" stroke={SERIES_INK} strokeWidth="2" strokeDasharray={item.dash} /><SeriesSymbol shape={item.shape} cx={20} cy={9} radius={3.6} fill="#fff" stroke={SERIES_INK} strokeWidth={1.4} /></svg><span>{item.name}</span>
    </li>)}</ul>
  }
  return <section className="panel trend-panel" aria-labelledby="trend-title">
    <div className="trend-heading"><div><h2 id="trend-title">Analisis Tren Temporal</h2><p>Fitur pelengkap: perbandingan prevalensi pada 2019, 2021, dan 2022</p></div><div className="mode-tabs" role="group" aria-label="Mode analisis tren">{([['average', 'Rata-rata'], ['area', 'Satu wilayah'], ['multiple', 'Multiwilayah'], ['groups', 'Kota vs Kab.']] as const).map(([key, label]) => <button key={key} aria-pressed={effectiveMode === key} onClick={() => chooseMode(key)}>{label}</button>)}</div></div>
    {effectiveMode === 'area' && <div className="trend-selection"><label htmlFor="trend-area">Wilayah tren</label><select id="trend-area" value={effectiveArea ?? area} onChange={e => { setOverride(selected); setMode('area'); setArea(e.target.value) }}>{areas.map(row => <option key={row.code} value={row.code}>{row.name}</option>)}</select>{followSelected && <span>Mengikuti wilayah terpilih</span>}</div>}
    {effectiveMode === 'multiple' && <fieldset className="multi-select"><legend>Pilih hingga 5 wilayah untuk dibandingkan <span>({codes.length}/5)</span></legend><div>{areas.map(row => <label key={row.code}><input type="checkbox" checked={codes.includes(row.code)} disabled={!codes.includes(row.code) && codes.length >= 5} onChange={e => setCodes(e.target.checked ? [...codes, row.code] : codes.filter(code => code !== row.code))} />{row.name}</label>)}</div></fieldset>}
    {effectiveMode === 'groups' && <p className="scope-note">Perbandingan menggunakan seluruh kota dan kabupaten tingkat provinsi agar kedua kelompok dapat dibandingkan.</p>}
    {!!series.length && <CategoryLegend className="compact-legend trend-category-legend" />}
    {!series.length ? <div className="empty-state">Pilih setidaknya satu wilayah untuk menampilkan tren.</div> : <div className="trend-chart" role="img" aria-label="Grafik tren prevalensi 2019, 2021, 2022. Tahun 2020 tidak memiliki data.">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 25, right: 34, bottom: 18, left: 10 }}>
          <defs><pattern id={`${prefix}-missing`} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M4 0V8" stroke="#788594" strokeWidth=".7" strokeOpacity=".35" /></pattern></defs>
          <ReferenceArea y1={0} y2={TARGET} fill={CATEGORIES.achieved.color} fillOpacity={.065} stroke="none" />
          <ReferenceArea y1={TARGET} y2={20} fill={CATEGORIES.moderate.color} fillOpacity={.10} stroke="none" />
          <ReferenceArea y1={20} y2={maximum} fill={CATEGORIES.high.color} fillOpacity={.045} stroke="none" />
          <ReferenceArea x1={2019.75} x2={2020.25} fill={`url(#${prefix}-missing)`} stroke="none" />
          <CartesianGrid stroke="#dfe4ea" vertical={false} />
          <XAxis dataKey="year" type="number" domain={[2019, 2022]} ticks={[2019, 2020, 2021, 2022]} padding={{ left: 18, right: 18 }} tickLine={false} axisLine={{ stroke: '#7c8794' }} height={38} tick={{ fontSize: 12, fill: '#455363' }} label={{ value: 'Tahun', position: 'insideBottom', offset: -4, fill: '#455363', fontSize: 11 }} />
          <YAxis domain={[0, maximum]} ticks={[...ticks, TARGET].sort((a, b) => a - b)} interval={0} tickFormatter={value => `${value}%`} axisLine={false} tickLine={false} width={53} tick={{ fontSize: 11, fill: '#455363' }} label={{ value: 'Prevalensi (%)', angle: -90, position: 'insideLeft', offset: -3, fill: '#455363', fontSize: 11 }} />
          <ReferenceLine y={20} stroke="#a09aa0" strokeDasharray="2 4" />
          <ReferenceLine y={TARGET} stroke="#34465b" strokeWidth={1.4} strokeDasharray="5 3" label={{ value: '14%', position: 'insideTopRight', fill: '#34465b', fontSize: 11 }} />
          <ReferenceLine x={2020} stroke="#a6afbb" strokeDasharray="3 5" label={{ value: '2020: data tidak tersedia', position: 'insideTopRight', fill: '#596574', fontSize: 10, className: 'chart-explanation' }} />
          <Tooltip labelFormatter={label => `Tahun ${label}`} formatter={value => [prevalenceLabel(Number(value))]} contentStyle={{ borderRadius: 10, border: '1px solid #dce0e5', fontSize: 13 }} />
          <Legend content={seriesLegend} />
          {series.map(item => <Line key={item.key} type="linear" dataKey={item.key} name={item.name} stroke={SERIES_INK} strokeWidth={2} strokeDasharray={item.dash} dot={input => point(item, input)} activeDot={input => point(item, input, true)} connectNulls={false} isAnimationActive={false}>
            {series.length === 1 && <LabelList dataKey={item.key} position="top" offset={10} formatter={value => value === null || value === undefined ? '' : prevalenceLabel(Number(value))} fill="#34465b" fontSize={12} fontWeight={650} />}
          </Line>)}
        </LineChart>
      </ResponsiveContainer>
    </div>}
    <div className="trend-notes"><p>2020 tidak memiliki data. Garis dibiarkan terputus; tidak ada interpolasi atau estimasi.</p>{changes[0] && <p><strong>{changes[0].delta > 0 ? 'Peningkatan terbesar' : changes[0].delta < 0 ? 'Penurunan paling lambat' : 'Tidak ada perubahan'} dalam cakupan:</strong> {changes[0].row.name}, {signed(changes[0].delta)} (2019–{year}).</p>}</div>
  </section>
}
