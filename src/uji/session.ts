import { CONFIG, type CbqId, type DiagramId, type KpiId, type Persona } from './content'

export interface Profile { name: string; persona: Persona; age: string; literacy: number; mode: string }
export interface L3Answer { diagram: DiagramId; order: number; kpi: KpiId; cbq: CbqId; kpiOk: boolean; cbqOk: boolean; e2e: boolean; latency: number; confidence: number; lucky: boolean }
export interface TaskResult { task: string; order: number; success: boolean; gaveUp: boolean; time: number; wrongSubmits: number; clicks: number; deadClicks: number; filterChanges: number; crossfilter: boolean | null; answers: Record<string, string>; log: string }
export interface Payload {
  version: 1; id: string; startedAt: string; submittedAt: string; durationSec: number
  profile: Profile; consent: { agreed: true; at: string }
  l3: L3Answer[]; l4: TaskResult[]; sus: number[]; susScore: number; comment: string
  device: { screen: string; viewport: string; userAgent: string }
}

export type SendStatus = 'ok' | 'fail' | 'none'
// Apps Script tidak mengirim header CORS untuk POST, jadi permintaan memakai no-cors: respons tidak terbaca,
// dan "ok" berarti permintaan berhasil dikirim. Jawaban juga disimpan di localStorage sebagai cadangan.
export async function sendPayload(payload: Payload): Promise<SendStatus> {
  try { localStorage.setItem(`uji_stunting_${payload.id}`, JSON.stringify(payload)) } catch { /* penyimpanan lokal opsional */ }
  if (!CONFIG.SHEET_URL) return 'none'
  try {
    await fetch(CONFIG.SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    return 'ok'
  } catch { return 'fail' }
}

// Ringkasan satu baris per bagian untuk WhatsApp/salin manual.
export function summaryText(p: Payload) {
  const n = (value: number) => value.toFixed(1)
  return [
    `HASIL UJI DASHBOARD STUNTING ${p.id}`,
    `[PROFIL];${p.profile.name};${p.profile.persona};${p.profile.age};literasi ${p.profile.literacy};${p.profile.mode}`,
    ...p.l3.map(a => `[L3];${a.diagram};urutan ${a.order};${a.kpi};${a.cbq};E2E ${a.e2e ? 1 : 0};${n(a.latency)} s;yakin ${a.confidence}`),
    ...p.l4.map(t => `[L4];${t.task};sukses ${t.success ? 1 : 0};${n(t.time)} s;salah ${t.wrongSubmits};klik ${t.clicks};tanpa respons ${t.deadClicks};filter ${t.filterChanges};cross ${t.crossfilter ?? '-'}`),
    `[SUS];${p.sus.join(';')};skor ${p.susScore}`,
    `[META];${p.startedAt};${p.durationSec} s;${p.device.viewport}`,
  ].join('\n')
}
