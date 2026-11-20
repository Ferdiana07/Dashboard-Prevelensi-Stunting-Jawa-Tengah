import { roundHalfAway } from '../lib/format'
import { STATIC_TASKS, type Field } from './content'

// Skor SUS standar (Brooke, 1996): butir ganjil (nilai − 1), butir genap (5 − nilai), jumlah × 2,5.
export function susScore(values: number[]) {
  if (values.length !== 10 || values.some(value => !Number.isInteger(value) || value < 1 || value > 5)) return null
  return values.reduce((sum, value, index) => sum + (index % 2 === 0 ? value - 1 : 5 - value), 0) * 2.5
}
// Skala kurva Sauro–Lewis; target lembar tugas ≥ 75 berada di grade B.
export function susGrade(score: number) {
  if (score >= 80.3) return { grade: 'A', label: 'Sangat baik' }
  if (score >= 74) return { grade: 'B', label: 'Baik' }
  if (score >= 68) return { grade: 'C', label: 'Cukup' }
  if (score >= 51) return { grade: 'D', label: 'Kurang' }
  return { grade: 'F', label: 'Buruk' }
}

// Menerima "21,7", "21.7", atau "21,7 %".
export function parseNumber(text: string) {
  const clean = text.replace('%', '').trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null
  return Number(clean)
}
// Angka dianggap benar bila sama dengan nilai satu desimal yang ditampilkan dashboard (toleransi pembulatan 0,05).
export function fieldCorrect(field: Field, value: string) {
  if (field.type === 'select') return value === field.answer
  const parsed = parseNumber(value)
  return parsed !== null && Math.abs(parsed - roundHalfAway(field.answer, 1)) <= 0.051
}

export function tasksFor(persona: 'A' | 'B') { return STATIC_TASKS.filter(task => task.persona === persona) }

export function shuffle<T>(items: T[], random = Math.random) {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1));[copy[i], copy[j]] = [copy[j], copy[i]] }
  return copy
}
// Kode responden pendek tanpa huruf yang mudah tertukar (O/0, I/1).
export function respondentId(persona: 'A' | 'B', random = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `${persona}-${Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('')}`
}
export const cleanText = (text: string, max = 300) => text.replace(/[\t\r\n;|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
