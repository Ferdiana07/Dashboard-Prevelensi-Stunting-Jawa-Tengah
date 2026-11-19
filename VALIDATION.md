# Hasil verifikasi implementasi

Verifikasi awal dilaksanakan pada 16 November 2026, dilanjutkan audit data seluruh komponen pada **18 November 2026**, menggunakan CSV dan GeoJSON lampiran pengguna.

| Pemeriksaan | Hasil |
| --- | --- |
| Parsing dan cakupan CSV | 105 baris; 35 wilayah pada masing-masing 2019, 2021, 2022 |
| Join geometri | 35 kode unik, cocok satu-ke-satu dengan CSV |
| Tes unit Vitest | 66 lulus, termasuk pembulatan, ekspor vs CSV sumber, K6, encoding, dan posisi tooltip |
| Tes browser Playwright Chromium | 27 lulus, termasuk audit data, viewport, masking, dan tooltip |
| TypeScript | Lulus, termasuk pemeriksaan pada build |
| ESLint | Lulus |
| Build produksi | Lulus tanpa peringatan ukuran chunk |
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
| Tooltip dan detail | 105 pengamatan; status target, jarak target, perubahan sejak 2019, tahun sebelumnya yang tersedia, dan tiga nilai riwayat | Cocok |
| Tren satu wilayah | 35 wilayah × 3 tahun yang tersedia | Seluruh 105 titik cocok dengan CSV |
| Tren rata-rata | Seluruh wilayah, kota, dan kabupaten untuk 3 tahun | Seluruh nilai cocok |
| Tren kelompok dan multiwilayah | Kedua rata-rata provinsi serta tiga wilayah contoh pada 3 tahun | Label dan nilai cocok; cakupan kelompok provinsi dijelaskan |
| Tahun 2020 | Tidak ada observasi/titik; garis terputus dan keterangan data tidak tersedia | Tidak ada interpolasi atau data buatan |
| Ekspor CSV | Seluruh 105 pengamatan dari ekspor 3 tahun | Nilai sumber dan atribut turunan cocok |
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
