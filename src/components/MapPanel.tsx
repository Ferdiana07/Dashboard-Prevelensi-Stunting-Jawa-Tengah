import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { geoIdentity, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { CATEGORIES, category, K6_LABEL, k6Change, TARGET } from '../lib/calculations'
import { percent, signed } from '../lib/format'
import { labelText, layoutLabels, lowCategoryRows, type Box, type LabelInput } from '../lib/mapLabels'
import type { Boundaries, StuntingRow, Year } from '../types'
import { CategoryLegend, CategoryPatterns } from './visuals/Encoding'
import { CursorTooltip } from './map/CursorTooltip'

const VIEW: Box = { x: 4, y: 4, width: 752, height: 432 }
const INSET: Box = { x: 15, y: 12, width: 145, height: 110 }
interface Props { boundaries: Boundaries; rows: StuntingRow[]; all: StuntingRow[]; year: Year; selected: string | null; onSelect: (code: string) => void; resetKey: number }
function partition(boundaries: Boundaries) {
  const main: Boundaries = { type: 'FeatureCollection', features: [] }
  const islands: Boundaries = { type: 'FeatureCollection', features: [] }
  for (const feature of boundaries.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    for (const [collection, north] of [[main, false], [islands, true]] as const) {
      const coords = polygons.filter(polygon => (Math.max(...polygon[0].map(point => point[1])) > -6.15) === north)
      if (coords.length) collection.features.push({ ...feature, geometry: { type: 'MultiPolygon', coordinates: coords } })
    }
  }
  return { main, islands }
}

export function MapPanel({ boundaries, rows, all, year, selected, onSelect, resetKey }: Props) {
  const prefix = `map-${useId().replace(/:/g, '')}`
  const svg = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const controls = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<ZoomTransform>(zoomIdentity)
  // Zoom controls and text scale are measured in viewBox units so labels can steer clear of the HTML buttons.
  const [measured, setMeasured] = useState<{ controls: Box | null; scale: number }>({ controls: null, scale: 1 })
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)
  const { main, islands } = useMemo(() => partition(boundaries), [boundaries])
  // Planar equirectangular view of supplied longitude/latitude. No ring rewinding or simplification.
  const path = useMemo(() => geoPath(geoIdentity().reflectY(true).fitExtent([[16, 20], [744, 420]], main)), [main])
  const islandPath = useMemo(() => geoPath(geoIdentity().reflectY(true).fitExtent([[27, 36], [145, 106]], islands)), [islands])
  const byCode = new Map(rows.map(row => [row.code, row]))
  const yearRows = all.filter(row => row.year === year)
  // Label font keeps a roughly constant on-screen size (about 10px) whatever the panel width; zoom never changes it.
  const fontSize = Math.min(20, Math.max(11, 10 / measured.scale))
  const geometry = useMemo(() => new Map(main.features.map(feature => {
    const [[x0, y0], [x1, y1]] = path.bounds(feature)
    return [String(feature.properties.kode_wilayah), { centroid: path.centroid(feature), bounds: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } }] as const
  })), [main, path])
  const labels = useMemo(() => {
    const inputs: LabelInput[] = lowCategoryRows(rows).flatMap(row => {
      const shape = geometry.get(row.code)
      if (!shape) return []
      const toView = ([x, y]: [number, number]): [number, number] => [x * view.k + view.x, y * view.k + view.y]
      const [x, y] = toView(shape.centroid as [number, number])
      return [{ code: row.code, text: labelText(row), anchor: [x, y] as [number, number], marker: row.type === 'Kota',
        bounds: { x: shape.bounds.x * view.k + view.x, y: shape.bounds.y * view.k + view.y, width: shape.bounds.width * view.k, height: shape.bounds.height * view.k } }]
    })
    return layoutLabels(inputs, [INSET, ...(measured.controls ? [measured.controls] : [])], VIEW, fontSize)
  }, [rows, geometry, view, measured.controls, fontSize])
  const hovered = yearRows.find(row => row.code === hover?.code)
  useEffect(() => {
    if (!svg.current || !layer.current) return
    const root = select(svg.current)
    const pan = zoom<SVGSVGElement, unknown>().scaleExtent([1, 6]).extent([[0, 0], [760, 440]])
      .translateExtent([[-100, -70], [860, 510]])
      .filter(event => !event.ctrlKey && !event.button && event.type !== 'wheel')
      .on('zoom', event => { select(layer.current).attr('transform', event.transform.toString()); setView(event.transform); setHover(null) })
    root.call(pan).on('dblclick.zoom', null)
    behavior.current = pan
    return () => { root.on('.zoom', null) }
  }, [])
  useLayoutEffect(() => {
    const measure = () => {
      const canvas = svg.current, buttons = controls.current, matrix = canvas?.getScreenCTM()
      if (!canvas || !buttons || !matrix) return
      const inverse = matrix.inverse()
      const rect = buttons.getBoundingClientRect()
      const from = new DOMPoint(rect.left, rect.top).matrixTransform(inverse)
      const to = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse)
      const box = { x: Math.round(from.x), y: Math.round(from.y), width: Math.round(to.x - from.x), height: Math.round(to.y - from.y) }
      const scale = Math.round(matrix.a * 100) / 100
      setMeasured(prev => prev.scale === scale && prev.controls && prev.controls.x === box.x && prev.controls.y === box.y && prev.controls.width === box.width && prev.controls.height === box.height ? prev : { controls: box, scale })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (svg.current) observer.observe(svg.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (svg.current && behavior.current) select(svg.current).call(behavior.current.transform, zoomIdentity)
  }, [resetKey])
  useEffect(() => {
    const dismiss = () => setHover(null)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [])
  function zoomBy(factor: number) {
    if (svg.current && behavior.current) select(svg.current).call(behavior.current.scaleBy, factor)
  }
  function show(code: string, clientX: number, clientY: number) {
    setHover({ code, x: clientX, y: clientY })
  }
  function focus(code: string, target: SVGElement) {
    const box = target.getBoundingClientRect()
    show(code, box.left + box.width / 2, box.top + box.height / 2)
  }
  function features(collection: FeatureCollection<Polygon | MultiPolygon>, draw: typeof path, inset = false) {
    return collection.features.map(feature => {
      const code = String(feature.properties?.kode_wilayah)
      const row = byCode.get(code)
      const name = yearRows.find(row => row.code === code)?.name ?? code
      const d = draw(feature) ?? undefined
      const kind = row ? category(row.prevalence) : null
      return <g key={code}><path d={d} data-region={inset ? undefined : code}
        className={`map-region ${selected === code ? 'selected' : ''} ${row ? '' : 'out-of-scope'}`}
        fill={row ? CATEGORIES[category(row.prevalence)].color : '#e2e5e9'}
        role="button" tabIndex={0} aria-label={`${name}${inset ? ', Kepulauan Karimunjawa' : ''}, ${row ? percent(row.prevalence) : 'di luar cakupan'}, ${year}`}
        aria-pressed={selected === code}
        aria-describedby={hover?.code === code ? `${prefix}-tooltip` : undefined}
        onPointerMove={e => { if (e.pointerType !== 'touch') show(code, e.clientX, e.clientY) }} onPointerLeave={() => setHover(null)}
        onFocus={e => focus(code, e.currentTarget)} onBlur={() => setHover(null)} onClick={() => { setHover(null); onSelect(code) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(code) } if (e.key === 'Escape') setHover(null) }}><title>{name}</title></path>
        {kind && kind !== 'achieved' && <path className="category-pattern map-pattern" d={d} fill={`url(#${prefix}-${kind})`} pointerEvents="none" aria-hidden="true" />}
      </g>
    })
  }
  return <section className="panel map-panel" aria-labelledby="map-title">
    <div className="map-heading"><div><h2 id="map-title">Peta Prevalensi Stunting</h2><p>Kabupaten/Kota di Jawa Tengah ({year})</p></div></div>
    <div className="map-canvas">
      <svg ref={svg} viewBox="0 0 760 440" aria-label={`Peta interaktif prevalensi stunting Jawa Tengah ${year}`}>
        <CategoryPatterns prefix={prefix} />
        <g ref={layer}>{features(main, path)}
          {main.features.filter(feature => yearRows.find(row => row.code === feature.properties.kode_wilayah)?.type === 'Kota').map(feature => {
            const code = feature.properties.kode_wilayah
            const row = byCode.get(code)
            const [cx, cy] = path.centroid(feature)
            return <g key={code}><circle cx={cx} cy={cy} r={6} className={`city-marker ${selected === code ? 'selected' : ''}`} fill={row ? CATEGORIES[category(row.prevalence)].color : '#e2e5e9'}
              role="button" tabIndex={0} aria-label={`Titik ${feature.properties.wilayah}`} aria-pressed={selected === code} aria-describedby={hover?.code === code ? `${prefix}-tooltip` : undefined} onClick={() => { setHover(null); onSelect(code) }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(code) } if (e.key === 'Escape') setHover(null) }} onFocus={e => focus(code, e.currentTarget)} onBlur={() => setHover(null)}
              onPointerMove={e => { if (e.pointerType !== 'touch') show(code, e.clientX, e.clientY) }} onPointerLeave={() => setHover(null)} />
              {row && category(row.prevalence) !== 'achieved' && <circle cx={cx} cy={cy} r={6} className="category-pattern" fill={`url(#${prefix}-${category(row.prevalence)})`} pointerEvents="none" aria-hidden="true" />}
            </g>
          })}
        </g>
        <g className="map-labels" aria-hidden="true" pointerEvents="none" style={{ fontSize }}>
          {labels.map(label => <g key={label.code} className="map-label" data-label={label.code}>
            {label.leader && <><line className="leader-halo" x1={label.anchor[0]} y1={label.anchor[1]} x2={label.leader[0]} y2={label.leader[1]} /><line className="leader" x1={label.anchor[0]} y1={label.anchor[1]} x2={label.leader[0]} y2={label.leader[1]} /><circle className="leader-dot" cx={label.anchor[0]} cy={label.anchor[1]} r={2.2} /></>}
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">{label.text}</text>
          </g>)}
        </g>
        <g className="inset"><rect x={15} y={12} width={145} height={110} rx={9} fill="white" stroke="#dce0e5" /><text x={25} y={29}>Kep. Karimunjawa</text>{features(islands, islandPath, true)}</g>
      </svg>
      <div ref={controls} className="map-controls" aria-label="Kontrol peta"><button className="icon-button" onClick={() => zoomBy(1.4)} aria-label="Perbesar peta"><Plus size={17} /></button><button className="icon-button" onClick={() => zoomBy(1 / 1.4)} aria-label="Perkecil peta"><Minus size={17} /></button><button className="icon-button" aria-label="Reset zoom" onClick={() => { if (svg.current && behavior.current) select(svg.current).call(behavior.current.transform, zoomIdentity) }}><RotateCcw size={15} /></button></div>
      {hover && hovered && <CursorTooltip anchor={hover} id={`${prefix}-tooltip`}>
        <strong>{hovered.name}</strong><span className="tooltip-year">Tahun {year} · {byCode.has(hovered.code) ? 'Dalam cakupan' : 'Di luar cakupan'}</span>
        <div className="tooltip-value" style={{ color: CATEGORIES[category(hovered.prevalence)].text }}>{percent(hovered.prevalence)} <small>{CATEGORIES[category(hovered.prevalence)].label}</small></div>
        <dl><div><dt>Target ≤ 14%</dt><dd>{hovered.prevalence <= TARGET ? 'Tercapai' : 'Belum tercapai'}</dd></div><div><dt>Jarak target</dt><dd>{signed(hovered.prevalence - TARGET)}</dd></div><div><dt>{K6_LABEL}</dt><dd>{signed(k6Change(all, hovered.code))}</dd></div></dl>
        <span className="tooltip-hint">Klik untuk melihat detail wilayah</span>
      </CursorTooltip>}
    </div>
    <div className="map-footer"><h3>Prevalensi Stunting</h3><CategoryLegend className="map-legend" counts={{ achieved: rows.filter(row => category(row.prevalence) === 'achieved').length, moderate: rows.filter(row => category(row.prevalence) === 'moderate').length, high: rows.filter(row => category(row.prevalence) === 'high').length }} /><p className="map-help">Klik wilayah untuk detail · Geser peta untuk menjelajah · Titik menandai kota</p></div>
  </section>
}
