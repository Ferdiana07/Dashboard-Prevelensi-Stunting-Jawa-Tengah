# Dashboard Prioritas Intervensi Stunting Jawa Tengah

Dashboard interaktif untuk proyek mata kuliah Visualisasi Data. Menampilkan prevalensi stunting di 35 kabupaten/kota Jawa Tengah pada **2019, 2021, dan 2022**, menggunakan CSV dan batas geografis yang diberikan. Susunan utama mengikuti gambar referensi: empat KPI, peta di kiri, serta grafik perbandingan dan tabel di kanan. Analisis tren berada di bawahnya.

## Menjalankan

Memerlukan Node.js 22.12+ atau versi LTS lebih baru yang didukung Vite, serta npm.

```sh
npm install
npm run dev
```

Buka **http://127.0.0.1:5173/**. Jika port dipakai aplikasi lain, gunakan alamat yang dicetak Vite. Semua pemrosesan data berlangsung di browser, tanpa backend atau kunci API. Font disertakan secara lokal; aplikasi tidak memanggil layanan peta, font, atau data eksternal.

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

Hasil build berada di `dist/`, siap dilayani oleh hosting statis. Jalankan melalui HTTP, bukan membuka `index.html` dengan `file://`, karena data dimuat menggunakan fetch. Untuk hosting di subdirektori, tetapkan `base` yang sesuai pada `vite.config.ts` sebelum build.

## Teknologi dan struktur

React + TypeScript, Vite, Tailwind CSS (integrasi Vite dan token font), CSS komponen, Recharts, D3 Geo/Selection/Zoom, PapaParse, Lucide React, Inter Variable, Vitest, dan Playwright.

```text
public/
  data/
    stunting.csv          # Salinan CSV asli
    jateng.geojson        # Salinan GeoJSON asli
    README.md             # Asal berkas dan batasan provenance
src/
  components/             # Filter, KPI, peta, grafik, tabel, detail, tren
  hooks/useDataset.ts     # Loading, error, pembatalan permintaan
  lib/
    data.ts               # Parsing, normalisasi, validasi, fetch
    calculations.ts       # Rumus KPI, kategori, cakupan, perubahan
    export.ts             # Ekspor CSV cakupan filter
    format.ts             # Format angka Indonesia
  types/                  # Tipe domain dan GeoJSON
  styles/index.css        # Token visual, komponen, breakpoint
  App.tsx                 # Shared state tahun dan wilayah
tests/
  unit/                   # Validasi data asli dan rumus
  e2e/                    # Interaksi, responsivitas, ekspor, error state
```

## Dataset dan validasi

`public/data/stunting.csv` berasal dari `prevalensi_stunting_jateng_2019_2022_clean.csv` yang dilampirkan pengguna. Memuat 105 baris, 35 wilayah per tahun, dengan kolom:

| Kolom sumber | Penggunaan |
| --- | --- |
| `kode_wilayah` | Kunci identitas string; join dengan GeoJSON |
| `wilayah` | Nama tampilan, termasuk awalan Kab./Kota |
| `nama_asli` | Dipertahankan dalam CSV asli |
| `tipe_wilayah` | `Kabupaten` atau `Kota` |
| `tahun` | 2019, 2021, atau 2022 |
| `prevalensi` | Persentase numerik, presisi asli |
| `peringkat`, `kategori`, `k5_jarak_target`, `k6_perubahan_2019_2022` | Dipertahankan; hasil tampilan dihitung ulang, tidak memakai nilai turunan sumber sebagai konstanta |

Parser menghapus BOM dan whitespace header, menormalkan CRLF/LF, menerima pemisah desimal titik atau koma dalam field CSV yang dikutip dengan benar, lalu mengonversi tahun/prevalensi menjadi angka. Kode tetap string. Validasi menolak header wajib yang hilang, data kosong/non-numerik/di luar 0–100, tipe/tahun tak didukung, kode duplikat, tahun dengan jumlah wilayah selain 35, atau identitas/cakupan wilayah yang berubah. Geometri harus memuat 35 kode unik yang cocok dengan CSV, bertipe Polygon/MultiPolygon, dengan koordinat numerik yang valid. Kegagalan ditampilkan sebagai pesan error dengan tombol muat ulang.

Rata-rata berikut adalah **rata-rata sederhana antarwilayah, bukan rata-rata tertimbang berdasarkan jumlah balita**, dan bukan estimasi prevalensi provinsi yang memperhitungkan desain survei.

## Enam indikator

Perhitungan memakai presisi asli; pembulatan satu desimal hanya pada tampilan. `pp` berarti poin persentase, bukan persentase perubahan relatif.

| Indikator | Rumus |
| --- | --- |
| K1 · Rata-rata prevalensi | Jumlah prevalensi ÷ jumlah wilayah dalam cakupan |
| K2 · Wilayah di atas 14% | Jumlah wilayah dengan prevalensi > 14%; keterangan = jumlah tersebut ÷ total × 100% |
| K3 · Selisih kab–kota | Rata-rata kabupaten − rata-rata kota dalam cakupan; **Tidak berlaku** jika salah satu kelompok tidak ada |
| K4 · Persentase capai target | Jumlah wilayah dengan prevalensi ≤ 14% ÷ total × 100% |
| K5 · Jarak ke target | Prevalensi wilayah pada tahun terpilih − 14%; negatif berarti di bawah target |
| K6 · Perubahan 2019–2022 | Prevalensi wilayah 2022 − prevalensi wilayah 2019 |

Antarmuka menggunakan label **Target** dan **Perubahan 2019–2022**, tanpa kode K5/K6. Pada 2021, label perubahan menjadi **Perubahan 2019–2021**. Pada 2019, perubahan dari baseline ditampilkan `—` karena 2019 adalah tahun awal pembanding; data prevalensinya tetap tersedia. Catatan tabel dan tooltip tanda tersebut menjelaskan alasannya. Tooltip dan detail memisahkan perubahan sejak 2019 dari perubahan terhadap **tahun sebelumnya yang tersedia**: 2019 untuk 2021, serta 2021 untuk 2022. Temanggung, misalnya, memiliki perubahan 2019–2022 +3,11 pp, sedangkan perubahan 2021–2022 adalah +8,4 pp.

Nilai acuan yang diuji terhadap data asli:

| Tahun | K1 | K2 | K3 | K4 |
| --- | --- | --- | --- | --- |
| 2019 | 27,1% | 35 dari 35 | 3,1 pp | 0,0% |
| 2021 | 20,0% | 32 dari 35 | 1,0 pp | 8,6% |
| 2022 | 20,7% | 33 dari 35 | 5,9 pp | 5,7% |

Pada 2022, rata-rata kota 15,8% dan kabupaten 21,7%. K5 terbesar: Brebes +15,1 pp. K6 peningkatan terbesar: Pati +3,62 pp. Urutan lima prevalensi tertinggi: Brebes 29,1%, Temanggung 28,9%, Magelang 28,2%, Purbalingga 26,8%, Blora 25,8%.

## Peta, warna, dan geometri

`public/data/jateng.geojson` adalah salinan **tanpa penyederhanaan** dari `batas_kabkota_jateng.geojson` yang dilampirkan. Memuat 35 Feature, dengan `properties.kode_wilayah` sebagai kunci join. Tidak ada geometri buatan. Sumber upstream dan lisensi tidak disertakan dalam lampiran, sehingga tidak diklaim berasal dari repositori atau instansi tertentu; lihat `public/data/README.md`.

Peta D3 menggunakan tampilan planar equirectangular koordinat bujur/lintang dengan sumbu Y dibalik. Ini merupakan peta eksplorasi prevalensi, bukan alat pengukuran luas atau jarak. Poligon di utara lintang −6,15° ditampilkan dalam inset Karimunjawa dengan **skala berbeda**; semua koordinat aslinya tetap digunakan. Pulau kecil lainnya tetap dipertahankan. Enam kota mendapat titik di centroid agar mudah diakses melalui klik dan keyboard.

| Kategori | Ambang asli, sebelum pembulatan | Warna | Jumlah 2022 |
| --- | --- | --- | --- |
| Mencapai target | ≤ 14% | Hijau | 2 |
| Perlu perhatian | > 14% dan < 20% | Kuning | 15 |
| Prioritas tinggi | ≥ 20% | Merah | 18 |

Warna batang mengikuti kategori nilainya. Legenda selalu menghitung ulang cakupan. Wilayah di luar filter berwarna abu-abu, tetapi tetap dapat dipilih. Hover/fokus memperlihatkan nilai tahun terpilih beserta keterangan di luar cakupan bila sesuai. Tombol +/− mengatur zoom; drag/pinch untuk pan/zoom dan tombol reset mengembalikan tampilan. Wheel halaman tidak dibajak oleh peta. Inset tetap pada tempatnya ketika peta utama diperbesar.

## Cara kerja filter dan interaksi

Pada desktop (lebar ≥1100 px dan tinggi area browser ≥600 px), ringkasan utama menyesuaikan tinggi layar melalui `100svh`: header, empat KPI, peta, grafik, tabel, dan tombol ekspor berada dalam satu layar. Tabel dapat digulir di dalam panel pada layar pendek atau ketika seluruh wilayah ditampilkan. Detail dan analisis tren berada di bawah ringkasan dan dapat diakses dengan menggulir halaman. Tablet, ponsel, dan jendela yang sangat pendek memakai aliran halaman biasa agar isi tetap terbaca.

- Tahun default 2022. Tidak ada pilihan 2020.
- Filter wilayah mencakup semua wilayah, 29 kabupaten, 6 kota, atau satu wilayah berdasarkan kode, sehingga kabupaten/kota dengan nama sama tetap terpisah.
- KPI, legenda, warna peta, perbandingan, dan peringkat memakai cakupan yang sama. Klik peta, titik kota, atau nama di tabel memilih satu wilayah, memperbarui dropdown, menyorotnya, membuka detail, dan mengarahkan tren ke wilayah itu.
- Grafik batang menampilkan satu kelompok saja jika cakupan hanya memiliki satu tipe; ada penjelasan mengapa perbandingan dua kelompok tidak tersedia.
- Tabel default lima besar, bisa menampilkan semua hasil, mencari nama, dan mengurutkan prevalensi/K5/perubahan dua arah. Nomor peringkat tetap peringkat prevalensi dalam cakupan, meskipun urutan tampilan dipilih berdasarkan perubahan. Pada tahun yang sama, urutan K5 sama dengan prevalensi karena target konstan.
- **Ekspor CSV cakupan** mengunduh seluruh baris tahun/wilayah yang dipilih, beserta indikator terhitung dengan presisi asli. Pencarian dan batas lima besar pada tabel tidak membatasi ekspor; tombolnya menjelaskan bahwa ekspor berdasarkan cakupan.
- **Reset Filter** mengembalikan tahun 2022, semua wilayah, pencarian kosong, lima besar, urutan prevalensi, tren default, dan zoom awal.
- Mode tren: rata-rata cakupan, satu wilayah, hingga lima wilayah, atau dua rata-rata kelompok provinsi. Mode kelompok secara eksplisit memakai seluruh kota/kabupaten provinsi agar keduanya tetap dapat dibandingkan. Kontrol tren dapat mengganti wilayah tanpa mengubah cakupan dashboard utama.
- Grafik memakai sumbu tahun numerik. Tahun 2020 bernilai `null`, garis terputus dengan label **data tidak tersedia**, tanpa interpolasi, estimasi, atau pengisian nol. Titik 2019 tetap terlihat walaupun terpisah dari segmen 2021–2022.

## Memperbarui data

1. Ganti `public/data/stunting.csv` dengan struktur kolom wajib yang sama. Jaga kode wilayah konsisten sebagai string.
2. Ganti `public/data/jateng.geojson` jika sumber batas diperbarui; setiap kode CSV harus memiliki tepat satu Feature.
3. Jalankan `npm test`, `npm run test:e2e`, lint, typecheck, dan build. Hasil acuan harus diperbarui hanya bila ada revisi data yang terverifikasi, bukan untuk menutupi kesalahan rumus.
4. Periksa ulang tooltip, kategori, dan kecocokan geometri. Validator saat ini sengaja membatasi 35 wilayah dan tiga tahun historis. Penambahan tahun memerlukan perubahan eksplisit pada `YEARS`, panel tren, label perubahan, validator, dan pengujian.

## Batasan interpretasi

Target **14% digunakan sebagai acuan historis periode analisis**, bukan klaim target terbaru. Hijau pada kartu capaian menunjukkan identitas indikator, bukan bahwa proporsi capaian 5,7% sudah baik; kartu menyebut **baru 2 dari 35 wilayah**.

Dashboard mendukung prioritisasi berdasarkan prevalensi. Dashboard tidak menggantikan penentuan lokus intervensi resmi, yang dapat mempertimbangkan jumlah balita, jumlah kasus, ketidakpastian survei, akses layanan, dan indikator tambahan. Data lampiran tidak menyediakan pembobot populasi, interval kepercayaan, atau metodologi survei rinci; aplikasi tidak mengarangnya.

## Pengujian

Vitest memeriksa data 105 baris, join 35 kode, batas kategori, semua KPI acuan, K5/K6, perbedaan periode pembanding, pembulatan, filter, dan penolakan data tidak valid. Playwright memeriksa perubahan filter, sinkronisasi keyboard/peta/detail/tren, tooltip, pencarian, sorting, zoom, ekspor, empat mode tren, batas lima seri, loading/error state, console browser, dan overflow pada 360–1672 px. Screenshot desktop/mobile tersimpan di `.impeccable/review/` setelah tes browser berjalan.
