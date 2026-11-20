/**
 * Penerima hasil uji — Dashboard Prioritas Stunting Jawa Tengah (Kelompok 14)
 *
 * Cara pakai (lihat docs/pengujian/README.md):
 * 1. Buat Google Sheet baru → Ekstensi → Apps Script → tempel seluruh berkas ini → Simpan.
 * 2. Jalankan fungsi `siapkan` sekali (izinkan akses Spreadsheet).
 * 3. Terapkan → Deployment baru → Jenis: Aplikasi web → Jalankan sebagai: Saya → Akses: Siapa saja → Terapkan.
 * 4. Salin URL /exec ke variabel lingkungan VITE_UJI_SHEET_URL (Vercel) lalu deploy ulang dashboard.
 *
 * Lembar yang dibuat: Responden, L3, L4, SUS, Persetujuan (data mentah, satu baris per jawaban)
 * dan Analisis (rumus otomatis: Acc_E2E, Decode Latency, Fleiss' kappa, Confidence, modus, Task Completion,
 * Time-on-Task, Error, SUS, serta tabel komparasi persona). Unduh sebagai .xlsx lewat File → Download.
 */

const SHEETS = {
  Responden: ['Waktu kirim', 'ID', 'Nama', 'Persona', 'Usia', 'Literasi grafik (1-5)', 'Mode', 'Mulai', 'Durasi total (s)', 'Skor SUS', 'Komentar', 'Layar', 'Viewport', 'User agent'],
  L3: ['Waktu kirim', 'ID', 'Persona', 'Diagram', 'Idiom', 'Urutan tampil', 'KPI dipilih', 'CBQ dipilih', 'KPI benar', 'CBQ benar', 'E2E benar', 'Decode latency (s)', 'Confidence (1-5)', 'Lucky guess (anomali)'],
  L4: ['Waktu kirim', 'ID', 'Persona', 'Task', 'Urutan', 'Sukses', 'Menyerah', 'Time-on-task (s)', 'Jawaban salah', 'Total klik', 'Klik tanpa respons', 'Error (salah + tanpa respons)', 'Perubahan filter', 'Cross-filter dipakai', 'Jawaban akhir', 'Log interaksi'],
  SUS: ['Waktu kirim', 'ID', 'Persona', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Skor SUS'],
  Persetujuan: ['Waktu kirim', 'ID', 'Nama', 'Persona', 'Disetujui pada', 'Pernyataan'],
}
const IDIOM = { D1: 'Choropleth Map', D2: 'Line Trend', D3: 'Horizontal Bar' }
const KEY = { D1: 'CBQ-1', D2: 'CBQ-2', D3: 'CBQ-3' }

function siapkan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  Object.keys(SHEETS).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name)
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold').setBackground('#d7edfd').setWrap(true)
    sh.setFrozenRows(1)
  })
  const first = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1')
  if (first && ss.getSheets().length > 1) ss.deleteSheet(first)
  buatAnalisis()
}

function doGet() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Responden')
  return ContentService.createTextOutput(JSON.stringify({ ok: true, responden: sh ? Math.max(sh.getLastRow() - 1, 0) : 0 })).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const p = JSON.parse(e.postData.contents)
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const resp = ss.getSheetByName('Responden')
    // Abaikan kiriman ganda (mis. tombol ditekan dua kali).
    const ids = resp.getLastRow() > 1 ? resp.getRange(2, 2, resp.getLastRow() - 1, 1).getValues().flat() : []
    if (ids.indexOf(p.id) >= 0) return json({ ok: true, duplicate: true })
    const now = new Date()
    const per = p.profile.persona
    const b = v => v === null || v === undefined ? '' : v ? 1 : 0
    resp.appendRow([now, p.id, p.profile.name, per, p.profile.age, p.profile.literacy, p.profile.mode, p.startedAt, p.durationSec, p.susScore, p.comment, p.device.screen, p.device.viewport, p.device.userAgent])
    append(ss, 'L3', p.l3.map(a => [now, p.id, per, a.diagram, IDIOM[a.diagram], a.order, a.kpi, a.cbq, b(a.kpiOk), b(a.cbqOk), b(a.e2e), round(a.latency), a.confidence, b(a.lucky)]))
    append(ss, 'L4', p.l4.map(t => [now, p.id, per, t.task, t.order, b(t.success), b(t.gaveUp), round(t.time), t.wrongSubmits, t.clicks, t.deadClicks, t.wrongSubmits + t.deadClicks, t.filterChanges, b(t.crossfilter), JSON.stringify(t.answers), t.log]))
    append(ss, 'SUS', [[now, p.id, per].concat(p.sus).concat([p.susScore])])
    append(ss, 'Persetujuan', [[now, p.id, p.profile.name, per, p.consent.at, 'Bersedia sukarela; 4 butir pernyataan dicentang secara elektronik']])
    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  } finally { lock.releaseLock() }
}
function append(ss, name, rows) { if (rows.length) { const sh = ss.getSheetByName(name); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows) } }
function round(v) { return Math.round(v * 100) / 100 }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON) }

/* ------------------------------------------------------------------ */
/* Lembar Analisis — seluruh nilai berupa rumus sehingga ikut diperbarui saat data masuk dan tetap ada saat diunduh .xlsx */
function buatAnalisis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const old = ss.getSheetByName('Analisis')
  if (old) ss.deleteSheet(old)
  const sh = ss.insertSheet('Analisis', 0)
  const head = (r, values, color) => sh.getRange(r, 1, 1, values.length).setValues([values]).setFontWeight('bold').setBackground(color || '#ededee').setWrap(true).setVerticalAlignment('middle')
  const title = (r, text) => sh.getRange(r, 1).setValue(text).setFontWeight('bold').setFontSize(13)
  const N = 5000 // batas baris untuk rumus array
  const GROUPS = [['Total (N)', '*'], ['Operator Internal', 'A'], ['Warga Publik', 'B']]

  sh.getRange(1, 1).setValue('Analisis Uji Dashboard Stunting Jawa Tengah — Munzner Level 3 & 4').setFontWeight('bold').setFontSize(15)
  sh.getRange(2, 1).setValue('Semua sel di bawah berupa rumus dari lembar L3, L4, SUS, dan Responden. Kriteria "*" = semua persona.').setFontStyle('italic')

  // ---------- A. Level 3 per diagram ----------
  title(4, 'A. Level 3 — Visual Reverse-Mapping per diagram (target: Acc_E2E ≥ 85%, latency ≤ 10 s, mayoritas ≥ 85% & sesuai kunci)')
  const H3 = ['Kelompok', 'Kriteria persona', 'Diagram', 'Idiom', 'Kunci CBQ', 'n', 'Acc_E2E', 'Akurasi KPI', 'Akurasi CBQ', 'Latency mean (s)', 'Latency SD (s)', 'Confidence mean', 'Lucky guess', 'CBQ-1', 'CBQ-2', 'CBQ-3', 'MAX', 'Modus', '% mayoritas', 'P_i', 'Status modus', 'Acc ≥ 85%', 'Latency ≤ 10 s']
  head(5, H3, '#d7edfd')
  const l3rows = {}
  let r = 6
  GROUPS.forEach(([label, crit]) => {
    l3rows[crit] = []
    ;['D1', 'D2', 'D3'].forEach(d => {
      const cond = `L3!$D:$D,$C${r},L3!$C:$C,$B${r}`
      const arr = `(L3!$D$2:$D$${N}=$C${r})*((L3!$C$2:$C$${N}=$B${r})+($B${r}="*"))`
      sh.getRange(r, 1, 1, 5).setValues([[label, crit, d, IDIOM[d], KEY[d]]])
      sh.getRange(r, 6, 1, 18).setFormulas([[
        `=COUNTIFS(${cond})`,
        `=IF($F${r}=0,"",SUMIFS(L3!$K:$K,${cond})/$F${r})`,
        `=IF($F${r}=0,"",SUMIFS(L3!$I:$I,${cond})/$F${r})`,
        `=IF($F${r}=0,"",SUMIFS(L3!$J:$J,${cond})/$F${r})`,
        `=IF($F${r}=0,"",AVERAGEIFS(L3!$L:$L,${cond}))`,
        `=IF($F${r}<2,"",ARRAYFORMULA(STDEV(IF(${arr},L3!$L$2:$L$${N}))))`,
        `=IF($F${r}=0,"",AVERAGEIFS(L3!$M:$M,${cond}))`,
        `=SUMIFS(L3!$N:$N,${cond})`,
        `=COUNTIFS(${cond},L3!$H:$H,N$5)`,
        `=COUNTIFS(${cond},L3!$H:$H,O$5)`,
        `=COUNTIFS(${cond},L3!$H:$H,P$5)`,
        `=MAX(N${r}:P${r})`,
        `=IF($F${r}=0,"",INDEX($N$5:$P$5,MATCH(Q${r},N${r}:P${r},0)))`,
        `=IF($F${r}=0,"",Q${r}/$F${r})`,
        `=IF($F${r}<2,"",(SUMSQ(N${r}:P${r})-$F${r})/($F${r}*($F${r}-1)))`,
        `=IF($F${r}=0,"",IF(AND(R${r}=$E${r},S${r}>=0.85),"Lulus","PRIORITAS PERBAIKAN"))`,
        `=IF($F${r}=0,"",IF(G${r}>=0.85,"Lulus","Belum"))`,
        `=IF($F${r}=0,"",IF(J${r}<=10,"Lulus","Belum"))`,
      ]])
      l3rows[crit].push(r)
      r++
    })
  })
  sh.getRange(6, 7, 9, 3).setNumberFormat('0.0%')
  sh.getRange(6, 10, 9, 3).setNumberFormat('0.00')
  sh.getRange(6, 19, 9, 1).setNumberFormat('0.0%')
  sh.getRange(6, 20, 9, 1).setNumberFormat('0.000')

  // ---------- B. Fleiss' kappa ----------
  r += 1
  title(r, "B. Fleiss' kappa (κ) atas pilihan CBQ — subjek = 3 diagram, penilai = responden, kategori = CBQ-1/2/3 (target κ ≥ 0,75)")
  r++
  head(r, ['Kelompok', 'n penilai per diagram', 'P̄ (rata-rata P_i)', 'p_j CBQ-1', 'p_j CBQ-2', 'p_j CBQ-3', 'P̄e (Σ p_j²)', 'κ', 'Interpretasi (Landis & Koch)', 'Status'], '#f1e2fc')
  const kappaCell = {}
  r++
  GROUPS.forEach(([label, crit]) => {
    const [a, , c] = l3rows[crit]
    const total = `SUM($N$${a}:$P$${c})`
    sh.getRange(r, 1).setValue(label)
    sh.getRange(r, 2, 1, 9).setFormulas([[
      `=F${a}`,
      `=IFERROR(AVERAGE(T${a}:T${c}),"")`,
      `=IFERROR(SUM(N${a}:N${c})/${total},"")`,
      `=IFERROR(SUM(O${a}:O${c})/${total},"")`,
      `=IFERROR(SUM(P${a}:P${c})/${total},"")`,
      `=IFERROR(SUMSQ(D${r}:F${r}),"")`,
      `=IFERROR((C${r}-G${r})/(1-G${r}),"")`,
      `=IF(H${r}="","",IF(H${r}<0,"Buruk",IF(H${r}<=0.2,"Sangat lemah",IF(H${r}<=0.4,"Lemah",IF(H${r}<=0.6,"Sedang",IF(H${r}<=0.8,"Kuat","Hampir sempurna"))))))`,
      `=IF(H${r}="","",IF(H${r}>=0.75,"Lulus","Belum"))`,
    ]])
    sh.getRange(r, 3, 1, 6).setNumberFormat('0.000')
    kappaCell[crit] = 'H' + r
    r++
  })

  // ---------- C. Level 4 per task ----------
  r += 1
  title(r, 'C. Level 4 — Task-Based Usability (ISO 9241-11) (target: completion ≥ 90%, time ≤ 30 s/task)')
  r++
  head(r, ['Baris', 'Kolom filter', 'Nilai filter', 'n', 'Task Completion Rate', 'Time-on-task mean (s)', 'Time SD (s)', 'Time mean, hanya sukses (s)', 'Jawaban salah (mean)', 'Klik tanpa respons (mean)', 'Error per task (mean)', '% task dengan ≥ 1 error', 'Cross-filter dipakai', 'Completion ≥ 90%', 'Time ≤ 30 s'], '#e4f7db')
  r++
  const l4First = r
  const L4ROWS = [['Task A1 · Anomali spasial-temporal', 'D', 'A1'], ['Task A2 · Perbandingan lintas kelompok', 'D', 'A2'], ['Task B1 · Kondisi wilayah (Temanggung)', 'D', 'B1'], ['Task B2 · Transparansi prioritas', 'D', 'B2'], ['Semua task Operator Internal', 'C', 'A'], ['Semua task Warga Publik', 'C', 'B'], ['Semua task (Total)', 'C', '*']]
  const l4Cell = {}
  L4ROWS.forEach(([label, col, val]) => {
    const cond = `L4!$${col}:$${col},$C${r}`
    const arr = `((L4!$${col}$2:$${col}$${N}=$C${r})+($C${r}="*"))*(L4!$D$2:$D$${N}<>"")`
    sh.getRange(r, 1, 1, 3).setValues([[label, col === 'D' ? 'Task' : 'Persona', val]])
    sh.getRange(r, 4, 1, 12).setFormulas([[
      `=COUNTIFS(${cond})`,
      `=IF($D${r}=0,"",AVERAGEIFS(L4!$F:$F,${cond}))`,
      `=IF($D${r}=0,"",AVERAGEIFS(L4!$H:$H,${cond}))`,
      `=IF($D${r}<2,"",ARRAYFORMULA(STDEV(IF(${arr},L4!$H$2:$H$${N}))))`,
      `=IFERROR(AVERAGEIFS(L4!$H:$H,${cond},L4!$F:$F,1),"")`,
      `=IF($D${r}=0,"",AVERAGEIFS(L4!$I:$I,${cond}))`,
      `=IF($D${r}=0,"",AVERAGEIFS(L4!$K:$K,${cond}))`,
      `=IF($D${r}=0,"",AVERAGEIFS(L4!$L:$L,${cond}))`,
      `=IF($D${r}=0,"",COUNTIFS(${cond},L4!$L:$L,">0")/$D${r})`,
      `=IFERROR(AVERAGEIFS(L4!$N:$N,${cond},L4!$N:$N,"<>"),"")`,
      `=IF($D${r}=0,"",IF(E${r}>=0.9,"Lulus","Belum"))`,
      `=IF($D${r}=0,"",IF(F${r}<=30,"Lulus","Belum"))`,
    ]])
    l4Cell[val] = r
    r++
  })
  sh.getRange(l4First, 5, L4ROWS.length, 1).setNumberFormat('0.0%')
  sh.getRange(l4First, 6, L4ROWS.length, 3).setNumberFormat('0.0')
  sh.getRange(l4First, 9, L4ROWS.length, 3).setNumberFormat('0.00')
  sh.getRange(l4First, 12, L4ROWS.length, 3).setNumberFormat('0.0%')

  // ---------- D. SUS ----------
  r += 1
  title(r, 'D. System Usability Scale (target: skor ≥ 75, grade B / Good)')
  r++
  head(r, ['Kelompok', 'Kriteria persona', 'n', 'SUS mean', 'SUS SD', 'Min', 'Maks', 'Grade (Sauro–Lewis)', 'Status ≥ 75', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'], '#ffead0')
  r++
  const susCell = {}
  GROUPS.forEach(([label, crit]) => {
    const cond = `SUS!$C:$C,$B${r}`
    const arr = `((SUS!$C$2:$C$${N}=$B${r})+($B${r}="*"))*(SUS!$N$2:$N$${N}<>"")`
    sh.getRange(r, 1, 1, 2).setValues([[label, crit]])
    const items = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(c => `=IF($C${r}=0,"",AVERAGEIFS(SUS!$${c}:$${c},${cond}))`)
    sh.getRange(r, 3, 1, 17).setFormulas([[
      `=COUNTIFS(${cond})`,
      `=IF($C${r}=0,"",AVERAGEIFS(SUS!$N:$N,${cond}))`,
      `=IF($C${r}<2,"",ARRAYFORMULA(STDEV(IF(${arr},SUS!$N$2:$N$${N}))))`,
      `=IF($C${r}=0,"",MINIFS(SUS!$N:$N,${cond}))`,
      `=IF($C${r}=0,"",MAXIFS(SUS!$N:$N,${cond}))`,
      `=IF($C${r}=0,"",IF(D${r}>=80.3,"A",IF(D${r}>=74,"B",IF(D${r}>=68,"C",IF(D${r}>=51,"D","F")))))`,
      `=IF($C${r}=0,"",IF(D${r}>=75,"Lulus","Belum"))`,
    ].concat(items)])
    sh.getRange(r, 4, 1, 4).setNumberFormat('0.0')
    sh.getRange(r, 10, 1, 10).setNumberFormat('0.00')
    susCell[crit] = r
    r++
  })
  sh.getRange(r, 1).setValue('Butir ganjil bernada positif (makin tinggi makin baik); butir genap bernada negatif (makin rendah makin baik).').setFontStyle('italic')
  r++

  // ---------- E. Komparasi persona ----------
  r += 1
  title(r, 'E. Tabel komparasi antar persona (kesenjangan literasi visual)')
  r++
  head(r, ['Metrik', 'Operator Internal (A)', 'Warga Publik (B)', 'Total', 'Selisih A − B', 'Target', 'Status A', 'Status B', 'Status Total'], '#dcf4e2')
  r++
  const compFirst = r
  const ap = (range, crit) => `IFERROR(AVERAGEIFS(${range},${crit === 'total' ? `L3!$C:$C,"*"` : `L3!$C:$C,"${crit}"`}),"")`
  const metrics = [
    ['Acc_E2E (3 diagram)', c => `=${ap('L3!$K:$K', c)}`, '>=', 0.85, '0.0%'],
    ['Decode latency mean (s)', c => `=${ap('L3!$L:$L', c)}`, '<=', 10, '0.00'],
    ["Fleiss' kappa (κ)", c => `=${kappaCell[c === 'total' ? '*' : c]}`, '>=', 0.75, '0.000'],
    ['Confidence mean (1–5)', c => `=${ap('L3!$M:$M', c)}`, '', '', '0.00'],
    ['Lucky guess (jumlah anomali)', c => `=SUMIFS(L3!$N:$N,L3!$C:$C,"${c === 'total' ? '*' : c}")`, '', '', '0'],
    ['Task Completion Rate', c => `=E${l4Cell[c === 'total' ? '*' : c]}`, '>=', 0.9, '0.0%'],
    ['Time-on-task mean (s)', c => `=F${l4Cell[c === 'total' ? '*' : c]}`, '<=', 30, '0.0'],
    ['Error per task (mean)', c => `=K${l4Cell[c === 'total' ? '*' : c]}`, '', '', '0.00'],
    ['SUS mean', c => `=D${susCell[c === 'total' ? '*' : c]}`, '>=', 75, '0.0'],
    ['Literasi grafik (self-report 1–5)', c => `=IFERROR(AVERAGEIFS(Responden!$F:$F,Responden!$D:$D,"${c === 'total' ? '*' : c}"),"")`, '', '', '0.00'],
  ]
  metrics.forEach(([label, fn, op, target, fmt]) => {
    const status = col => op ? `=IF(${col}${r}="","",IF(${col}${r}${op}${target},"Lulus","Belum"))` : '=""'
    sh.getRange(r, 1).setValue(label)
    sh.getRange(r, 2, 1, 4).setFormulas([[fn('A'), fn('B'), fn('total'), `=IFERROR(B${r}-C${r},"")`]])
    sh.getRange(r, 6).setValue(op ? `${op === '>=' ? '≥' : '≤'} ${target}` : '—')
    sh.getRange(r, 7, 1, 3).setFormulas([[status('B'), status('C'), status('D')]])
    sh.getRange(r, 2, 1, 4).setNumberFormat(fmt)
    r++
  })

  // ---------- F. Diagnosis otomatis ----------
  r += 1
  title(r, 'F. Diagnosis — kandidat prioritas perbaikan (kelompok Total)')
  r++
  const [t1, , t3] = l3rows['*']
  const diag = [
    ['Diagram dengan % mayoritas terendah', `=IFERROR(INDEX(C${t1}:C${t3},MATCH(MIN(S${t1}:S${t3}),S${t1}:S${t3},0))&" ("&TEXT(MIN(S${t1}:S${t3}),"0%")&")","")`],
    ['Diagram yang modusnya meleset dari kunci', `=IFERROR(TEXTJOIN(", ",TRUE,FILTER(C${t1}:C${t3},R${t1}:R${t3}<>E${t1}:E${t3})),"(tidak ada)")`],
    ['Diagram dengan kesepakatan item (P_i) terendah', `=IFERROR(INDEX(C${t1}:C${t3},MATCH(MIN(T${t1}:T${t3}),T${t1}:T${t3},0))&" (P_i = "&TEXT(MIN(T${t1}:T${t3}),"0.00")&")","")`],
    ['Diagram dengan confidence terendah', `=IFERROR(INDEX(C${t1}:C${t3},MATCH(MIN(L${t1}:L${t3}),L${t1}:L${t3},0))&" ("&TEXT(MIN(L${t1}:L${t3}),"0.00")&")","")`],
    ['Diagram dengan latency tertinggi', `=IFERROR(INDEX(C${t1}:C${t3},MATCH(MAX(J${t1}:J${t3}),J${t1}:J${t3},0))&" ("&TEXT(MAX(J${t1}:J${t3}),"0.0")&" s)","")`],
    ['Task dengan error rata-rata tertinggi', `=IFERROR(INDEX(C${l4First}:C${l4First + 3},MATCH(MAX(K${l4First}:K${l4First + 3}),K${l4First}:K${l4First + 3},0))&" ("&TEXT(MAX(K${l4First}:K${l4First + 3}),"0.00")&")","")`],
    ['Task dengan completion terendah', `=IFERROR(INDEX(C${l4First}:C${l4First + 3},MATCH(MIN(E${l4First}:E${l4First + 3}),E${l4First}:E${l4First + 3},0))&" ("&TEXT(MIN(E${l4First}:E${l4First + 3}),"0%")&")","")`],
  ]
  diag.forEach(([label, formula]) => { sh.getRange(r, 1).setValue(label); sh.getRange(r, 2).setFormula(formula); r++ })

  sh.setColumnWidth(1, 300)
  sh.setColumnWidths(2, 22, 112)
  sh.setFrozenColumns(1)
  sh.getRange(compFirst, 1, metrics.length, 1).setFontWeight('bold')
}
