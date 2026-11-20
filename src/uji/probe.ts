// Instrumentasi dashboard di dalam iframe (same-origin): klik, klik tanpa respons, perubahan filter, dan keadaan filter.
const INTERACTIVE = 'button, a, select, input, label, summary, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'

export interface DashboardState { year: string | null; region: string | null; trendArea: string | null }
export interface Probe { clicks: number; dead: number; filterChanges: number; log: string[]; seen: Set<string>; detach: () => void }

export function readState(doc: Document | null | undefined): DashboardState | null {
  if (!doc) return null
  const value = (id: string) => (doc.getElementById(id) as HTMLSelectElement | null)?.value ?? null
  return { year: value('year'), region: value('region'), trendArea: value('trend-area') }
}
export function dashboardReady(doc: Document | null | undefined) {
  return !!doc?.querySelector('.dashboard-grid [data-region]')
}

function describe(target: Element) {
  const el = target.closest(INTERACTIVE) ?? target
  const label = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent ?? el.tagName
  return label.replace(/\s+/g, ' ').trim().slice(0, 28)
}

export function attachProbe(doc: Document, start: number, limit = 60): Probe {
  const probe: Probe = { clicks: 0, dead: 0, filterChanges: 0, log: [], seen: new Set(), detach: () => {} }
  const stamp = () => ((performance.now() - start) / 1000).toFixed(1)
  const push = (entry: string) => { if (probe.log.length < limit) probe.log.push(`${stamp()}s ${entry}`) }
  const onClick = (event: Event) => {
    const target = event.target as Element | null
    if (!target?.closest) return
    probe.clicks++
    const live = target.closest(INTERACTIVE)
    if (!live) { probe.dead++; push('klik tanpa respons') } else push(`klik ${describe(target)}`)
  }
  const onChange = (event: Event) => {
    const target = event.target as HTMLSelectElement | HTMLInputElement | null
    if (!target) return
    probe.filterChanges++
    push(`${target.id || target.getAttribute('aria-label') || target.type}=${target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value}`)
  }
  doc.addEventListener('click', onClick, true)
  doc.addEventListener('change', onChange, true)
  probe.detach = () => { doc.removeEventListener('click', onClick, true); doc.removeEventListener('change', onChange, true) }
  return probe
}
