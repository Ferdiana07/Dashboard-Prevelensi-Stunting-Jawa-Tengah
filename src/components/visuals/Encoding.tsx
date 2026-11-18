import type { SVGProps } from 'react'
import { CATEGORIES, type category } from '../../lib/calculations'
import type { SeriesShape } from '../../lib/visualEncoding'

export type Category = ReturnType<typeof category>

export function CategoryPatterns({ prefix }: { prefix: string }) {
  return <defs>
    <pattern id={`${prefix}-moderate`} width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r=".85" fill="#735600" fillOpacity=".43" />
    </pattern>
    <pattern id={`${prefix}-high`} width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M-2 2L2-2M0 9L9 0M7 11L11 7" stroke="#78161b" strokeOpacity=".35" strokeWidth="1" />
    </pattern>
  </defs>
}

export function CategorySwatch({ kind }: { kind: Category }) {
  return <svg className="legend-swatch" viewBox="0 0 24 18" aria-hidden="true" data-category-swatch={kind}>
    <rect x=".5" y=".5" width="23" height="17" rx="3" fill={CATEGORIES[kind].color} stroke={CATEGORIES[kind].text} strokeWidth=".7" />
    {kind === 'moderate' && [5, 12, 19].flatMap(x => [5, 12].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r=".8" fill="#735600" fillOpacity=".55" />))}
    {kind === 'high' && <path d="M1 8L8 1M2 16L17 1M10 17L23 4M18 17L23 12" stroke="#78161b" strokeOpacity=".5" strokeWidth="1" />}
  </svg>
}

export function CategoryLegend({ counts, className = '' }: { counts?: Record<Category, number>; className?: string }) {
  return <div className={`category-legend ${className}`} aria-label="Kategori prevalensi">
    {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([kind, info]) => <div key={kind}>
      <CategorySwatch kind={kind} /><span>{info.range}{counts && <> <span className="legend-count">({counts[kind]} wilayah)</span></>}</span>
    </div>)}
  </div>
}

type SymbolProps = SVGProps<SVGElement> & { shape: SeriesShape; cx: number; cy: number; radius?: number }
export function SeriesSymbol({ shape, cx, cy, radius = 4.7, ...props }: SymbolProps) {
  if (shape === 'circle') return <circle {...props as SVGProps<SVGCircleElement>} cx={cx} cy={cy} r={radius} />
  const r = radius
  const d = shape === 'square' ? `M${cx-r},${cy-r}h${2*r}v${2*r}h${-2*r}Z`
    : shape === 'diamond' ? `M${cx},${cy-r*1.35}l${r*1.15},${r*1.35}l${-r*1.15},${r*1.35}l${-r*1.15},${-r*1.35}Z`
    : shape === 'triangle' ? `M${cx},${cy-r*1.35}l${r*1.3},${r*2.3}h${-r*2.6}Z`
    : `M${cx-r*.45},${cy-r*1.3}h${r*.9}v${r*.85}h${r*.85}v${r*.9}h${-r*.85}v${r*.85}h${-r*.9}v${-r*.85}h${-r*.85}v${-r*.9}h${r*.85}Z`
  return <path {...props as SVGProps<SVGPathElement>} d={d} />
}
