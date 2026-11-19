import { useId, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, useXAxisScale, useYAxisScale, XAxis, YAxis } from 'recharts'
import { category, CATEGORIES, k6Change, filterRows, mean, roundingShiftsCategory, TARGET } from '../lib/calculations'
import { exactPercent, percent, signed } from '../lib/format'
import type { Scope, StuntingRow, Year } from '../types'
import { prevalenceScale, SERIES_INK, SERIES_STYLES } from '../lib/visualEncoding'
import { CategoryLegend, SeriesSymbol } from './visuals/Encoding'

// A label above a point is about 22 px tall from the point centre and the marker above it reaches 5 px past its own
// centre, so two points closer than this (in screen pixels) cannot both keep their label above.
export const LABEL_CLEARANCE_PX = 28
interface LabelSeries { key: string }
// Value labels drawn inside the chart so they can use the real axis scales. The higher series is labelled above its point;
// the lower one goes below its point when the two points are closer than LABEL_CLEARANCE_PX on screen (2021: 20,1% vs 19,1%),
// otherwise both stay above, which keeps 15,8% off the 14% target line.
function ValueLabels({ series, data }: { series: LabelSeries[]; data: Record<string, number | null>[] }) {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  if (!xScale || !yScale) return null
  return <g className="trend-value-labels" aria-hidden="true">{series.flatMap((item, seriesIndex) => data.map(row => {
    const value = row[item.key]
    const x = xScale(row.year), y = yScale(value)
    if (value === null || value === undefined || typeof x !== 'number' || typeof y !== 'number') return null
    const other = series.length === 2 ? row[series[1 - seriesIndex].key] : null
    const otherY = other === null || other === undefined ? undefined : yScale(other)
    const closer = typeof otherY === 'number' && Math.abs(y - otherY) < LABEL_CLEARANCE_PX
    const below = closer && (value < (other as number) || (value === other && seriesIndex === 1))
    return <text key={`${item.key}-${row.year}`} className="trend-value-label" x={x} y={below ? y + 19 : y - 11} textAnchor="middle" data-series={item.key} data-year={row.year ?? undefined} data-position={below ? 'below' : 'above'}>{percent(value)}</text>
  }))}</g>
}
type Mode = 'average' | 'area' | 'multiple' | 'groups'
interface Props { all: StuntingRow[]; scope: Scope; year: Year; areas: StuntingRow[]; selected: string | null }
export function TrendPanel({ all, scope, year, areas, selected }: Props) {
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
  const series = (effectiveMode === 'average' ? [{ key: 'average', name: scope === 'all' ? 'Rata-rata 35 wilayah' : `Rata-rata ${scope.toLowerCase()}` }]
    : effectiveMode === 'groups' ? [{ key: 'Kota', name: 'Rata-rata kota' }, { key: 'Kabupaten', name: 'Rata-rata kabupaten' }]
    : (effectiveMode === 'area' ? [effectiveArea] : codes).filter((code): code is string => code !== null).map(code => ({ key: code, name: areas.find(row => row.code === code)?.name ?? code })))
    .map((item, index) => ({ ...item, ...SERIES_STYLES[index % SERIES_STYLES.length] }))
  const data = [2019, 2020, 2021, 2022].map(t => {
    const point: Record<string, number | null> = { year: t }
    for (const item of series) {
      point[item.key] = t === 2020 ? null : effectiveMode === 'average' ? mean(filterRows(all, t as Year, scope))
        : effectiveMode === 'groups' ? mean(all.filter(row => row.year === t && row.type === item.key))
        : all.find(row => row.year === t && row.code === item.key)?.prevalence ?? null
    }
    return point
  })
  const focusRows = filterRows(all, year, scope)
  const changes = focusRows.map(row => ({ row, delta: k6Change(all, row.code) })).filter((item): item is { row: StuntingRow; delta: number } => item.delta !== null).sort((a, b) => b.delta - a.delta)
  // Labels show one decimal, but categories come from the unrounded value; say so when they disagree.
  const roundingNotes = series.flatMap(item => data.filter(row => row[item.key] !== null && row[item.key] !== undefined && roundingShiftsCategory(row[item.key]!)).map(row => `${item.name} ${row.year} = ${exactPercent(row[item.key]!)}, ditampilkan ${percent(row[item.key]!)}`))
  function chooseMode(value: Mode) { setMode(value); setOverride(selected); if (selected) setArea(selected) }
  function point(item: (typeof series)[number], input: unknown, active = false) {
    const { cx, cy, payload } = input as { cx?: number; cy?: number; payload?: Record<string, number | null> }
    const value = payload?.[item.key]
    if (cx === undefined || cy === undefined || value === undefined || value === null) return <g />
    const kind = category(value)
    return <SeriesSymbol className={active ? 'trend-active-point' : 'recharts-line-dot trend-observation'} shape={item.shape} cx={cx} cy={cy} radius={active ? 6.5 : 4.7}
      fill={CATEGORIES[kind].color} stroke={SERIES_INK} strokeWidth={1.5} data-year={payload?.year ?? undefined} data-value={value} data-category={kind} data-series={item.key} />
  }
  // Value labels for modes with at most two series (Multiwilayah relies on hover).
  const labelled = effectiveMode !== 'multiple' && series.length <= 2
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
          <Tooltip labelFormatter={label => `Tahun ${label}`} formatter={value => { const v = Number(value); return [exactPercent(v) === percent(v) ? percent(v) : `${percent(v)} (tepat ${exactPercent(v)})`] }} contentStyle={{ borderRadius: 10, border: '1px solid #dce0e5', fontSize: 13 }} />
          <Legend content={seriesLegend} />
          {series.map(item => <Line key={item.key} type="linear" dataKey={item.key} name={item.name} stroke={SERIES_INK} strokeWidth={2} strokeDasharray={item.dash} dot={input => point(item, input)} activeDot={input => point(item, input, true)} connectNulls={false} isAnimationActive={false}>
          </Line>)}
          {labelled && <ValueLabels series={series} data={data} />}
        </LineChart>
      </ResponsiveContainer>
    </div>}
    <div className="trend-notes"><p>2020 tidak memiliki data. Garis dibiarkan terputus; tidak ada interpolasi atau estimasi.</p>{roundingNotes.length > 0 && <p className="rounding-note">{roundingNotes.join('; ')}; kategori ditentukan sebelum pembulatan.</p>}{changes[0] && <p><strong>{changes[0].delta > 0 ? 'Peningkatan terbesar' : changes[0].delta < 0 ? 'Penurunan paling lambat' : 'Tidak ada perubahan'} dalam cakupan:</strong> {changes[0].row.name}, {signed(changes[0].delta)} (2019–2022).</p>}</div>
  </section>
}
