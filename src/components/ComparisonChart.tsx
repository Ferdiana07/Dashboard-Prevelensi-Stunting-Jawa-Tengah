import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Rectangle, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { category, CATEGORIES, metrics, TARGET } from '../lib/calculations'
import type { StuntingRow, Year } from '../types'
import { percent } from '../lib/format'
import { prevalenceScale } from '../lib/visualEncoding'
import { CategoryLegend, CategoryPatterns } from './visuals/Encoding'

export function ComparisonChart({ rows, all, year }: { rows: StuntingRow[]; all: StuntingRow[]; year: Year }) {
  const prefix = `bars-${useId().replace(/:/g, '')}`
  const values = metrics(rows)
  const data = [{ name: 'Kota', value: values.city }, { name: 'Kabupaten', value: values.district }].filter((item): item is { name: string; value: number } => item.value !== null)
  const { maximum, ticks } = prevalenceScale(all)
  function barShape(input: unknown) {
    const { x = 0, y = 0, width = 0, height = 0, fill, value } = input as { x?: number; y?: number; width?: number; height?: number; fill?: string; value: number }
    const kind = category(value)
    return <g data-bar-category={kind}>
      <Rectangle x={x} y={y} width={width} height={height} radius={2} fill={fill} stroke={CATEGORIES[kind].text} strokeWidth={.7} />
      {kind !== 'achieved' && <rect className="category-pattern" x={x} y={y} width={width} height={height} rx={2} fill={`url(#${prefix}-${kind})`} pointerEvents="none" aria-hidden="true" />}
    </g>
  }
  return <section className="panel comparison-panel" aria-labelledby="comparison-title">
    <h2 id="comparison-title">Rata-rata Prevalensi: Kota vs Kabupaten <span>({year})</span></h2>
    <div className="bar-chart" role="img" aria-label={data.map(item => `${item.name} ${percent(item.value)}`).join(', ') + '. Target 14%.'}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 17, right: 55, bottom: 3, left: 0 }} barSize={20}>
          <CategoryPatterns prefix={prefix} />
          <CartesianGrid horizontal={false} stroke="#e2e6eb" />
          <XAxis type="number" domain={[0, maximum]} ticks={ticks} tickFormatter={value => `${value}%`} height={34} tickLine={false} axisLine={{ stroke: '#7c8794' }} tick={{ fill: '#455363', fontSize: 10 }} label={{ value: 'Prevalensi (%)', position: 'insideBottom', offset: -1, fill: '#455363', fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={96} interval={0} axisLine={false} tickLine={false} tick={{ fill: '#171a20', fontSize: 13 }} />
          <Tooltip cursor={{ fill: '#f4f5f7' }} formatter={value => [percent(Number(value)), 'Rata-rata']} contentStyle={{ borderRadius: 10, border: '1px solid #dce0e5', fontSize: 13 }} />
          <Bar dataKey="value" shape={barShape} isAnimationActive={false}>
            {data.map(item => <Cell key={item.name} fill={CATEGORIES[category(item.value)].color} />)}
            <LabelList dataKey="value" position="right" formatter={value => percent(Number(value))} fill="#171a20" fontSize={16} fontWeight={750} />
          </Bar>
          <ReferenceLine x={TARGET} stroke="#20242a" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: '14%', position: 'top', fill: '#24272d', fontSize: 11, fontWeight: 650 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <CategoryLegend className="compact-legend comparison-legend" />
    {data.length < 2 && <p className="scope-note">Cakupan hanya berisi {data[0]?.name.toLowerCase() ?? 'nol wilayah'}; perbandingan dua kelompok tidak tersedia.</p>}
  </section>
}
