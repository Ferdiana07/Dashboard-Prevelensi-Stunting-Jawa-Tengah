# Hasil verifikasi implementasi

Verifikasi awal dilaksanakan pada 16 November 2026, dilanjutkan audit data seluruh komponen pada **18 November 2026**, menggunakan CSV dan GeoJSON lampiran pengguna.

| Pemeriksaan | Hasil |
| --- | --- |
| Parsing dan cakupan CSV | 105 baris; 35 wilayah pada masing-masing 2019, 2021, 2022 |
| Join geometri | 35 kode unik, cocok satu-ke-satu dengan CSV |
| Tes unit Vitest | 75 lulus, termasuk pembulatan, ekspor vs CSV sumber, K6, encoding, dan posisi tooltip |
| Tes browser Playwright Chromium | 52 lulus, termasuk audit data, viewport, masking, tooltip, label peta, penanda wilayah, label tren, dan mobile |
| TypeScript | Lulus, termasuk pemeriksaan pada build |
| ESLint | Lulus |
| Build produksi | Lulus; peringatan chunk >500 kB (chunk visualization) sudah ada sebelum Tahap 3 |
| Smoke test build produksi | HTTP 200, KPI default benar, 35 geometri, filter kota 15,8% |
| Console browser | Tidak ada error atau warning pada tes tangkapan layar dan smoke test produksi |
| Overflow halaman | Tidak ditemukan pada lebar 360, 390, 768, 1024, 1366, 1672 px |
| Tinggi ringkasan desktop | Header sampai ekspor berada dalam viewport 1280×600, 1366×650, 1366×768, 1536×730, dan 1672×941; tabel menggulir di dalam panel |
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

### P11. Tabel 10 baris menyimpang dari mockup Tugas 3

Mockup Tugas 3 menampilkan lima baris. Dashboard sekarang menampilkan **10 baris** secara default. Alasannya: pada layar desktop panel peringkat punya ruang vertikal yang cukup untuk lebih dari lima baris, dan dengan 10 baris pembaca langsung melihat sepertiga wilayah teratas tanpa menekan tombol. Tombol berubah menjadi "Lihat semua (N)" / "Tampilkan 10 besar" dan hanya muncul bila jumlah wilayah dalam cakupan lebih dari 10. Cakupan Kota (6 wilayah) langsung tampil seluruhnya.

Syarat tinggi tetap berlaku: header sampai baris ekspor muat dalam viewport 1280×600, 1366×650, 1366×768, 1536×730, dan 1672×941. Tabel menggulir di dalam panel dan tidak memanjangkan halaman ringkasan; tes Playwright memeriksa kelima ukuran itu dengan 10 baris tampil.

### P12. Penanda wilayah dan skip link

Penanda wilayah terpilih kini berupa overlay outline yang mengikuti batas wilayah dan digambar di atas tetangganya (sebelumnya garis tepi sebagian tertutup path tetangga). Fokus keyboard memakai overlay biru dengan cara yang sama. Kotak persegi **tidak dapat direproduksi di Chromium**: outline pada path sudah `none` pada semua keadaan. Sumber yang masuk akal di perangkat sentuh adalah tap highlight bawaan browser pada elemen SVG, sehingga `-webkit-tap-highlight-color: transparent` dan `outline: none` untuk semua status fokus kini diterapkan pada path dan penanda kota. Ini belum diuji di Safari atau perangkat sentuh fisik.

Skip link juga **tidak dapat direproduksi** setelah klik mouse di Chromium (klik tautan tren, reset, dropdown, peta, area kosong); ia hanya muncul setelah Tab. Aturan `.skip-link:focus` diganti `:focus-visible` agar fokus non-keyboard tidak pernah menampilkannya. Penyebab pasti di browser lain belum terbukti.

### P13. Label tren

Mode Rata-rata, Satu wilayah, dan Kota vs Kab. menampilkan label angka; Multiwilayah hanya lewat hover. Pada dua seri, seri bernilai lebih tinggi dilabeli di atas titik dan yang lebih rendah di bawah (2021: 20,1% di atas, 19,1% di bawah). Tes memeriksa tidak ada label yang saling menimpa atau menutupi penanda pada 2019, 2021, 2022. Titik 2019 tetap tanpa garis penyambung dan 2020 tanpa label. Pada 2022 label 15,8% berada di atas garis target 14%, tetap terbaca karena halo putih.

### P14. Mobile

Kolom nama wilayah di tabel sticky dengan latar solid (termasuk baris terpilih/hover), scroll horizontal dipertahankan. Kartu K6 di panel detail span 2 kolom pada breakpoint yang sama dengan saat grid menjadi 2 kolom (maks 960 px); diuji pada 390, 768, 960 (span) dan 961 px (tiga kolom).

Screenshot desktop 1672×941 dan mobile 390 px untuk 2021 dan 2022 berada di `.impeccable/review/p10-*.png` (tidak dilacak Git).
