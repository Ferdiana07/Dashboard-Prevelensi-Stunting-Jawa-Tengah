// Isi instrumen uji (Munzner Level 3 dan 4). Satu-satunya sumber teks pertanyaan, opsi, kunci, dan skenario;
// docs/pengujian/INSTRUMEN_UJI.md menyalin isi ini untuk dokumen yang diunggah ke Google Drive.
// Stimulus diambil dari dashboard saat ini dengan judul disamarkan: tests/e2e/uji-stimulus.spec.ts.
import mapImg from '../../docs/pengujian/stimulus/peta.png'
import barImg from '../../docs/pengujian/stimulus/batang.png'
import trendImg from '../../docs/pengujian/stimulus/tren.png'

export type Persona = 'A' | 'B'
export type DiagramId = 'D1' | 'D2' | 'D3'
export type KpiId = 'KPI-1' | 'KPI-2' | 'KPI-3'
export type CbqId = 'CBQ-1' | 'CBQ-2' | 'CBQ-3'

export const CONFIG = {
  // URL Web App Google Apps Script (docs/pengujian/apps-script.gs). Bisa diisi lewat variabel lingkungan Vercel.
  SHEET_URL: (import.meta.env.VITE_UJI_SHEET_URL as string | undefined) ?? '',
  // Nomor WhatsApp cadangan, format 628xxxxxxxxxx. Kosong = tombol WhatsApp disembunyikan.
  WA_NUMBER: (import.meta.env.VITE_UJI_WA as string | undefined) ?? '',
  // Ambang lebar layar tempat dashboard memakai tata letak satu layar.
  MIN_WIDTH: 1100,
}

export const PERSONAS: Record<Persona, { title: string; short: string; who: string; focus: string }> = {
  A: { title: 'Operator Internal', short: 'Operator', who: 'Staf teknis atau analis pemerintah daerah, Dinas Kesehatan, TPPS, atau mahasiswa yang berperan sebagai analis.', focus: 'Pemantauan rutin dan keputusan taktis: wilayah mana yang diintervensi lebih dulu.' },
  B: { title: 'Warga Publik', short: 'Warga', who: 'Masyarakat umum tanpa latar belakang analisis data yang ingin tahu kondisi stunting di daerahnya.', focus: 'Mencari informasi sendiri dan memahami kondisi wilayah dengan cepat.' },
}

export const KPI: Record<KpiId, { tag: string; text: string }> = {
  'KPI-1': { tag: 'Sebaran wilayah', text: 'Tingkat prevalensi stunting tiap kabupaten/kota, dikelompokkan ke dalam kategori risiko' },
  'KPI-2': { tag: 'Perubahan antarperiode', text: 'Perubahan prevalensi stunting dari periode ke periode (2019, 2021, 2022)' },
  'KPI-3': { tag: 'Selisih kelompok', text: 'Selisih rata-rata prevalensi stunting antara kelompok kota dan kelompok kabupaten' },
}
export const CBQ: Record<CbqId, { tag: string; text: string }> = {
  'CBQ-1': { tag: 'Wilayah risiko tertinggi', text: 'Wilayah mana yang prevalensinya paling tinggi dan perlu diprioritaskan untuk intervensi?' },
  'CBQ-2': { tag: 'Laju perubahan tren', text: 'Bagaimana prevalensi berubah dari periode ke periode: membaik atau memburuk?' },
  'CBQ-3': { tag: 'Peringkat perbandingan kelompok', text: 'Kelompok wilayah mana (kota atau kabupaten) yang peringkatnya lebih tinggi dan perlu porsi intervensi lebih besar?' },
}

export interface Diagram { id: DiagramId; idiom: string; img: string; width: number; height: number; key: { kpi: KpiId; cbq: CbqId }; question: Record<Persona, string> }
export const DIAGRAMS: Diagram[] = [
  { id: 'D1', idiom: 'Choropleth Map (Peta Sebaran)', img: mapImg, width: 814, height: 652, key: { kpi: 'KPI-1', cbq: 'CBQ-1' }, question: {
    A: 'Berdasarkan pola gradasi warna spasial pada peta ini, indikator pemantauan dan keputusan alokasi intervensi apa yang sedang ditunjukkan?',
    B: 'Melihat perbedaan warna antarwilayah pada peta ini, informasi kondisi apa yang paling tepat digambarkan?' } },
  { id: 'D2', idiom: 'Line Trend (Grafik Tren)', img: trendImg, width: 1628, height: 514, key: { kpi: 'KPI-2', cbq: 'CBQ-2' }, question: {
    A: 'Berdasarkan pergerakan garis deret waktu ini, evaluasi kinerja antarperiode apa yang harus Anda laporkan?',
    B: 'Melihat naik-turunnya garis dari tahun ke tahun pada grafik ini, perubahan kondisi apa yang sedang terjadi?' } },
  { id: 'D3', idiom: 'Horizontal Bar (Diagram Batang)', img: barImg, width: 799, height: 184, key: { kpi: 'KPI-3', cbq: 'CBQ-3' }, question: {
    A: 'Berdasarkan perbandingan panjang batang horizontal ini, prioritas distribusi intervensi untuk kelompok wilayah mana yang sedang dianalisis?',
    B: 'Melihat panjang batang dari atas ke bawah ini, perbandingan apa yang sedang ditampilkan?' } },
]

export const CONFIDENCE = ['Menebak', 'Ragu-ragu', 'Cukup yakin', 'Yakin', 'Sangat yakin']

// Kode dan nama 35 wilayah sama dengan public/data/stunting.csv.
export const REGIONS: { code: string; name: string }[] = [
  ['3301', 'Kab. Cilacap'], ['3302', 'Kab. Banyumas'], ['3303', 'Kab. Purbalingga'], ['3304', 'Kab. Banjarnegara'], ['3305', 'Kab. Kebumen'], ['3306', 'Kab. Purworejo'], ['3307', 'Kab. Wonosobo'], ['3308', 'Kab. Magelang'], ['3309', 'Kab. Boyolali'], ['3310', 'Kab. Klaten'], ['3311', 'Kab. Sukoharjo'], ['3312', 'Kab. Wonogiri'], ['3313', 'Kab. Karanganyar'], ['3314', 'Kab. Sragen'], ['3315', 'Kab. Grobogan'], ['3316', 'Kab. Blora'], ['3317', 'Kab. Rembang'], ['3318', 'Kab. Pati'], ['3319', 'Kab. Kudus'], ['3320', 'Kab. Jepara'], ['3321', 'Kab. Demak'], ['3322', 'Kab. Semarang'], ['3323', 'Kab. Temanggung'], ['3324', 'Kab. Kendal'], ['3325', 'Kab. Batang'], ['3326', 'Kab. Pekalongan'], ['3327', 'Kab. Pemalang'], ['3328', 'Kab. Tegal'], ['3329', 'Kab. Brebes'], ['3371', 'Kota Magelang'], ['3372', 'Kota Surakarta'], ['3373', 'Kota Salatiga'], ['3374', 'Kota Semarang'], ['3375', 'Kota Pekalongan'], ['3376', 'Kota Tegal'],
].map(([code, name]) => ({ code, name }))

export const TREND_OPTIONS = ['Membaik (prevalensi turun)', 'Memburuk (prevalensi naik)', 'Tetap sama']
export const JUMP_OPTIONS = ['2019 → 2021', '2021 → 2022', 'Tidak ada kenaikan']
export const GROUP_OPTIONS = ['Kota', 'Kabupaten']

export type Field =
  | { key: string; label: string; type: 'select'; options: string[]; answer: string }
  | { key: string; label: string; type: 'number'; unit: string; answer: number }
export type Check = 'crossfilter'
// target = kode wilayah yang harus terpilih di dashboard agar cross-filter dianggap dipakai.
export interface Task { id: string; persona: Persona; title: string; goal: string; text: string; fields: Field[]; check?: Check; target?: string }

const regionNames = REGIONS.map(region => region.name)
// Kunci dihitung dari CSV dan dicocokkan dengan README: Brebes 2019 34,65 / 2021 26,3 / 2022 29,1; rata-rata 2022 kabupaten 21,7, kota 15,8;
// K6 terbesar Pati +3,62 pp; Temanggung 2021 20,5 → 2022 28,9; rata-rata 2021 kabupaten 20,1, kota 19,1.
export const STATIC_TASKS: Task[] = [
  { id: 'A1', persona: 'A', title: 'Identifikasi Anomali Spasial-Temporal', goal: 'Peta → klik wilayah → Analisis Tren',
    text: 'Temukan kabupaten/kota dengan prevalensi stunting tertinggi tahun 2022 pada peta “Peta Prevalensi Stunting”. Klik wilayah tersebut agar grafik “Analisis Tren Temporal” di bagian bawah otomatis mengikuti wilayah itu, lalu tentukan pada periode mana prevalensi wilayah tersebut melonjak (naik).',
    fields: [
      { key: 'wilayah', label: 'Wilayah dengan prevalensi tertinggi 2022', type: 'select', options: regionNames, answer: 'Kab. Brebes' },
      { key: 'lonjakan', label: 'Periode terjadinya lonjakan di wilayah itu', type: 'select', options: JUMP_OPTIONS, answer: '2021 → 2022' },
    ], check: 'crossfilter', target: '3329' },
  { id: 'A2', persona: 'A', title: 'Perbandingan Lintas Kelompok', goal: 'Grafik Kota vs Kabupaten → Peringkat Wilayah',
    text: 'Pada grafik batang “Rata-rata Prevalensi: Kota vs Kabupaten” tahun 2022, bandingkan kelompok kota dan kabupaten. Tentukan kelompok dengan rata-rata prevalensi tertinggi, lalu cari wilayah di kelompok itu yang kinerjanya paling menurun, yaitu kenaikan prevalensi terbesar 2019→2022 (kolom K6 pada tabel “Peringkat Wilayah”).',
    fields: [
      { key: 'kelompok', label: 'Kelompok dengan rata-rata tertinggi 2022', type: 'select', options: GROUP_OPTIONS, answer: 'Kabupaten' },
      { key: 'rata', label: 'Rata-rata prevalensi kelompok itu', type: 'number', unit: '%', answer: 21.7 },
      { key: 'wilayah', label: 'Wilayah dengan kenaikan prevalensi terbesar 2019→2022', type: 'select', options: regionNames, answer: 'Kab. Pati' },
    ] },
  // Semua responden memakai wilayah yang sama agar tingkat kesulitan setara (responden tidak harus warga Jawa Tengah).
  { id: 'B1', persona: 'B', title: 'Kondisi Wilayah Tempat Tinggal', goal: 'Peta → klik wilayah → Analisis Tren',
    text: 'Bayangkan Anda tinggal di Kabupaten Temanggung. Cari Kab. Temanggung pada peta “Peta Prevalensi Stunting” dan klik wilayahnya. Lalu periksa pada grafik “Analisis Tren Temporal” apakah kondisi stunting di wilayah tersebut membaik atau memburuk pada periode terakhir (2021 → 2022).',
    fields: [
      { key: 'prev2022', label: 'Prevalensi Kab. Temanggung tahun 2022', type: 'number', unit: '%', answer: 28.9 },
      { key: 'kondisi', label: 'Kondisi 2021 → 2022', type: 'select', options: TREND_OPTIONS, answer: 'Memburuk (prevalensi naik)' },
    ], check: 'crossfilter', target: '3323' },
  { id: 'B2', persona: 'B', title: 'Transparansi Prioritas', goal: 'Filter Tahun → Grafik Kota vs Kabupaten',
    text: 'Ubah filter Tahun menjadi 2021. Pada grafik batang “Rata-rata Prevalensi: Kota vs Kabupaten”, temukan kelompok wilayah dengan rata-rata prevalensi paling besar.',
    fields: [
      { key: 'kelompok', label: 'Kelompok dengan rata-rata terbesar tahun 2021', type: 'select', options: GROUP_OPTIONS, answer: 'Kabupaten' },
      { key: 'rata', label: 'Rata-rata prevalensi kelompok itu', type: 'number', unit: '%', answer: 20.1 },
    ] },
]

export const SUS_ITEMS = [
  'Saya berpikir akan sering menggunakan dashboard ini.',
  'Saya merasa dashboard ini rumit untuk digunakan.',
  'Saya merasa dashboard ini mudah digunakan.',
  'Saya membutuhkan bantuan orang teknis untuk dapat menggunakan dashboard ini.',
  'Saya merasa fitur-fitur dashboard ini (peta, grafik, tabel, filter) terintegrasi dengan baik.',
  'Saya merasa ada banyak hal yang tidak konsisten pada dashboard ini.',
  'Saya merasa kebanyakan orang akan cepat memahami cara menggunakan dashboard ini.',
  'Saya merasa dashboard ini membingungkan.',
  'Saya merasa percaya diri saat menggunakan dashboard ini.',
  'Saya perlu banyak belajar sebelum dapat menggunakan dashboard ini.',
]

export const CONSENT_POINTS = [
  'Saya mengikuti uji coba dashboard ini secara sukarela, tanpa paksaan dan tanpa imbalan yang mengikat.',
  'Saya memahami bahwa yang diuji adalah dashboard, bukan kemampuan saya, dan saya boleh berhenti kapan saja tanpa konsekuensi.',
  'Saya mengizinkan jawaban, waktu pengerjaan, dan aktivitas klik saya selama uji direkam dan diolah untuk laporan mata kuliah Visualisasi Data, Departemen Informatika, Universitas Diponegoro.',
  'Saya memahami bahwa nama saya tidak akan dicantumkan dalam laporan; hasil disajikan dengan kode responden.',
]

export const STUDY = {
  title: 'Uji Dashboard Prioritas Stunting Jawa Tengah',
  group: 'Kelompok 14 · Visualisasi Data · Informatika Undip 2026',
}
