import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { category, CATEGORIES, metrics, TARGET } from '../lib/calculations'
import { percent } from '../lib/format'
import type { StuntingRow, Year } from '../types'

export function ComparisonChart({ rows, year }: { rows: StuntingRow[]; year: Year }) {
  const values = metrics(rows)
  const data = [{ name: 'Kota', value: values.city }, { name: 'Kabupaten', value: values.district }].filter((item): item is { name: string; value: number } => item.value !== null)
  const maximum = Math.max(30, Math.ceil(Math.max(...data.map(item => item.value), TARGET) / 5) * 5 + 5)
  return <section className="panel comparison-panel" aria-labelledby="comparison-title">
    <h2 id="comparison-title">Rata-rata Prevalensi: Kota vs Kabupaten <span>({year})</span></h2>
    <div className="bar-chart" role="img" aria-label={data.map(item => `${item.name} ${percent(item.value)}`).join(', ') + '. Target 14%.'}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 24, right: 65, bottom: 4, left: 0 }} barSize={26}>
          <XAxis type="number" domain={[0, maximum]} hide /><YAxis type="category" dataKey="name" width={102} interval={0} axisLine={false} tickLine={false} tick={{ fill: '#171a20', fontSize: 15 }} />
          <Tooltip cursor={{ fill: '#f4f5f7' }} formatter={value => [percent(Number(value)), 'Rata-rata']} contentStyle={{ borderRadius: 10, border: '1px solid #dce0e5', fontSize: 13 }} />
          <Bar dataKey="value" radius={8} background={{ fill: '#f0f0f1', radius: 8 }} isAnimationActive={false}>
            {data.map(item => <Cell key={item.name} fill={CATEGORIES[category(item.value)].color} />)}
            <LabelList dataKey="value" position="right" formatter={value => percent(Number(value))} fill="#171a20" fontSize={20} fontWeight={750} />
          </Bar>
          <ReferenceLine x={TARGET} stroke="#20242a" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: 'Target 14%', position: 'top', fill: '#24272d', fontSize: 12, fontWeight: 650 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    {data.length < 2 && <p className="scope-note">Cakupan hanya berisi {data[0]?.name.toLowerCase() ?? 'nol wilayah'}; perbandingan dua kelompok tidak tersedia.</p>}
  </section>
}
