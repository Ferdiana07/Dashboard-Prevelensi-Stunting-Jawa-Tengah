# Hasil verifikasi implementasi

Verifikasi awal dilaksanakan pada 16 November 2026, dilanjutkan audit data seluruh komponen pada **18 November 2026**, menggunakan CSV dan GeoJSON lampiran pengguna.

| Pemeriksaan | Hasil |
| --- | --- |
| Parsing dan cakupan CSV | 105 baris; 35 wilayah pada masing-masing 2019, 2021, 2022 |
| Join geometri | 35 kode unik, cocok satu-ke-satu dengan CSV |
| Tes unit Vitest | 94 lulus, termasuk pembulatan, ekspor vs CSV sumber, K6 naik/tetap/turun dan teks ringkasannya, encoding, dan posisi tooltip |
| Tes browser Playwright Chromium | 64 lulus (tanpa `uji-stimulus.spec.ts`), termasuk audit data, viewport, masking, tooltip, label peta, penanda wilayah, label tren, panel K6, dan mobile |
| TypeScript | Lulus, termasuk pemeriksaan pada build |
| ESLint | Lulus |
| Build produksi, sesuai lockfile (Windows, `npm ci`, recharts 3.10.1, rolldown 1.2.19) | Lulus; chunk `visualization` 460,02 kB (gzip 131,63 kB), tanpa peringatan ukuran chunk. Sebelum perubahan label P13 angkanya 459,76 kB. |
| Build produksi, lokal Windows dengan `node_modules` menyimpang dari lockfile (recharts 3.11.0) | Lulus; chunk `visualization` 512,37 kB dengan peringatan Vite: `(!) Some chunks are larger than 500 kB after minification. Consider: - Using dynamic import() to code-split the application - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.` Bukan acuan rilis. |
| Build Vercel (Linux, mengikuti lockfile) | Belum diperiksa dari sisi pengembang ini; log build Vercel dicek oleh pemilik repo. |
| Smoke test build produksi | HTTP 200, KPI default benar, 35 geometri, filter kota 15,8% |
| Console browser | Tidak ada error atau warning pada tes tangkapan layar dan smoke test produksi |
| Overflow halaman | Tidak ditemukan pada lebar 360, 390, 768, 1024, 1366, 1672 px |
| Tinggi ringkasan desktop | Mode satu layar hanya pada tinggi ≥720 px (lebar ≥1190 px) atau ≥790 px (lebar 1100–1189 px); di dalamnya header, kartu, peta, grafik, dan tabel termasuk ringkasan perubahan berada dalam viewport 1280×720, 1366×768, 1536×730, 1672×941, dan 1100×790 dengan tabel ≥ 80 px. Di bawah batas itu halaman bergulir biasa (Tahap 6) |
| Review visual | Desktop 1672 px dan mobile 390 px dibandingkan dengan referensi; tidak ada perbaikan material yang diminta reviewer |

Tes browser mencakup filter tahun/tipe, tooltip, pemilihan peta dengan keyboard, sinkronisasi detail dan tren, pencarian/empty state, pengurutan K6, tampilkan semua, zoom/pan/reset, empat mode tren, batas lima seri, ekspor CSV, loading state, serta penolakan berkas gagal/tidak valid.

KPI 2022 terhitung: rata-rata **20,68%**, **33/35** di atas 14%, selisih rata-rata kabupaten–kota **5,929885… pp**, capaian **2/35**. Kategori peta: **2 hijau, 15 kuning, 18 merah**. Temanggung K6 **+3,11 pp**, terpisah dari perubahan 2021–2022 **+8,4 pp**. Pati memiliki peningkatan K6 terbesar **+3,62 pp**.

Screenshot hasil tes berada di `.impeccable/review/desktop.png` dan `mobile.png`. Kedua berkas memperlihatkan data dan font yang sudah selesai dimuat. Pengujian mobile memakai emulasi viewport Chromium, bukan perangkat fisik; pengujian lintas browser Firefox/Safari belum dilakukan.

## Integritas salinan lampiran

Hash SHA-256 berkas di `public/data` identik dengan lampiran sumber:

```text
stunting.csv
C3C4ED73C92446309DEDEE1E73FE2C337659663E8D94F86BBC44187042A3F126

jateng.geojson
196119A494297085B0EBA30ECAF594EA64FBA6328616DA4FD6117F1A444F581D
```

Laporan kelompok yang kemudian dilampirkan mencantumkan sumber prevalensi dari Portal Satu Data Jawa Tengah, batas wilayah dari `cahyadsn/wilayah_boundaries`, serta arsip Zenodo. Atribusi mengikuti laporan; sumber upstream, lisensi, dan metode survei tidak diverifikasi ulang melalui audit lokal ini. Lihat README untuk rujukannya.

## Audit seluruh komponen, 18 November 2026

Referensi audit dibaca langsung dari CSV, tanpa menggunakan fungsi parsing, rumus, format, atau peringkat aplikasi untuk membentuk nilai pembanding tes browser. Geometri dan CSV lokal kembali dicocokkan melalui SHA-256 dengan lampiran asli; keduanya identik.

| Komponen | Cakupan audit | Hasil |
| --- | --- | --- |
| Integritas data | 105 baris, 3 tahun, 35 kode unik per tahun, 29 kabupaten dan 6 kota | Cocok dengan lampiran |
| Empat scorecard | 3 tahun × 3 cakupan (seluruh wilayah, kabupaten, kota); memilih satu dari 35 wilayah tidak mengubah scorecard | 9 kombinasi cakupan dan 105 pemilihan wilayah cocok |
| Peta dan legenda | Warna seluruh 35 geometri serta jumlah kategori pada setiap kombinasi filter | Cocok; luar cakupan berwarna abu-abu |
| Grafik kota–kabupaten | Rata-rata, label angka, dan warna batang sesuai ambang pada setiap cakupan | Cocok; satu kelompok tidak menghasilkan pembanding palsu |
| Tabel | Seluruh nama, peringkat, prevalensi, jarak target, dan perubahan pada 9 kombinasi cakupan | Cocok setelah koreksi peringkat seri dan pembulatan |
| Tooltip dan detail | 105 pengamatan; status target, jarak target, perubahan 2019→2022, dan tiga nilai riwayat (tanpa Δ tahun sebelumnya) | Cocok |
| Tren satu wilayah | 35 wilayah × 3 tahun yang tersedia | Seluruh 105 titik cocok dengan CSV |
| Tren rata-rata | Seluruh wilayah, kota, dan kabupaten untuk 3 tahun | Seluruh nilai cocok |
| Tren kelompok dan multiwilayah | Kedua rata-rata provinsi serta tiga wilayah contoh pada 3 tahun | Label dan nilai cocok; cakupan kelompok provinsi dijelaskan |
| Tahun 2020 | Tidak ada observasi/titik; garis terputus dan keterangan data tidak tersedia | Tidak ada interpolasi atau data buatan |
| Ekspor CSV | Seluruh 105 pengamatan dari ekspor 3 tahun | 10 kolom dan seluruh nilai sama dengan baris CSV sumber; tes unit membandingkan ekspor semua tahun dan cakupan dengan sumber |
| Pemilihan setelah pencarian | Cari Semarang lalu pilih Brebes melalui peta | Baris pilihan terlihat dan pencarian lama dibersihkan |

### Perbaikan yang ditemukan melalui audit

1. **Peringkat seri:** dua nilai prevalensi yang sama sebelumnya mendapat nomor urut berbeda. Peringkat kini mengikuti aturan CSV: jumlah wilayah dengan prevalensi lebih besar + 1. Sragen dan Rembang pada 2022 sama-sama 24,3% dan peringkat 6.
2. **Pembulatan tampilan:** pengurangan floating point `19.65 - 14` menghasilkan `5.649999999999999`, yang sebelumnya ditampilkan 5,6 pp. Galat aritmetika biner kini dinormalisasi hanya saat pemformatan sehingga jarak target Kebumen 2019 tampil **+5,7 pp**, sesuai nilai matematis 5,65. Perhitungan dan berkas sumber tidak diubah.
3. **Sinkronisasi pencarian:** pencarian lama bisa menyembunyikan wilayah yang baru dipilih dari peta. Tabel memulai ulang pencarian/urutan saat cakupan berubah, dan mengosongkan pencarian bila pilihan wilayah akan tersembunyi olehnya.
4. **Teks perubahan nol:** ringkasan tren untuk Kabupaten Pekalongan pada 2019–2022 kini menyebut **tidak ada perubahan**, sesuai 23,5% pada kedua tahun.

### Kedudukan analisis tren temporal

Panel ini adalah **fitur pelengkap**, bukan panel pada gambar mockup utama. Prompt awal bagian F secara eksplisit meminta panel tren di bawah dashboard; laporan kelompok Subbab 4.2 juga menyarankannya untuk membandingkan antartahun tanpa mengandalkan ingatan pengguna. Data yang dipakai tetap berasal dari CSV yang sama: 2019, 2021, dan 2022. Panel ini tidak menambah tahun atau pengamatan baru.

Audit memeriksa kesesuaian implementasi terhadap lampiran, bukan kebenaran hasil pengukuran survei di lapangan, keabsahan topologi/luas melalui alat GIS independen, atau pengujian kegunaan dengan responden.

## Verifikasi perbaikan visual encoding

Perbaikan Munzner Level 3 memperkuat pola kategori, sumbu batang, skala tetap, bentuk titik/pola garis seri, serta encoding kekosongan 2020. Rumus KPI dan berkas CSV/GeoJSON tidak diubah. Semua panel memakai satu desimal; kategori ditentukan dari nilai asli. Bila pembulatan melintasi batas kategori (rata-rata 2021 = 19,96%, ditampilkan 20,0%, titik kuning), grafik tren memberi catatan.

Seluruh 46 tes unit dan 24 tes browser lulus. Lima tes tambahan memeriksa encoding ketika judul, penjelasan, dan kontrol disamarkan, serta menghasilkan capture panel desktop, grayscale, dan mobile. Reviewer visual memeriksa capture tersebut dan tidak meminta perbaikan material. Ini bukan hasil uji pengenalan KPI/CBQ oleh responden. Lihat [VISUAL_ENCODING.md](VISUAL_ENCODING.md) untuk panduan dan batas interpretasi uji.

## Perbaikan posisi tooltip

Tooltip peta kini dirender sebagai portal dengan koordinat viewport dan `position: fixed`, bukan dibatasi oleh tinggi/lebar kotak peta. Jarak minimal 18px dipertahankan dari posisi kursor, dengan perpindahan sisi otomatis berdasarkan ukuran aktual popup. Viewport sempit memakai ruang di atas/bawah; tinggi popup dibatasi bila seluruh konten tidak muat. Popup tetap `pointer-events: none`, dan preview lama ditutup ketika scroll atau resize. Fokus keyboard, Escape, serta klik pemilihan wilayah tetap bekerja.

Enam tes unit tambahan memeriksa posisi di 100 titik viewport dan kasus tepi; tiga tes browser memeriksa pelacakan kursor pada Wonogiri, perpindahan sisi di desktop/mobile, klik, keyboard, Escape, dan scroll. Seluruh **52 tes unit dan 27 tes browser** lulus, beserta build/TypeScript dan lint. Review visual terbatas pada posisi tooltip tidak menemukan masalah material.

## Tahap 3: polesan visual (P10–P14)

### P10. Label wilayah Rendah

Label "nama nilai" (contoh Kota Semarang 10,4%) tampil untuk wilayah berkategori Rendah pada tahun terpilih dan dalam cakupan filter: 2019 tanpa label; 2021 Kab. Grobogan 9,6%, Kab. Wonogiri 14,0%, Kota Magelang 13,3%; 2022 Kota Semarang 10,4%, Kota Magelang 13,9%. Wilayah kecil memakai leader line. Label digambar di luar layer zoom sehingga ikut zoom/pan dengan ukuran huruf tetap, berhalo putih, dan `aria-hidden`. Tata letak menghindari label lain, kotak inset Karimunjawa, dan tombol zoom; tes bounding box memeriksa semuanya pada 1672, 1366, dan 390 px untuk 2021 dan 2022. Bila tidak ada tempat bebas, label dihilangkan daripada menimpa elemen lain.

### P11. Tabel 5 baris mengikuti mockup Tugas 3

Mockup Tugas 3 menampilkan lima baris, dan dashboard kini kembali menampilkan **5 baris** secara default. Alasannya: wilayah yang dipilih dari peta, titik kota, atau dropdown harus langsung terlihat tanpa menggulir tabel. Bila wilayah itu di luar lima besar, ia ditampilkan sebagai baris keenam (garis putus-putus di atasnya) dengan nomor peringkat aslinya; isi lima besar tidak berubah. Saat "Lihat semua (N)" aktif, tabel bergulir di dalam panel ke baris terpilih tanpa menggulir halaman. Tombol "Lihat semua (N)" / "Tampilkan 5 besar" muncul bila cakupan berisi lebih dari 5 wilayah, termasuk cakupan Kota (6 wilayah).

Syarat tinggi tetap berlaku: header sampai baris ekspor muat dalam viewport 1280×600, 1366×650, 1366×768, 1536×730, dan 1672×941. Tabel menggulir di dalam panel dan tidak memanjangkan halaman ringkasan; tes Playwright memeriksa kelima ukuran itu dengan 5 baris tampil.

### P12. Penanda wilayah dan skip link

Penanda wilayah terpilih kini berupa overlay outline yang mengikuti batas wilayah dan digambar di atas tetangganya (sebelumnya garis tepi sebagian tertutup path tetangga). Fokus keyboard memakai overlay biru dengan cara yang sama. Kotak persegi **tidak dapat direproduksi di Chromium**: outline pada path sudah `none` pada semua keadaan. Sumber yang masuk akal di perangkat sentuh adalah tap highlight bawaan browser pada elemen SVG, sehingga `-webkit-tap-highlight-color: transparent` dan `outline: none` untuk semua status fokus kini diterapkan pada path dan penanda kota. Ini belum diuji di Safari atau perangkat sentuh fisik.

Skip link juga **tidak dapat direproduksi** setelah klik mouse di Chromium (klik tautan tren, reset, dropdown, peta, area kosong); ia hanya muncul setelah Tab. Aturan `.skip-link:focus` diganti `:focus-visible` agar fokus non-keyboard tidak pernah menampilkannya. Penyebab pasti di browser lain belum terbukti.

### P13. Label tren

Mode Rata-rata, Satu wilayah, dan Kota vs Kab. menampilkan label angka; Multiwilayah hanya lewat hover. Pada dua seri, label seri yang lebih tinggi selalu di atas titik. Label seri yang lebih rendah ditaruh di bawah titik bila jarak kedua titik di layar kurang dari 28 px (tinggi label di atas titik ±22 px ditambah jari-jari penanda ±5 px), selain itu keduanya di atas. Jarak dihitung dari skala sumbu Y Recharts, sehingga ikut berubah menurut tinggi grafik. Pada desktop 1672 px: 2019 (selisih 3,1 pp) dan 2021 (1,0 pp) Kota di bawah, 2022 (5,9 pp) keduanya di atas, sehingga 15,8% tidak menumpang garis target 14%. Tes berjalan pada 1672 px dan 390 px, memeriksa posisi menurut aturan 28 px, tidak ada label yang saling menimpa, tidak ada label yang menutupi penanda mana pun (tanpa pengecualian), dan tidak ada label di garis 14%. Titik 2019 tetap tanpa garis penyambung dan 2020 tanpa label.

### P14. Mobile

Kolom nama wilayah di tabel sticky dengan latar solid (termasuk baris terpilih/hover), scroll horizontal dipertahankan. Kartu K6 di panel detail span 2 kolom pada breakpoint yang sama dengan saat grid menjadi 2 kolom (maks 960 px); diuji pada 390, 768, 960 (span) dan 961 px (tiga kolom).

Screenshot desktop 1672×941 dan mobile 390 px untuk 2021 dan 2022 berada di `.impeccable/review/p10-*.png` (tidak dilacak Git).

## Tahap 5: visual K6 (CBQ 2), 20 November 2026

Branch `perbaikan/tahap-5-visual-k6` dari `main` (`65845c6`, tag `sebelum-visual-k6`), setelah `npm ci`.

### A1. Ringkasan K6 di bawah tabel

Angka dihitung dari nilai asli (selisih dalam perseratus), dibulatkan saat ditampilkan, dan dicocokkan dengan CSV:

| Cakupan | Naik | Tetap | Turun | Teks |
| --- | --- | --- | --- | --- |
| Semua (35) | 6 | 1 | 28 | Kenaikan terbesar Kab. Pati +3,6 pp (3,62) |
| Kabupaten (29) | 6 | 1 | 22 | Kenaikan terbesar Kab. Pati +3,6 pp |
| Kota (6) | 0 | 0 | 6 | Semua 6 kota turun; penurunan paling lambat Kota Surakarta -2,6 pp (-2,56) |

"Tetap" = |K6| < 0,005 pp, hanya Kab. Pekalongan (23,5 → 23,5). Ringkasan tidak berubah saat tahun diganti. Tanda minus memakai helper `signed()` yang sudah ada (tanda hubung "-"), sama seperti kolom tabel.

Tinggi tabel di dalam panel peringkat (sebelum → sesudah A1): 1280×600 84 → 87 px, 1366×650 125 → 98 px, 1366×768 228 → 200 px, 1536×730 187 → 159 px, 1672×941 337 → 309 px. Pada tinggi ≤ 640 px kotak memakai teks pendek, dan ruangnya diambil dari panel Kota vs Kabupaten (tinggi minimum 156 → 128 px, legenda kategori disembunyikan karena sama dengan legenda peta, ketebalan batang menyesuaikan). Tanpa langkah ini tabel di 1280×600 hanya 56 px. Tes memastikan kedua batang Kota/Kabupaten tetap tidak bersentuhan di kelima viewport.

### A2. Panel Perubahan Prevalensi 2019→2022 (K6)

- Jumlah batang per cakupan 35/29/6, urutan K6 menurun, dan label nilai di ujung batang cocok dengan kolom `k6_perubahan_2019_2022` maupun selisih prevalensi 2022 − 2019 di CSV. Pembulatan setengah menjauhi nol, misalnya Kab. Brebes -5,55 → -5,6. Domain: Semua -20,06 sampai 4,12 dengan tick -20 sampai 0. Pada Kota, sisi kanan diperlebar secukupnya agar label "Naik (memburuk) →" muat.
- Tidak ada label yang menimpa label lain atau batang mana pun, dan semua label berada di dalam panel. Diuji di 1672 px dan 390 px untuk ketiga cakupan, tanpa overflow horizontal halaman. Di ≤ 560 px kartu berada di atas grafik selebar penuh, dan label arah dibuat dua baris.

### Keterhubungan

- Klik batang memakai `setSelected` yang sama dengan klik peta. Tes memeriksa sorotan di peta, tabel, dan grafik K6, panel detail, serta cakupan yang tidak berubah.
- Posisi diukur dari batang yang diklik, bukan dari `scrollY`. Panel detail muncul di atas grafik, dan batang tetap di posisi layar yang sama (selisih ≤ 1 px; contoh pada pengukuran: 472,8 → 472,7 px), baik lewat klik maupun Enter. Scroll anchoring bawaan Chrome ternyata tidak menahan posisi ini (batang bergeser ±297 px), sehingga kompensasi dilakukan sendiri sebelum frame dilukis.
- Pengumuman memakai live region Tahap 1 yang sudah ada. Tautan "Detail {wilayah} ↑" memindahkan fokus ke judul panel detail.
- Keyboard memakai satu Tab stop (roving tabindex), ↑/↓/Home/End, dan Enter. Nama aksesibel setiap batang dicocokkan dengan CSV untuk 35 wilayah.

### Pemeriksaan

TypeScript, ESLint, 94 tes unit, dan 64 tes browser lulus. `uji-stimulus.spec.ts` tidak dijalankan pada cek rutin karena menulis ulang gambar `docs/pengujian/stimulus`. `git status` untuk `docs/pengujian/` bersih, dan `/uji/` beserta isi formulirnya tidak diubah (`uji.spec.ts` dan `uji.test.ts` tetap lulus). Build produksi sesuai lockfile lulus tanpa peringatan; chunk `visualization` tetap 460,02 kB (gzip 131,63 kB) karena panel K6 berupa SVG tanpa Recharts.

## Tahap 6: polish UI, 21 November 2026

Branch `perbaikan/tahap-6-polish-ui` dari `main` (`c4402e4`, tag `sebelum-polish-ui`). Murni perubahan tampilan: tidak ada angka, data, atau fungsi ekspor yang berubah (`export.ts` tidak disentuh), dan `public/data/`, `src/uji`, `uji/`, `docs/pengujian` tidak berubah.

- Design token (jarak 16 px, padding, enam peran huruf) dan lantai 12 px untuk teks desktop, termasuk label peta (12 px di layar, bukan satuan SVG) dan keterangan inset Karimunjawa.
- Header dua baris: judul satu baris; subjudul dan kontrol (Tahun, Wilayah, Reset, Unduh CSV; semua 40 px) sejajar vertikal. Angka 35 pada subjudul dihitung dari semua wilayah, tidak berubah saat cakupan diganti. Footer ringkasan dihapus; tautan Tren pindah ke baris legenda Kota vs Kabupaten, tautan Detail ke judul legenda peta.
- Kode "K6" tidak muncul lagi di teks, aria-label, tooltip, maupun live region (header kolom "Perubahan 2019→2022" dua baris; panel "Perubahan Prevalensi 2019→2022"). Nama kolom ekspor `k6_perubahan_2019_2022` dan istilah KPI K6 tetap.
- Mode satu layar hanya bila tabel tetap ≥ 80 px. Ambang diukur per 10 px: 720 px untuk lebar ≥1190 px (tabel 95–98 px di 1280/1366), 790 px untuk lebar 1100–1189 px (86 px di 1100). Di bawahnya halaman bergulir, tabel tampil lima baris penuh (262 px), dan legenda Kota vs Kabupaten tampil. Aturan pemadatan layar pendek dan teks ringkasan versi pendek dihapus.

| Ukuran | Mode | Tabel | h1 / h2 | Gap | Selisih pusat subjudul–kontrol | scrollWidth | "K6" terlihat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1672×941 | satu layar | 290 px | 32 / 22 px | 16 | 0 | 1672 | 0 |
| 1366×768 | satu layar | 141 px | 30,1 / 18,0 px | 16 | 0 | 1366 | 0 |
| 1280×720 | satu layar | 98 px | 28,2 / 18 px | 16 | 0 | 1280 | 0 |
| 1280×719 dan 1280×600 | gulir | 262 px | 28,2 / 18 px | 16 | 0 | 1280 | 0 |
| 1100×790 | satu layar | 86 px | 24,2 / 18 px | 16 | kontrol turun ke bawah subjudul | 1100 | 0 |
| 1100×789 | gulir | 262 px | 24,2 / 18 px | 16 | kontrol turun ke bawah subjudul | 1100 | 0 |
| 390×844 | gulir | 270 px | 25 / 20–22 px | n/a (satu kolom) | kontrol turun ke bawah subjudul | 390 | 0 |

Teks terkecil di desktop 12 px (di ponsel tetap 9 sampai 10 px, di luar cakupan). Di 1366×768 tabel tetap menampilkan sekitar 2,5 baris; tidak diubah di tahap ini.

Pembaruan tes: `dashboard.spec.ts` (teks header/ringkasan/catatan, subjudul selalu 35, tombol Unduh CSV, tes fit-to-screen ditulis ulang untuk ambang baru, tes mode gulir baru, tes kontrol header dan tautan lewat keyboard), `k6.spec.ts` (judul panel dan live region), `markers.spec.ts` (tautan tren), `data-audit.spec.ts` (tombol ekspor), `k6.test.ts` (ringkasan tanpa versi pendek) dan `data.test.ts` (`K6_LABEL`). 94 tes unit dan 75 tes browser (tanpa `uji-stimulus.spec.ts`) lulus, bersama TypeScript, ESLint, dan build produksi tanpa peringatan.

Perbaikan setelah audit: (1) kotak inset Karimunjawa kembali ke ukuran semula (145×110 satuan SVG) dan hanya teks keterangannya yang membesar agar ≥ 12 px di layar ("Karimunjawa" bila nama lengkap tidak muat), sehingga tidak lagi menutupi barat Jawa Tengah dan marker Kota Tegal; (2) header "Perubahan 2019→2022" benar-benar dua baris (kedua baris dibungkus satu `inline-block` di dalam tombol) dan tabel tidak lagi bergulir ke samping di 1672, 1366, dan 1280×720. Tesnya ada di `layout-fixes.spec.ts`.

Regresi lebar 1100–1190 px: tabel sempat bergulir ke samping (538 lawan 466 di 1100×790) padahal di `main` tidak. Perbaikannya: header "Peringkat prevalensi" juga dua baris (pola `.th-label` yang sama) dan padding horizontal sel 4 px pada lebar 1100–1189 px. Hasil: `scrollWidth` = `clientWidth` di 1672, 1366, 1280×720, 1190×800 (511), dan 1100×790 (466); tidak ada overflow pada sapuan lebar 1100–1300 px per 10 px di tinggi 789, 790, dan 800. Tabel di 1100×790 setinggi 86 px, jadi ambang 790 px tidak perlu dinaikkan. Ukuran 1190×800, 1100×790, dan 1100×789 masuk `layout-fixes.spec.ts`.

Catatan untuk tim: `src/uji/content.ts:80` masih menyebut "kolom K6 pada tabel" dan perlu diganti menjadi "kolom Perubahan 2019→2022" sebelum pengujian ke responden (berkas itu sengaja tidak diubah di tahap ini).

## Tahap 7: ruang tabel, 23 November 2026

Tujuan: lima baris default tabel Peringkat Wilayah terlihat penuh di 1536×730 dalam mode satu layar, minimal lima di 1366×768, dan minimal empat di 1280×720. Titik aman: tag `sebelum-ruang-tabel` (`50168b0`). Angka yang tampil dan isi ekspor CSV tidak berubah; ambang mode satu layar (720/790 px), ringkasan perubahan di bawah tabel, dan panel di bawah ringkasan tidak diubah.

- Kontrol header desktop 32 px (Reset 32×32, ikon 16 px, teks 13 px, label 600 dan nilai 500); ponsel tetap 40 px.
- Token huruf turun satu tingkat: h1 clamp(22px, 2vw, 28px), h2 clamp(16px, 1.15vw, 19px), judul 14 px, nilai KPI clamp(28px, 4.4vh, 38px), isi 13 px, kecil tetap 12 px. h1 tetap satu baris dari 1100 sampai 1672 px.
- Panel Kota vs Kabupaten: judul sumbu "Prevalensi (%)" dan legenda kategori dihapus (tick sudah ber-%, legenda yang sama ada di peta), tautan "Lihat tren ↓" pindah ke baris judul. Dalam mode satu layar tinggi panel mengikuti isi (grafik 88 px, batang 16 px dengan jarak 9,5 px). aria-label grafik tetap.
- Catatan kaki tabel pindah ke popover tombol ⓘ ("Keterangan tabel") di sebelah judul, di semua ukuran layar. Isinya sama, termasuk definisi perubahan (`K6_NOTE`).
- Baris tabel 32 px di semua desktop ≥1100 px.
- Catatan kartu ke-4 saat capaian 0 menjadi "belum ada yang mencapai target". Sebelumnya teks ini wrap di 1280 px dan membuat keempat kartu lebih tinggi (1280×720, 2019: kartu 131 → 103 px, tabel 79 → 184 px).

Hasil ukur (Chromium, tahun 2022; 2019 sama kecuali disebut). "Baris" = baris yang terlihat penuh di bawah header tabel.

| Ukuran | Mode | Header | Kartu | Kota vs Kab. | Tabel sebelum → sesudah | Baris sebelum → sesudah | Teks terkecil | h1 satu baris |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1672×941 | satu layar | 86 → 74 | 121 → 110 | 182 → 134 | 290 → 405 | 5 → 5 | 12 px | ya |
| 1536×730 | satu layar | 86 → 74 | 112 → 103 | 156 → 133 | 116 → 204 | 2 → 5 | 12 px | ya |
| 1366×768 | satu layar | 84 → 73 | 115 → 105 | 156 → 132 | 141 → 227 | 2 → 5 | 12 px | ya |
| 1280×720 | satu layar | 82 → 71 | 112 → 103 (2019: 131 → 103) | 156 → 132 | 98 → 184 (2019: 79 → 184) | 1 → 4 | 12 px | ya |
| 1190×800 | satu layar | 79 → 69 | 116 → 107 (2019: 135 → 107) | 156 → 132 | 175 → 262 (2019: 157 → 262) | 3 → 5 | 12 px | ya |
| 1100×790 | satu layar | 107 → 66 | 135 → 106 | 156 → 132 | 86 → 255 | 1 → 5 | 12 px | ya |
| 390×844 | gulir | 235 → 235 | 130 → 130 | 295 → 252 | 274 → 274 | – | 10 px (ponsel, di luar cakupan) | tidak (dua baris, seperti sebelumnya) |

Di 1100×790 kontrol header kini muat sebaris dengan subjudul, sehingga header turun dari 107 ke 66 px. Tidak ada scroll ke samping pada halaman maupun tabel di 1672, 1536, 1366, 1280, 1190, dan 1100 (juga saat 35 wilayah ditampilkan). Di 390 px tabel tetap bergulir ke samping dengan kolom nama sticky (P14).

**Ambang 720 px (hanya dilaporkan, tidak diubah).** Dengan aturan mode satu layar dipaksa aktif dan tinggi diturunkan per 10 px (nilai terburuk dari 2019 dan 2022):

| Lebar | Tinggi terendah dengan tabel ≥ 80 px | Tinggi terendah dengan ≥ 2 baris penuh | Tinggi terendah dengan ≥ 4 baris penuh |
| --- | --- | --- | --- |
| 1280 | 620 px (88 px, 1 baris; 610 px = 78 px) | 640 px (108 px) | 710 px (174 px) |
| 1366 | 620 px (86 px, 1 baris; 610 px = 76 px) | 640 px (106 px) | 710 px (172 px) |
| 1190 | 610 px (80 px, 1 baris) | 640 px (110 px) | 710 px (177 px) |

Jadi dengan kriteria lama (tabel ≥ 80 px) ambang untuk lebar ≥1190 px bisa turun dari 720 ke 620 px, tetapi pada tinggi itu tabel hanya menampilkan satu baris penuh. Kriteria minimal dua baris memberi 640 px.

Pembaruan tes:
- `dashboard.spec.ts`: kontrol header 32 px di desktop dan 40 px di 390 px (teks 13 px, ikon 16 px, bobot 600/500); tautan tren bernama "Lihat tren ↓"; catatan tabel dibaca dari popover ⓘ; tes di bawah ambang tidak lagi mewajibkan overview lebih tinggi dari layar (di 1280×719 overview alami kini sekitar 690 px) dan memeriksa bahwa panel Kota vs Kab. tanpa legenda dengan tautan di baris judul; teks kartu K4 baru.
- `markers.spec.ts`: nama tautan tren.
- `visual-encoding.spec.ts`: grafik batang yang di-mask tidak lagi memuat judul sumbu "Prevalensi (%)".
- `data.test.ts`: teks `achievementNote` untuk capaian 0.
- `layout-fixes.spec.ts`: tambah 1536×730; cek scroll samping halaman dan tabel, juga saat 35 wilayah tampil.
- Baru, `ruang-tabel.spec.ts`: popover ⓘ (klik, Enter, Spasi, hover, Escape mengembalikan fokus, klik di luar dan klik ulang menutup, isi, di dalam viewport dan tidak tertutup panel lain di lima ukuran, area sentuh ponsel), jumlah baris terlihat penuh (1536×730 = 5, 1366×768 ≥ 5, 1280×720 ≥ 4; 2019 dan 2022; baris 32 px), serta kartu yang tingginya sama di 2019 dan 2022 pada 1280×720.

94 tes unit dan 89 tes browser (tanpa `uji-stimulus.spec.ts`) lulus, bersama TypeScript, ESLint, dan build produksi tanpa peringatan. `git status docs/pengujian/` bersih.

**Catatan stimulus pengujian.** Gambar stimulus di `docs/pengujian/` diambil dari tampilan sebelum Tahap 6, jadi tidak lagi sama dengan dashboard (kontrol header, ukuran huruf, catatan tabel, dan panel Kota vs Kabupaten tanpa legenda). Gambar itu perlu diambil ulang setelah tampilan final disetujui. Folder tersebut sengaja tidak diubah di tahap ini. Bila potongan panel batang dipakai sebagai stimulus, kunci kategori perlu disertakan karena panel itu tidak lagi memuat legenda sendiri (lihat `VISUAL_ENCODING.md`).
