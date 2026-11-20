import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronUp, ClipboardCopy, Clock, Download, EyeOff, Flag, Map as MapIcon, MessageCircle, MousePointerClick, Printer, RotateCcw, Send, ShieldCheck, Smile, Timer, UserRound, UsersRound, X } from 'lucide-react'
import { CBQ, CONFIDENCE, CONFIG, CONSENT_POINTS, DIAGRAMS, KPI, PERSONAS, STUDY, SUS_ITEMS, type CbqId, type Diagram, type Field, type KpiId, type Persona, type Task } from './content'
import { attachProbe, dashboardReady, readState, type Probe } from './probe'
import { cleanText, fieldCorrect, respondentId, shuffle, susGrade, susScore, tasksFor } from './scoring'
import { sendPayload, summaryText, type L3Answer, type Payload, type Profile, type SendStatus, type TaskResult } from './session'

type Screen = 'welcome' | 'profile' | 'consent' | 'l3intro' | 'l3' | 'l4intro' | 'task' | 'sus' | 'finish' | 'done'
const STEPS = [
  { title: 'Profil', note: 'Kenalan dan pilih persona' },
  { title: 'Persetujuan', note: 'Kesediaan sukarela' },
  { title: 'Tebak Diagram', note: '3 diagram tanpa judul' },
  { title: 'Misi Dashboard', note: '2 tugas interaktif' },
  { title: 'Kesan', note: '10 pernyataan singkat' },
]
const STEP_OF: Record<Screen, number> = { welcome: -1, profile: 0, consent: 1, l3intro: 2, l3: 2, l4intro: 3, task: 3, sus: 4, finish: 4, done: 5 }
const LITERACY = ['Hampir tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Hampir setiap hari']
const AGREEMENT = ['Sangat tidak setuju', 'Tidak setuju', 'Netral', 'Setuju', 'Sangat setuju']
const AGES = ['< 20', '20–29', '30–39', '40–49', '≥ 50']
const LETTERS = ['A', 'B', 'C']
const BASE = import.meta.env.BASE_URL
const params = new URLSearchParams(window.location.search)
const presetPersona = params.get('persona')?.toUpperCase() === 'A' ? 'A' : params.get('persona')?.toUpperCase() === 'B' ? 'B' : null
const seconds = (value: number) => `${value.toFixed(1).replace('.', ',')} s`

interface Session { id: string; startedAt: string; t0: number; profile: Profile; consentAt: string; order: Diagram[]; l3: L3Answer[]; l4: TaskResult[]; sus: number[]; comment: string }

export default function UjiApp() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [session, setSession] = useState<Session | null>(null)
  const [l3Index, setL3Index] = useState(0)
  const [taskIndex, setTaskIndex] = useState(0)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [status, setStatus] = useState<SendStatus | 'sending'>('sending')

  useEffect(() => {
    // Gambar stimulus dimuat lebih dulu supaya Decode Latency tidak ikut menghitung waktu unduh.
    for (const diagram of DIAGRAMS) { const img = new Image(); img.src = diagram.img }
  }, [])
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (session && screen !== 'done') event.preventDefault() }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [session, screen])
  useEffect(() => { if (screen !== 'task') window.scrollTo(0, 0) }, [screen, l3Index])

  const update = (patch: Partial<Session>) => setSession(current => current && { ...current, ...patch })
  const tasks = session ? tasksFor(session.profile.persona) : []

  async function submit(comment: string) {
    if (!session) return
    const finished: Session = { ...session, comment }
    const p: Payload = {
      version: 1, id: finished.id, startedAt: finished.startedAt, submittedAt: new Date().toISOString(),
      durationSec: Math.round((performance.now() - finished.t0) / 1000), profile: finished.profile,
      consent: { agreed: true, at: finished.consentAt },
      l3: finished.l3, l4: finished.l4, sus: finished.sus, susScore: susScore(finished.sus) ?? 0, comment: cleanText(comment),
      device: { screen: `${window.screen.width}x${window.screen.height}`, viewport: `${window.innerWidth}x${window.innerHeight}`, userAgent: navigator.userAgent.slice(0, 160) },
    }
    setSession(finished); setPayload(p); setStatus('sending'); setScreen('done')
    setStatus(await sendPayload(p))
  }

  if (screen === 'task' && session) {
    const task = tasks[taskIndex]
    return <TaskRunner key={task.id} task={task} index={taskIndex} total={tasks.length} onDone={result => {
      update({ l4: [...session.l4, result] })
      if (taskIndex + 1 < tasks.length) setTaskIndex(taskIndex + 1)
      else setScreen('sus')
    }} />
  }
  return <div className="app">
    <Rail current={STEP_OF[screen]} session={session} />
    <main className="stage">
      <div className="stage-inner">
        {screen === 'welcome' && <Welcome onStart={() => setScreen('profile')} />}
        {screen === 'profile' && <ProfileForm initial={session?.profile} onNext={profile => {
          const id = session?.profile.persona === profile.persona ? session.id : respondentId(profile.persona)
          setSession(current => current ? { ...current, id, profile } : { id, profile, startedAt: new Date().toISOString(), t0: performance.now(), consentAt: '', order: shuffle(DIAGRAMS), l3: [], l4: [], sus: [], comment: '' })
          setScreen('consent')
        }} />}
        {screen === 'consent' && session && <Consent profile={session.profile} onBack={() => setScreen('profile')} onNext={() => { update({ consentAt: new Date().toISOString() }); setScreen('l3intro') }} />}
        {screen === 'l3intro' && <L3Intro onNext={() => { setL3Index(0); setScreen('l3') }} />}
        {screen === 'l3' && session && <L3Item key={l3Index} diagram={session.order[l3Index]} index={l3Index} persona={session.profile.persona} onDone={answer => {
          update({ l3: [...session.l3, answer] })
          if (l3Index < 2) setL3Index(l3Index + 1)
          else setScreen('l4intro')
        }} />}
        {screen === 'l4intro' && session && <L4Intro tasks={tasks} onNext={() => { setTaskIndex(0); setScreen('task') }} />}
        {screen === 'sus' && <Sus onNext={sus => { update({ sus }); setScreen('finish') }} />}
        {screen === 'finish' && <Finish onSend={submit} />}
        {screen === 'done' && payload && <Done payload={payload} status={status} />}
      </div>
    </main>
    {session?.consentAt && <ConsentPrint session={session} />}
  </div>
}

// Panel samping: identitas uji, tahapan vertikal, dan kode sesi. Pada layar sempit menjadi pita di atas.
function Rail({ current, session }: { current: number; session: Session | null }) {
  const progress = Math.max(0, Math.min(current, STEPS.length)) / STEPS.length
  return <aside className="rail">
    <div className="rail-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><div><strong>Uji Dashboard Stunting</strong><span>Jawa Tengah · 2019–2022</span></div></div>
    <ol className="rail-steps" aria-label="Tahapan uji">{STEPS.map((step, i) => <li key={step.title} className={i < current ? 'done' : i === current ? 'on' : ''} aria-current={i === current ? 'step' : undefined}>
      <span className="rs-dot">{i < current ? <Check size={13} strokeWidth={3} /> : i + 1}</span><span className="rs-text"><b>{step.title}</b><small>{step.note}</small></span>
    </li>)}</ol>
    <div className="rail-progress" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
    <div className="rail-foot">
      {session && <span className="id-chip"><UserRound size={14} />{session.id} · {PERSONAS[session.profile.persona].short}</span>}
      <small>{STUDY.group}</small>
    </div>
  </aside>
}

function Welcome({ onStart }: { onStart: () => void }) {
  const narrow = window.innerWidth < CONFIG.MIN_WIDTH
  const stops = [
    { icon: <EyeOff size={18} />, title: 'Tebak diagram', note: 'Tiga gambar tanpa judul. Tebak informasi dan pertanyaan yang dijawabnya.', time: '± 3 menit' },
    { icon: <MapIcon size={18} />, title: 'Misi dashboard', note: 'Dua tugas singkat pada dashboard sungguhan, dengan stopwatch.', time: '± 5 menit' },
    { icon: <Smile size={18} />, title: 'Kesan Anda', note: 'Sepuluh pernyataan tentang kemudahan memakai dashboard.', time: '± 2 menit' },
  ]
  return <section className="welcome">
    <h1>Bantu kami menguji dashboard stunting Jawa Tengah</h1>
    <p className="lead">Yang diuji adalah <b>dashboard</b>, bukan Anda. Tidak ada jawaban yang memalukan; kebingungan Anda justru menunjukkan bagian yang perlu kami perbaiki.</p>
    <ol className="route">{stops.map((stop, i) => <li key={stop.title}>
      <span className="route-icon">{stop.icon}</span>
      <div><span className="route-no">Bagian {i + 1}</span><b>{stop.title}</b><p>{stop.note}</p></div>
      <span className="route-time"><Clock size={13} />{stop.time}</span>
    </li>)}</ol>
    {narrow && <p className="note warn">Anda memakai layar kecil. Uji tetap bisa dikerjakan di HP; diagram lebar dapat digeser ke samping. Laptop tetap lebih nyaman bila tersedia.</p>}
    <div className="before">
      <b>Sebelum mulai</b>
      <ul><li>Gunakan laptop/komputer dengan zoom peramban 100%.</li><li>Kerjakan sendiri dalam sekali duduk, tanpa mencari jawaban di internet.</li><li>Jangan menutup atau memuat ulang halaman sampai selesai.</li></ul>
    </div>
    <button className="pri big" onClick={onStart}>Mulai uji <ArrowRight size={18} /></button>
  </section>
}

function Heading({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return <header className="heading">{kicker && <span className="kicker">{kicker}</span>}<h2>{title}</h2>{children && <p>{children}</p>}</header>
}

function ProfileForm({ initial, onNext }: { initial?: Profile; onNext: (profile: Profile) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [persona, setPersona] = useState<Persona | null>(initial?.persona ?? presetPersona)
  const [age, setAge] = useState(initial?.age ?? '')
  const [literacy, setLiteracy] = useState(initial?.literacy ?? 0)
  const [msg, setMsg] = useState('')
  const mode = params.get('mode')?.toLowerCase() === 'mandiri' ? 'Mandiri (daring)' : 'Tatap muka 1-on-1'
  function next() {
    const clean = cleanText(name, 60)
    if (clean.length < 2) return setMsg('Isi nama lengkap Anda.')
    if (!persona) return setMsg('Pilih kelompok yang paling menggambarkan Anda.')
    if (!age) return setMsg('Pilih kelompok usia.')
    if (!literacy) return setMsg('Pilih seberapa sering Anda membaca grafik atau dashboard.')
    onNext({ name: clean, persona, age, literacy, mode })
  }
  return <section className="panel">
    <Heading kicker="Langkah 1" title="Kenalan dulu">Data ini dipakai untuk membandingkan hasil antarkelompok pengguna. Nama tidak dicantumkan dalam laporan.</Heading>
    <div className="grid2">
      <label className="fld"><span>Nama lengkap</span><input value={name} onChange={e => setName(e.target.value)} maxLength={60} autoComplete="name" /></label>
      <label className="fld"><span>Usia</span><select value={age} onChange={e => setAge(e.target.value)}><option value="">— pilih —</option>{AGES.map(a => <option key={a}>{a}</option>)}</select></label>
    </div>
    <fieldset className="fld"><legend>Saya paling cocok digambarkan sebagai…</legend>
      <div className="persona-grid">{(['A', 'B'] as const).map(key => {
        const p = PERSONAS[key]
        const locked = presetPersona !== null && presetPersona !== key
        return <label key={key} className={`persona persona-${key} ${persona === key ? 'on' : ''} ${locked ? 'locked' : ''}`}>
          <input type="radio" name="persona" checked={persona === key} disabled={locked} onChange={() => setPersona(key)} />
          <span className="p-icon">{key === 'A' ? <UsersRound size={20} /> : <UserRound size={20} />}</span>
          <span className="p-body"><span className="p-tag">Persona {key}</span><b>{p.title}</b><small>{p.who}</small></span>
        </label>
      })}</div>
      {presetPersona && <p className="hint">Persona sudah ditetapkan melalui tautan.</p>}
    </fieldset>
    <fieldset className="fld"><legend>Seberapa sering Anda membaca grafik atau dashboard data?</legend>
      <div className="scale">{LITERACY.map((label, i) => <label key={label} className={literacy === i + 1 ? 'on' : ''}><input type="radio" name="lit" checked={literacy === i + 1} onChange={() => setLiteracy(i + 1)} /><b>{i + 1}</b><small>{label}</small></label>)}</div>
    </fieldset>
    <p className="msg" role="alert">{msg}</p>
    <div className="actions"><button className="pri" onClick={next}>Lanjut <ArrowRight size={17} /></button></div>
  </section>
}

function Consent({ profile, onBack, onNext }: { profile: Profile; onBack: () => void; onNext: () => void }) {
  const [checks, setChecks] = useState(CONSENT_POINTS.map(() => false))
  const [msg, setMsg] = useState('')
  const all = checks.every(Boolean)
  return <section className="panel">
    <Heading kicker="Langkah 2" title="Pernyataan kesediaan sukarela">Mohon dibaca. Salinannya dapat dicetak atau disimpan sebagai PDF di akhir sesi.</Heading>
    <div className="consent-letter">
      <ShieldCheck size={22} className="consent-seal" />
      <p>Saya, <b>{profile.name}</b>, responden <b>Persona {profile.persona} · {PERSONAS[profile.persona].title}</b>, menyatakan bahwa:</p>
      <div className="checks">{CONSENT_POINTS.map((point, i) => <label key={i} className={checks[i] ? 'on' : ''}><input type="checkbox" checked={checks[i]} onChange={e => setChecks(checks.map((v, j) => j === i ? e.target.checked : v))} /><span>{point}</span></label>)}</div>
      <button className="link-button" onClick={() => setChecks(CONSENT_POINTS.map(() => !all))}>{all ? 'Batalkan semua' : 'Centang semua'}</button>
    </div>
    <p className="msg" role="alert">{msg}</p>
    <div className="actions"><button onClick={onBack}><ArrowLeft size={16} /> Kembali</button><button className="pri" onClick={() => all ? onNext() : setMsg('Centang semua pernyataan untuk melanjutkan. Jika tidak bersedia, Anda boleh menutup halaman ini.')}>Saya bersedia <ArrowRight size={17} /></button></div>
  </section>
}

function L3Intro({ onNext }: { onNext: () => void }) {
  return <section className="panel">
    <Heading kicker="Bagian 1" title="Tebak makna diagram tanpa judul">Anda akan melihat 3 diagram dari dashboard, satu per satu dalam urutan acak. Judul, nama indikator, dan keterangan sengaja disembunyikan.</Heading>
    <div className="steps3">
      <div><span>1</span><b>Pilih informasi</b><small>Apa yang ditampilkan diagram (KPI)?</small></div>
      <div><span>2</span><b>Pilih pertanyaan</b><small>Pertanyaan apa yang bisa dijawabnya (CBQ)?</small></div>
      <div><span>3</span><b>Kunci & nilai yakin</b><small>Seberapa yakin Anda, 1–5?</small></div>
    </div>
    <p className="note"><Clock size={16} /><span>Waktu baca dihitung sejak gambar muncul sampai Anda menekan <b>Kunci jawaban</b>. Jawab spontan; menebak boleh.</span></p>
    <div className="actions"><button className="pri" onClick={onNext}>Saya siap <ArrowRight size={17} /></button></div>
  </section>
}

function L3Item({ diagram, index, persona, onDone }: { diagram: Diagram; index: number; persona: Persona; onDone: (answer: L3Answer) => void }) {
  const [phase, setPhase] = useState<'ready' | 'count' | 'show' | 'conf'>('ready')
  const [count, setCount] = useState(3)
  const [kpi, setKpi] = useState<KpiId | null>(null)
  const [cbq, setCbq] = useState<CbqId | null>(null)
  const [latency, setLatency] = useState(0)
  const [kpiOrder] = useState(() => shuffle(Object.keys(KPI) as KpiId[]))
  const [cbqOrder] = useState(() => shuffle(Object.keys(CBQ) as CbqId[]))
  const t0 = useRef(0)
  const wide = diagram.width / diagram.height > 2
  useEffect(() => {
    if (phase !== 'count') return
    const timer = window.setTimeout(() => { if (count > 1) setCount(count - 1); else { t0.current = performance.now(); setPhase('show') } }, 550)
    return () => window.clearTimeout(timer)
  }, [phase, count])
  function lock() { setLatency((performance.now() - t0.current) / 1000); setPhase('conf') }
  function confirm(confidence: number) {
    const kpiOk = kpi === diagram.key.kpi, cbqOk = cbq === diagram.key.cbq
    onDone({ diagram: diagram.id, order: index + 1, kpi: kpi!, cbq: cbq!, kpiOk, cbqOk, e2e: kpiOk && cbqOk, latency, confidence, lucky: kpiOk && cbqOk && confidence <= 2 })
  }
  const track = <div className="l3-track"><span>Diagram {index + 1} / 3</span><span className="segs">{[0, 1, 2].map(i => <i key={i} className={i < index ? 'done' : i === index ? 'on' : ''} />)}</span></div>
  if (phase === 'ready') return <section className="panel focus">{track}<div className="veil" aria-hidden="true"><EyeOff size={30} /></div><h2>Siap melihat diagram berikutnya?</h2><p className="sub">Gambar muncul setelah hitung mundur singkat, dan waktu baca mulai berjalan.</p><button className="pri big" onClick={() => setPhase('count')}>Tampilkan diagram</button></section>
  if (phase === 'count') return <section className="panel focus countdown">{track}<span key={count} className="count">{count}</span></section>
  if (phase === 'conf') return <section className="panel focus">{track}<h2>Seberapa yakin dengan jawaban tadi?</h2><p className="sub">Jawaban sudah terkunci.</p>
    <div className="confidence" role="group" aria-label="Tingkat keyakinan">{CONFIDENCE.map((label, i) => <button key={label} onClick={() => confirm(i + 1)} className={`c${i + 1}`}><b>{i + 1}</b><small>{label}</small></button>)}</div></section>
  return <section className={`l3 ${wide ? 'wide' : 'tall'}`}>
    {track}
    <div className="l3-body">
      <figure className="stimulus"><div className="stim-scroll"><img src={diagram.img} width={diagram.width} height={diagram.height} alt="Diagram uji tanpa judul" onLoad={() => { t0.current = performance.now() }} /></div><figcaption><EyeOff size={13} /> Judul dan keterangan disembunyikan{wide && <span className="swipe-hint"> · geser gambar ke samping</span>}</figcaption></figure>
      <div className="l3-side">
        <p className="question">{diagram.question[persona]}</p>
        <div className="choices">
          <fieldset className="choice"><legend>Informasi (KPI) yang ditampilkan</legend>{kpiOrder.map((key, i) => <label key={key} className={kpi === key ? 'on' : ''}><input type="radio" name="kpi" checked={kpi === key} onChange={() => setKpi(key)} /><span className="letter">{LETTERS[i]}</span><span><b>{KPI[key].tag}</b>{KPI[key].text}</span></label>)}</fieldset>
          <fieldset className="choice"><legend>Pertanyaan (CBQ) yang dijawab</legend>{cbqOrder.map((key, i) => <label key={key} className={cbq === key ? 'on' : ''}><input type="radio" name="cbq" checked={cbq === key} onChange={() => setCbq(key)} /><span className="letter">{i + 1}</span><span><b>{CBQ[key].tag}</b>{CBQ[key].text}</span></label>)}</fieldset>
        </div>
        <button className="pri lock" disabled={!kpi || !cbq} onClick={lock}><Check size={17} /> Kunci jawaban</button>
      </div>
    </div>
  </section>
}

function L4Intro({ tasks, onNext }: { tasks: Task[]; onNext: () => void }) {
  return <section className="panel">
    <Heading kicker="Bagian 2" title="Misi pada dashboard sungguhan">Peta, grafik, tabel, dan filter di kanan atas dashboard bisa diklik. Penguji tidak akan membantu selama misi berjalan.</Heading>
    <ol className="missions">{tasks.map((task, i) => <li key={task.id}><span className="m-no">{String(i + 1).padStart(2, '0')}</span><div><b>{task.title}</b><small>{task.goal}</small></div></li>)}</ol>
    <div className="dock-demo" aria-hidden="true"><span className="dd-timer"><Timer size={14} />0,0 s</span><span className="dd-text">Skenario misi selalu tampil di dok bawah layar</span><span className="dd-btn"><Flag size={13} />Jawab</span></div>
    <ul className="plain"><li>Tekan <b>Mulai misi</b>; stopwatch berjalan setelah dashboard dimuat.</li><li>Setelah menemukan jawabannya, tekan <b>Jawab</b> di dok bawah dan isi laci jawaban.</li><li>Jika belum tepat, tutup laci dan coba lagi; <b>Saya menyerah</b> tersedia bila buntu.</li></ul>
    <div className="actions"><button className="pri" onClick={onNext}>Lanjut ke misi pertama <ArrowRight size={17} /></button></div>
  </section>
}

function TaskRunner({ task, index, total, onDone }: { task: Task; index: number; total: number; onDone: (result: TaskResult) => void }) {
  const [phase, setPhase] = useState<'pre' | 'loading' | 'run'>('pre')
  const [elapsed, setElapsed] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [brief, setBrief] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const frame = useRef<HTMLIFrameElement>(null)
  const start = useRef(0)
  const probe = useRef<Probe | null>(null)
  const wrong = useRef(0)
  const crossSeen = useRef(false)
  const target = task.target
  const fields: Field[] = task.fields
  const text = task.text

  useEffect(() => () => probe.current?.detach(), [])
  useEffect(() => {
    if (phase !== 'run') return
    const tick = window.setInterval(() => {
      setElapsed((performance.now() - start.current) / 1000)
      const state = readState(frame.current?.contentDocument)
      if (target && state && (state.region === target || state.trendArea === target)) crossSeen.current = true
    }, 100)
    return () => window.clearInterval(tick)
  }, [phase, target])

  function loaded() {
    let tries = 0
    const wait = window.setInterval(() => {
      const doc = frame.current?.contentDocument
      if (dashboardReady(doc) || ++tries > 150) {
        window.clearInterval(wait)
        start.current = performance.now()
        if (doc) probe.current = attachProbe(doc, start.current)
        setPhase('run')
      }
    }, 100)
  }
  function finish(success: boolean) {
    const p = probe.current
    p?.detach()
    onDone({ task: task.id, order: index + 1, success, gaveUp: !success, time: (performance.now() - start.current) / 1000, wrongSubmits: wrong.current,
      clicks: p?.clicks ?? 0, deadClicks: p?.dead ?? 0, filterChanges: p?.filterChanges ?? 0,
      crossfilter: task.check === 'crossfilter' ? crossSeen.current : null,
      answers: Object.fromEntries(fields.map(f => [f.key, cleanText(values[f.key] ?? '', 40)])), log: (p?.log ?? []).join(' | ').slice(0, 2000) })
  }
  function send() {
    if (fields.some(f => !(values[f.key] ?? '').trim())) return setMsg('Lengkapi semua isian dulu.')
    // Jawaban dinilai dari isian saja; posisi filter dashboard saat menjawab tidak dipersyaratkan.
    if (fields.every(f => fieldCorrect(f, values[f.key]))) return finish(true)
    wrong.current++
    setMsg('Jawaban belum tepat. Periksa lagi di dashboard, atau tekan “Saya menyerah”.')
  }
  function giveUp() { finish(false) }

  return <div className="task-screen">
    <div className="task-body">
      {phase !== 'pre' && <iframe ref={frame} src={`${BASE}?uji=${task.id}`} title="Dashboard Prioritas Stunting Jawa Tengah" onLoad={loaded} />}
      {phase === 'pre' && <div className="mission-intro"><div className="mission-card">
        <div className="mc-head"><span className="m-no">{String(index + 1).padStart(2, '0')}</span><div><span className="kicker">Misi {index + 1} dari {total} · {PERSONAS[task.persona].title}</span><h2>{task.title}</h2></div></div>
        <p className="scenario">{text}</p>
        <p className="hint"><MousePointerClick size={15} /><span>Stopwatch mulai setelah dashboard selesai dimuat.</span></p>
        <button className="pri big" onClick={() => setPhase('loading')}>Mulai misi <ArrowRight size={18} /></button>
      </div></div>}
      {phase === 'loading' && <div className="task-loading"><span className="spinner" />Memuat dashboard…</div>}
      {sheet && <div className="sheet" role="dialog" aria-labelledby="sheet-title">
        <div className="sheet-head"><h3 id="sheet-title">Jawaban misi {index + 1}</h3><button className="icon" aria-label="Tutup laci jawaban" onClick={() => setSheet(false)}><X size={18} /></button></div>
        <div className="sheet-fields">{fields.map(f => <label key={f.key} className="fld"><span>{f.label}</span>{f.type === 'select'
          ? <select value={values[f.key] ?? ''} onChange={e => setValues({ ...values, [f.key]: e.target.value })}><option value="">— pilih —</option>{f.options.map(o => <option key={o}>{o}</option>)}</select>
          : <span className="unit-input"><input inputMode="decimal" placeholder="contoh: 18,5" value={values[f.key] ?? ''} onChange={e => setValues({ ...values, [f.key]: e.target.value })} /><i>{f.unit}</i></span>}</label>)}</div>
        <p className="msg" role="alert">{msg}</p>
        <div className="sheet-actions"><button className="ghost danger" onClick={giveUp}>Saya menyerah</button><button className="pri" onClick={send}><Send size={16} /> Kirim jawaban</button></div>
      </div>}
    </div>
    <div className="dock">
      <span className="dock-no">{task.id}</span>
      <button type="button" className={`dock-text ${brief ? 'open' : ''}`} aria-expanded={brief} onClick={() => setBrief(!brief)}><span>{text}</span><small>{brief ? 'Ringkas' : 'Baca skenario lengkap'}</small></button>
      <span className={`timer ${phase === 'run' ? 'live' : ''}`}><Timer size={16} />{seconds(elapsed)}</span>
      <button className="pri dock-answer" disabled={phase !== 'run'} onClick={() => { setMsg(''); setSheet(!sheet) }}>{sheet ? <ChevronUp size={16} className="flip" /> : <Flag size={16} />} Jawab</button>
    </div>
  </div>
}

// SUS satu pernyataan per layar; angka 1–5 pada keyboard langsung menjawab dan maju ke pernyataan berikutnya.
function Sus({ onNext }: { onNext: (values: number[]) => void }) {
  const [values, setValues] = useState<number[]>(Array(10).fill(0))
  const [at, setAt] = useState(0)
  const done = values.every(Boolean)
  const choose = (n: number) => {
    setValues(current => current.map((v, j) => j === at ? n : v))
    if (at < 9) setAt(at + 1)
  }
  const chooseRef = useRef(choose)
  useEffect(() => { chooseRef.current = choose })
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (/^[1-5]$/.test(event.key)) chooseRef.current(Number(event.key)) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  return <section className="panel sus">
    <Heading kicker="Bagian 3" title="Bagaimana kesan Anda?">Pilih tingkat persetujuan Anda. Bisa juga menekan angka 1–5 pada keyboard.</Heading>
    <div className="sus-dots" aria-label="Nomor pernyataan">{values.map((v, i) => <button key={i} aria-current={i === at ? 'step' : undefined} className={`${v ? 'answered' : ''} ${i === at ? 'on' : ''}`} onClick={() => setAt(i)} aria-label={`Pernyataan ${i + 1}${v ? `, dijawab ${v}` : ''}`}>{i + 1}</button>)}</div>
    <div className="sus-card" key={at}>
      <span className="sus-count">Pernyataan {at + 1} dari 10</span>
      <p className="sus-statement">{SUS_ITEMS[at]}</p>
      <div className="agree" role="radiogroup" aria-label={`Pernyataan ${at + 1}`}>{AGREEMENT.map((label, i) => <button key={label} role="radio" aria-checked={values[at] === i + 1} className={values[at] === i + 1 ? 'on' : ''} onClick={() => choose(i + 1)}><b>{i + 1}</b><small>{label}</small></button>)}</div>
    </div>
    <div className="actions spread">
      <button disabled={at === 0} onClick={() => setAt(at - 1)}><ArrowLeft size={16} /> Sebelumnya</button>
      {done ? <button className="pri" onClick={() => onNext(values)}>Selesai, lanjut <ArrowRight size={17} /></button> : <span className="hint">{values.filter(Boolean).length}/10 terjawab</span>}
    </div>
  </section>
}

function Finish({ onSend }: { onSend: (comment: string) => void }) {
  const [comment, setComment] = useState('')
  return <section className="panel">
    <Heading kicker="Terakhir" title="Ada catatan untuk kami?" />
    <label className="fld"><span>Bagian dashboard mana yang paling membingungkan, dan apa saran Anda? <small className="hint">(boleh kosong)</small></span><textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} maxLength={300} /></label>
    <div className="actions"><button className="pri big" onClick={() => onSend(comment)}><Send size={18} /> Kirim hasil</button></div>
  </section>
}

function Done({ payload, status }: { payload: Payload; status: SendStatus | 'sending' }) {
  const [copied, setCopied] = useState('')
  const text = summaryText(payload)
  // Benar/salahnya tebakan diagram tidak ditampilkan agar kunci tidak bocor ke responden berikutnya.
  const readTime = payload.l3.reduce((s, a) => s + a.latency, 0) / Math.max(payload.l3.length, 1)
  const success = payload.l4.filter(t => t.success).length
  const avg = payload.l4.reduce((s, t) => s + t.time, 0) / Math.max(payload.l4.length, 1)
  const grade = susGrade(payload.susScore)
  const wa = CONFIG.WA_NUMBER ? `https://wa.me/${CONFIG.WA_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : ''
  function download() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    a.download = `hasil_uji_${payload.id}.json`
    a.click()
  }
  async function copy() { try { await navigator.clipboard.writeText(text); setCopied('Tersalin.') } catch { setCopied('Salin manual dari kotak di bawah.') } }
  return <section className="done">
    <div className={`status ${status}`}>
      {status === 'sending' && <><span className="spinner" /><div><h2>Mengirim hasil…</h2></div></>}
      {status === 'ok' && <><span className="big-check"><Check size={28} strokeWidth={3} /></span><div><h2>Terima kasih, hasil terkirim!</h2><p>Kode responden Anda <b>{payload.id}</b>. Tunjukkan layar ini kepada penguji.</p></div></>}
      {status === 'fail' && <div><h2>Pengiriman otomatis gagal</h2><p>Tidak masalah. Gunakan salah satu tombol di bawah lalu kirim kepada penguji.</p></div>}
      {status === 'none' && <div><h2>Hasil siap diserahkan</h2><p>Pengiriman otomatis belum diaktifkan. Unduh berkas atau salin ringkasan, lalu serahkan kepada penguji.</p></div>}
    </div>
    <dl className="stats">
      <div className="stat blue"><dt>Tebak diagram</dt><dd>{payload.l3.length}/3</dd><small>rata-rata waktu baca {seconds(readTime)}</small></div>
      <div className="stat green"><dt>Misi selesai</dt><dd>{success}/{payload.l4.length}</dd><small>rata-rata {seconds(avg)} per misi</small></div>
      <div className="stat purple"><dt>Nilai Anda untuk dashboard (SUS)</dt><dd>{payload.susScore.toLocaleString('id-ID')}</dd><small>Grade {grade.grade} · {grade.label}</small></div>
    </dl>
    <div className="panel">
      <h3>Simpan & serahkan</h3>
      <div className="actions left wrap">
        <button onClick={() => window.print()}><Printer size={16} /> Cetak / simpan pernyataan (PDF)</button>
        <button onClick={download}><Download size={16} /> Unduh data (.json)</button>
        <button onClick={copy}><ClipboardCopy size={16} /> Salin ringkasan</button>
        {wa && <a className="button" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Kirim lewat WhatsApp</a>}
        <span className="hint">{copied}</span>
      </div>
      <textarea className="out" readOnly value={text} rows={6} />
      <div className="actions left"><button className="ghost" onClick={() => window.location.reload()}><RotateCcw size={16} /> Responden berikutnya</button></div>
    </div>
  </section>
}

function ConsentPrint({ session }: { session: Session }) {
  const at = new Date(session.consentAt)
  return <article className="consent-print" aria-hidden="true">
    <h1>Pernyataan Kesediaan Sukarela Mengikuti Uji Coba</h1>
    <p className="sub">{STUDY.title} · {STUDY.group}</p>
    <table><tbody>
      <tr><th>Nama</th><td>{session.profile.name}</td></tr>
      <tr><th>Kode responden</th><td>{session.id}</td></tr>
      <tr><th>Persona</th><td>{session.profile.persona} · {PERSONAS[session.profile.persona].title}</td></tr>
      <tr><th>Mode sesi</th><td>{session.profile.mode}</td></tr>
    </tbody></table>
    <p>Dengan ini saya menyatakan bahwa:</p>
    <ol>{CONSENT_POINTS.map((point, i) => <li key={i}>{point}</li>)}</ol>
    <div className="print-sign"><p>Semarang, {at.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Yang menyatakan,</p><p className="print-name"><b>{session.profile.name}</b></p></div>
    <p className="foot">Disetujui secara elektronik melalui formulir uji pada {at.toLocaleString('id-ID')}.</p>
  </article>
}
