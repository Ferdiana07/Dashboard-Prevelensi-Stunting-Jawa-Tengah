import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { K6_DOWN, k6Entries, k6Groups, type K6Entry, K6_NOTE, K6_UP, k6Value } from '../lib/calculations'
import { number, signed } from '../lib/format'
import type { Scope, StuntingRow } from '../types'

const FLAT = '#7c8794'
const TICK_STEP = 5
const PAD = 0.5 // pp of breathing room beyond the data on each side of the axis

interface Layout { width: number; compact: boolean }
function geometry(entries: K6Entry[], { width, compact }: Layout) {
  const font = compact ? 11 : 12
  const rowHeight = compact ? 21 : 22
  const nameWidth = compact ? 108 : 132 // longest names: Kab. Banjarnegara, Kota Pekalongan
  const labelGap = compact ? 38 : 44 // room for "-19,6" on the left of a bar end, "+3,6" on the right
  // Direction labels sit in the header row, so they may run past the plot up to the SVG edge. On phones they wrap to two lines.
  const directionWidth = compact ? 66 : 118 // "(memburuk)" / "Naik (memburuk) →"
  const header = compact ? 38 : 28
  const left = nameWidth + labelGap
  const right = width - labelGap
  const values = entries.map(e => e.change)
  let lo = Math.min(0, ...values) - PAD
  let hi = Math.max(0, ...values) + PAD
  // Widen the short side of the axis only as far as its direction label needs (e.g. Kota, where nothing increases).
  const span = right - left
  const zeroAt = () => left + -lo / (hi - lo) * span
  if (zeroAt() > width - directionWidth) { const f = (width - directionWidth - left) / span; if (f > 0 && f < 1) hi = -lo * (1 - f) / f }
  if (zeroAt() < directionWidth) { const f = (directionWidth - left) / span; if (f > 0 && f < 1) lo = -hi * f / (1 - f) }
  const x = (v: number) => left + (v - lo) / (hi - lo) * span
  const ticks: number[] = []
  for (let t = Math.ceil(lo / TICK_STEP) * TICK_STEP; t <= hi; t += TICK_STEP) ticks.push(t)
  const plotBottom = header + entries.length * rowHeight
  return { font, compact, center: (left + right) / 2, rowHeight, nameWidth, header, x, ticks, plotBottom, height: plotBottom + 40, barHeight: Math.round(rowHeight * .62) }
}

const DIRECTION_WORD = { up: 'naik', flat: 'tetap', down: 'turun' } as const
// Screen-reader name of a bar: region, direction and the rounded size of the change.
const k6AriaLabel = (entry: K6Entry) => `${entry.name}, ${DIRECTION_WORD[entry.direction]} ${number(Math.abs(entry.change))} pp`

interface Props {
  all: StuntingRow[]; scope: Scope; scopeLabel: string
  selected: string | null; onSelect: (code: string) => void
  // Name of the region whose detail panel is open above, with the handler that moves focus there.
  detailName: string | null; onShowDetails: (event: React.MouseEvent) => void
}
export function K6Chart({ all, scope, scopeLabel, selected, onSelect, detailName, onShowDetails }: Props) {
  const entries = useMemo(() => k6Entries(all, scope), [all, scope])
  const groups = k6Groups(entries)
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = box.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  // Roving tabindex: the chart is one Tab stop; ↑/↓/Home/End move between bars, Enter/Space selects.
  const [focusCode, setFocusCode] = useState<string | null>(null)
  const tabbable = [focusCode, selected].find(code => code && entries.some(e => e.code === code)) ?? entries[0]?.code
  const rows = useRef(new Map<string, SVGGElement>())
  // Selecting opens the detail panel above this chart. Keep the chosen bar at the same spot on screen
  // (no automatic scroll in either direction): remember where it was, then offset the page before paint.
  const anchor = useRef<{ code: string; top: number } | null>(null)
  function choose(code: string) {
    const node = rows.current.get(code)
    anchor.current = node ? { code, top: node.getBoundingClientRect().top } : null
    setFocusCode(code)
    onSelect(code)
  }
  useLayoutEffect(() => {
    const pending = anchor.current
    anchor.current = null
    const node = pending && rows.current.get(pending.code)
    if (!pending || !node) return
    const shift = node.getBoundingClientRect().top - pending.top
    if (Math.abs(shift) >= 1) window.scrollBy({ top: shift, behavior: 'instant' })
  }, [selected, detailName])
  function moveFocus(event: React.KeyboardEvent, index: number) {
    const keys: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: entries.length - 1 }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(entries[index].code); return }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = entries[Math.max(0, Math.min(entries.length - 1, keys[event.key]))]
    setFocusCode(next.code)
    rows.current.get(next.code)?.focus()
  }
  const compact = width > 0 && width < 480
  const g = width ? geometry(entries, { width, compact }) : null
  const zero = g?.x(0) ?? 0
  const top = (index: number) => g!.header + index * g!.rowHeight
  return <section className="panel k6-panel" aria-labelledby="k6-title">
    <div className="k6-heading"><div><h2 id="k6-title" tabIndex={-1}>Perubahan Prevalensi 2019→2022</h2><p>Menjawab CBQ 2: wilayah yang naik atau turunnya paling lambat. Diurutkan dari kenaikan terbesar.</p></div>{detailName && <a className="k6-detail-link" href="#details-title" onClick={onShowDetails}>Detail {detailName} ↑</a>}</div>
    <div className="k6-body">
      <aside className="k6-side" aria-label="Ringkasan arah perubahan">
        <div className="k6-cards">
          <K6Card kind="up" title="Naik" count={groups.up.length} detail={groups.up[0] ? `Terbesar: ${groups.up[0].name} ${signed(groups.up[0].change)}` : 'Tidak ada wilayah yang naik'} />
          <K6Card kind="flat" title="Tetap" count={groups.flat.length} detail={groups.flat.length ? groups.flat.map(e => `${e.name} ${signed(0)}`).join(', ') : 'Tidak ada wilayah yang tetap'} />
          <K6Card kind="down" title="Turun" count={groups.down.length} detail={groups.down.length ? `Terbesar: ${groups.down.at(-1)!.name} ${signed(groups.down.at(-1)!.change)}` : 'Tidak ada wilayah yang turun'} />
        </div>
        <p className="k6-note">{K6_NOTE}. Grafik mengikuti filter cakupan ({scopeLabel.toLocaleLowerCase('id-ID')}, {entries.length} wilayah). Klik batang untuk memilih wilayah, sama seperti klik di peta; dengan keyboard, Tab ke grafik lalu ↑/↓ dan Enter.</p>
      </aside>
      <div ref={box} className="k6-chart">
        {g && <svg width={width} height={g.height} role="group" aria-label={`Diagram batang perubahan prevalensi 2019 ke 2022, ${entries.length} wilayah, diurutkan dari kenaikan terbesar`} style={{ fontSize: g.font }}>
          {g.ticks.map(t => <g key={t} aria-hidden="true">
            <line x1={g.x(t)} x2={g.x(t)} y1={g.header - 4} y2={g.plotBottom} stroke={t === 0 ? 'none' : '#e2e6eb'} />
            <text className="k6-tick" x={g.x(t)} y={g.plotBottom + 15} textAnchor="middle">{t > 0 ? `+${t}` : t < 0 ? `-${-t}` : '0'}</text>
          </g>)}
          <text className="k6-axis-title" x={g.center} y={g.plotBottom + 33} textAnchor="middle" aria-hidden="true">Perubahan 2019→2022 (pp)</text>
          <text className="k6-direction down" x={zero - 7} y={13} textAnchor="end" aria-hidden="true">{g.compact ? <><tspan x={zero - 7}>← Turun</tspan><tspan x={zero - 7} dy="1.15em">(membaik)</tspan></> : '← Turun (membaik)'}</text>
          <text className="k6-direction up" x={zero + 7} y={13} textAnchor="start" aria-hidden="true">{g.compact ? <><tspan x={zero + 7}>Naik →</tspan><tspan x={zero + 7} dy="1.15em">(memburuk)</tspan></> : 'Naik (memburuk) →'}</text>
          {entries.map((entry, index) => {
            const y = top(index)
            const mid = y + g.rowHeight / 2
            const end = g.x(entry.change)
            const active = selected === entry.code
            return <g key={entry.code} className={`k6-row ${entry.direction}${active ? ' selected' : ''}`} data-k6-bar={entry.code} data-direction={entry.direction}
              ref={node => { if (node) rows.current.set(entry.code, node); else rows.current.delete(entry.code) }}
              role="button" tabIndex={entry.code === tabbable ? 0 : -1} aria-label={k6AriaLabel(entry)} aria-pressed={active}
              onClick={() => choose(entry.code)} onKeyDown={event => moveFocus(event, index)}>
              <rect className="k6-hit" x={0} y={y + 1} width={width} height={g.rowHeight - 2} rx={4} />
              <text className="k6-name" x={g.nameWidth - 6} y={mid} dy=".35em" textAnchor="end" fontWeight={entry.direction === 'up' ? 700 : 450}>{entry.name}</text>
              {entry.direction === 'flat'
                ? <circle className="k6-mark" cx={zero} cy={mid} r={4.5} fill={FLAT} />
                : <rect className="k6-mark" x={Math.min(zero, end)} y={mid - g.barHeight / 2} width={Math.max(1, Math.abs(end - zero))} height={g.barHeight} rx={2}
                  fill={entry.direction === 'up' ? K6_UP : K6_DOWN} fillOpacity={entry.direction === 'up' ? 1 : .55} />}
              <text className="k6-value" x={entry.direction === 'down' ? end - 5 : (entry.direction === 'flat' ? zero + 4.5 : end) + 5} y={mid} dy=".35em" textAnchor={entry.direction === 'down' ? 'end' : 'start'}>{k6Value(entry.change)}</text>
            </g>
          })}
          {groups.up.length > 0 && groups.up.length < entries.length && <line className="k6-separator" x1={0} x2={width} y1={top(groups.up.length)} y2={top(groups.up.length)} stroke="#4a5563" strokeDasharray="4 3" aria-hidden="true" />}
          <line className="k6-zero" x1={zero} x2={zero} y1={g.header - 6} y2={g.plotBottom} stroke="#20242a" strokeWidth={1.6} aria-hidden="true" />
        </svg>}
      </div>
    </div>
  </section>
}

function K6Card({ kind, title, count, detail }: { kind: 'up' | 'flat' | 'down'; title: string; count: number; detail: string }) {
  return <div className={`k6-card ${kind}`} data-k6-card={kind}><h3>{title}</h3><strong>{count}</strong><span>wilayah</span><p>{detail}</p></div>
}
