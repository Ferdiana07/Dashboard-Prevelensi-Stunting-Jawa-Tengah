# Dashboard Prioritas Intervensi Stunting Kabupaten/Kota di Jawa Tengah

Implementasi website interaktif dari laporan **Evaluasi Desain Dashboard Prioritas Intervensi Stunting Kabupaten/Kota di Jawa Tengah**, yang membahas desain idiom visual, visual encoding, serta layout dan grid dashboard. Proyek ini dikembangkan untuk mata kuliah **Visualisasi Data**, Departemen Informatika, Fakultas Sains dan Matematika, **Universitas Diponegoro, 2026**.

Dashboard menampilkan prevalensi stunting di **35 kabupaten/kota** pada **2019, 2021, dan 2022**. Tujuannya mendukung analisis wilayah prioritas bagi Dinas Kesehatan Provinsi Jawa Tengah dan Tim Percepatan Penurunan Stunting (TPPS). Susunan utama mengikuti rancangan dalam laporan: empat scorecard di atas, peta di kiri, serta grafik perbandingan dan tabel peringkat di kanan. Analisis tren menjadi panel tambahan di bawahnya.

## Identitas kelompok

**Kelompok 14**

| Anggota | NIM |
| --- | --- |
| Hadrian Shandhy Yudha | 24060124140207 |
| Gregorius Septiano Ariadi | 24060124120026 |
| Caesar Ferdiana Suwandi | 24060124120051 |
| Elang Fadila Ahmad | 24060124130108 |

**Dosen pengampu:** Dinar Mutiara Kusumo Nugraheni, S.T., M.InfoTech.(Comp)., Ph.D.

## Tujuan analisis

Empat **Critical Business Questions (CBQ)** menjadi dasar pemilihan indikator dan visualisasi:

| CBQ | Pertanyaan | Dukungan pada website |
| --- | --- | --- |
| 1 · Wilayah prioritas | Kabupaten/kota mana yang prevalensinya paling tinggi dan perlu diprioritaskan? | Peta, tabel peringkat, pencarian, dan detail wilayah |
| 2 · Perubahan 2019–2022 | Wilayah mana yang prevalensinya naik atau turunnya paling lambat? | Kolom perubahan, pengurutan perubahan, dan grafik tren |
| 3 · Capaian target | Wilayah mana yang belum mencapai target 14% dan seberapa besar kesenjangannya? | Scorecard, kategori peta, dan kolom Target |
| 4 · Kota dan kabupaten | Kelompok wilayah mana yang paling tertinggal? | Selisih rata-rata, grafik batang horizontal, dan tren kelompok |

## Dari evaluasi desain ke implementasi

Laporan menilai **mockup statis**. Repositori ini merupakan implementasi interaktif yang menindaklanjuti saran pada Subbab 4.2 laporan:

| Temuan atau saran dalam laporan | Implementasi pada website |
| --- | --- |
| Kolom “Δ thn sebelumnya” belum sesuai definisi K6 | Kolom **Perubahan 2019–2022** menghitung 2022 − 2019; perubahan tahun sebelumnya ditampilkan terpisah pada tooltip/detail |
| Jarak ke target belum terlihat sebagai angka per wilayah | Kolom **Target**, tooltip peta, dan detail menampilkan prevalensi − 14% |
| Perbandingan antartahun masih mengandalkan ingatan | Grafik tren menampilkan tahun yang tersedia berdampingan; 2020 menjadi celah tanpa estimasi |
| Kartu capaian hijau bisa memberi kesan hasil sudah baik | Keterangan default **“baru 2 dari 35 wilayah”** memperjelas rendahnya proporsi capaian |
| Filter, keterhubungan panel, dan tooltip masih berupa rancangan | Interaksi diimplementasikan dan diperiksa dengan pengujian otomatis |

Pengujian otomatis pada repositori memeriksa fungsi dan perhitungan, bukan uji pengguna. Tujuan desain agar ringkasan terbaca dalam waktu kurang dari tiga detik belum diuji melalui studi pengguna.

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
    README.md             # Asal berkas dan atribusi menurut laporan
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

Menurut laporan kelompok, sumber prevalensi adalah **Dinas Kesehatan Provinsi Jawa Tengah**, yang dipublikasikan melalui [Portal Satu Data Provinsi Jawa Tengah](https://data.jatengprov.go.id/dataset/42f-sdjt-prevalensi-stunting). Laporan mencantumkan lisensi **CC-BY**. Data bersih, batas wilayah, dan dokumentasi kelompok diarsipkan di [Zenodo, DOI: 10.5281/zenodo.24267455](https://doi.org/10.5281/zenodo.24267455).

Website membaca `public/data/stunting.csv`, salinan berkas bersih `prevalensi_stunting_jateng_2019_2022_clean.csv` yang dilampirkan. Formatnya **long**: satu baris per wilayah per tahun, total **105 baris**, terdiri dari **29 kabupaten dan 6 kota** pada setiap tahun. Menurut laporan, 2020 tidak digunakan karena berkas sumber hanya berisi header. Periode website dibatasi pada tiga tahun tersebut; tidak tersedia pilihan 2023–2025.

Prevalensi pada sumber didefinisikan sebagai jumlah balita pendek dan sangat pendek dibagi jumlah balita yang diukur, dikali 100%. Website menggunakan angka prevalensi yang sudah tersedia; website menghitung KPI dan atribut turunannya, bukan menghitung ulang prevalensi dari data individu.

Laporan menjelaskan pembersihan berupa penggabungan tiga berkas, pemeriksaan data kosong/duplikat, penghapusan `_id`, perapian nama, penambahan kode empat digit, dan pembentukan atribut turunan. Presisi data bersih adalah dua desimal untuk 2019 dan satu desimal untuk 2021/2022. Website mempertahankan presisi tersebut selama perhitungan. Kolom yang dibaca dan dipertahankan meliputi:

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

Pemetaan indikator ke idiom visual mengikuti laporan:

| KPI | CBQ | Nilai 2022, seluruh wilayah | Idiom visual |
| --- | --- | --- | --- |
| K1 | 3 | 20,7% | Scorecard |
| K2 | 1, 3 | 33 dari 35 wilayah; 94,3% | Scorecard |
| K3 | 4 | 5,9 pp; kabupaten 21,7% vs kota 15,8% | Scorecard dan horizontal bar chart |
| K4 | 3 | 5,7%; baru 2 dari 35 wilayah | Scorecard |
| K5 | 1, 3 | Terbesar Brebes, +15,1 pp | Kategori pada peta; angka pada tabel, tooltip, dan detail |
| K6 | 2 | 6 wilayah naik; kenaikan terbesar Pati, +3,62 pp | Tabel perubahan dan grafik tren |

Antarmuka menggunakan label **Target** dan **Perubahan 2019–2022**, tanpa kode K5/K6. Pada 2021, label perubahan menjadi **Perubahan 2019–2021**. Pada 2019, perubahan dari baseline ditampilkan `—` karena 2019 adalah tahun awal pembanding; data prevalensinya tetap tersedia. Catatan tabel dan tooltip tanda tersebut menjelaskan alasannya. Tooltip dan detail memisahkan perubahan sejak 2019 dari perubahan terhadap **tahun sebelumnya yang tersedia**: 2019 untuk 2021, serta 2021 untuk 2022. Temanggung, misalnya, memiliki perubahan 2019–2022 +3,11 pp, sedangkan perubahan 2021–2022 adalah +8,4 pp.

Nilai acuan yang diuji terhadap data asli:

| Tahun | K1 | K2 | K3 | K4 | K5 terbesar |
| --- | --- | --- | --- | --- | --- |
| 2019 | 27,1% | 35 dari 35 | 3,1 pp | 0,0% | Wonosobo, +24,6 pp |
| 2021 | 20,0% | 32 dari 35 | 1,0 pp | 8,6% | Wonosobo, +14,1 pp |
| 2022 | 20,7% | 33 dari 35 | 5,9 pp | 5,7% | Brebes, +15,1 pp |

Pada 2022, rata-rata kota 15,8% dan kabupaten 21,7%. K5 terbesar: Brebes +15,1 pp. K6 peningkatan terbesar: Pati +3,62 pp. Urutan lima prevalensi tertinggi: Brebes 29,1%, Temanggung 28,9%, Magelang 28,2%, Purbalingga 26,8%, Blora 25,8%.

Enam wilayah yang meningkat selama 2019–2022 adalah Pati, Temanggung, Kebumen, Purbalingga, Rembang, dan Wonogiri. Penurunan terbesar terjadi di Demak, **−19,56 pp**. Dua wilayah yang mencapai target pada 2022 adalah **Kota Semarang (10,4%)** dan **Kota Magelang (13,9%)**. Nilai tersebut telah dicocokkan dengan CSV yang dipakai aplikasi.

## Peta, warna, dan geometri

Menurut laporan, sumber batas wilayah adalah [Cahya DSN (2024), `wilayah_boundaries`](https://github.com/cahyadsn/wilayah_boundaries), menggunakan kode wilayah Kementerian Dalam Negeri dan berlisensi **MIT**. Laporan menjelaskan bahwa kelompok menyesuaikan urutan koordinat ke format GeoJSON serta memperbaiki satu geometri Kabupaten Cilacap.

`public/data/jateng.geojson` merupakan salinan `batas_kabkota_jateng.geojson` yang dilampirkan, dengan 35 Feature dan `properties.kode_wilayah` sebagai kunci join. **Website tidak melakukan penyederhanaan tambahan**. Poligon dari sumber sudah disederhanakan sebagaimana dijelaskan dalam laporan, sehingga sesuai untuk peta tematik, bukan pengukuran luas. Atribusi dan keterangan lisensi di README ini mengikuti laporan kelompok; halaman sumber, versi/commit upstream, dan kesesuaian berkas dengan arsip Zenodo belum diverifikasi secara independen. Lihat [catatan data](public/data/README.md).

Peta D3 menggunakan tampilan planar equirectangular koordinat bujur/lintang dengan sumbu Y dibalik. Ini merupakan peta eksplorasi prevalensi, bukan alat pengukuran luas atau jarak. Poligon di utara lintang −6,15° ditampilkan dalam inset Karimunjawa dengan **skala berbeda**; semua koordinat aslinya tetap digunakan. Pulau kecil lainnya tetap dipertahankan. Enam kota mendapat titik di centroid agar mudah diakses melalui klik dan keyboard.

| Kategori dalam laporan / label website | Ambang asli, sebelum pembulatan | Warna | 2019 | 2021 | 2022 |
| --- | --- | --- | --- | --- | --- |
| Rendah / Mencapai target | ≤ 14% | Hijau | 0 | 3 | 2 |
| Sedang / Perlu perhatian | > 14% dan < 20% | Kuning | 4 | 12 | 15 |
| Tinggi / Prioritas tinggi | ≥ 20% | Merah | 31 | 20 | 18 |

Laporan menyusun tiga kategori tersebut dengan menggabungkan acuan target nasional 14% untuk 2024 dan ambang prevalensi tinggi 20% yang dirujuk dari de Onis dkk. (2019). Ini merupakan klasifikasi operasional kelompok, bukan salinan lengkap lima kelas WHO. Target 14% digunakan sebagai **acuan historis periode analisis**, bukan klaim target terbaru.

Warna batang mengikuti kategori nilainya. Legenda selalu menghitung ulang cakupan. Wilayah di luar filter berwarna abu-abu, tetapi tetap dapat dipilih. Hover/fokus memperlihatkan nilai tahun terpilih beserta keterangan di luar cakupan bila sesuai. Tombol +/− mengatur zoom; drag/pinch untuk pan/zoom dan tombol reset mengembalikan tampilan. Wheel halaman tidak dibajak oleh peta. Inset tetap pada tempatnya ketika peta utama diperbesar.

## Visual encoding dan prinsip desain

Pemetaan **marks dan channels** mengikuti kerangka Munzner (2014) dalam laporan. Nilai, label, tanda positif/negatif, dan batas kategori mendampingi warna agar informasi tidak hanya bergantung pada merah/hijau.

| Panel | Mark | Magnitude channel | Identity channel |
| --- | --- | --- | --- |
| Scorecard | Teks angka | Nilai dibaca langsung sebagai angka | Posisi kartu dan hue latar membedakan indikator |
| Peta choropleth | Area/poligon | Kelas prevalensi, bukan besaran kontinu | Spatial region untuk lokasi; hue untuk kategori |
| Horizontal bar chart | Batang horizontal dan garis acuan | Length dan position pada skala yang sama, dimulai dari nol | Label dan posisi vertikal membedakan kota/kabupaten |
| Tabel peringkat | Teks dalam baris | Position melalui urutan peringkat | Nama wilayah dan hue lencana kategori |
| Grafik tren, tambahan implementasi | Garis dan titik pengamatan | Position pada sumbu tahun numerik dan prevalensi | Nama dan warna seri membedakan wilayah/kelompok |

Tata letak mengikuti tiga zona dalam laporan: **zona atas** untuk ringkasan eksekutif, **zona tengah/kiri** untuk sebaran spasial, dan **zona samping/kanan** untuk perbandingan serta peringkat. Penerapan prinsip desain pada website:

- **No Unjustified 3D:** semua visualisasi dua dimensi, tanpa perspektif yang mendistorsi nilai.
- **Eyes Beat Memory:** rata-rata kota/kabupaten ditampilkan bersamaan pada skala yang sama; panel tren dan riwayat wilayah membantu membandingkan tahun tanpa mengingat tampilan sebelumnya.
- **Overview First:** empat scorecard dan peta memberi gambaran awal.
- **Zoom and Filter:** tahun, cakupan wilayah, zoom, dan pan dapat digunakan untuk mempersempit eksplorasi.
- **Details on Demand:** hover/fokus, klik wilayah, tabel, dan panel detail menyediakan rincian sesuai kebutuhan.

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

Menurut laporan, data 2019 belum dicocokkan dengan publikasi survei nasional. Perbedaan periode/metode pengumpulan data perlu diperhatikan saat menafsirkan tren. K1 tidak boleh disamakan dengan estimasi resmi provinsi yang dapat menggunakan pembobotan berbeda. Peta mempertahankan penyederhanaan batas dari sumber dan tidak ditujukan untuk pengukuran geografis. Pemeriksaan otomatis serta review tampilan belum menggantikan uji kegunaan atau evaluasi aksesibilitas dengan pengguna.

## Pengujian

Vitest memeriksa data 105 baris, join 35 kode, batas kategori, semua KPI acuan, K5/K6, perbedaan periode pembanding, pembulatan, filter, dan penolakan data tidak valid. Playwright memeriksa perubahan filter, sinkronisasi keyboard/peta/detail/tren, tooltip, pencarian, sorting, zoom, ekspor, empat mode tren, batas lima seri, loading/error state, console browser, dan overflow pada 360–1672 px. Screenshot desktop/mobile tersimpan di `.impeccable/review/` setelah tes browser berjalan.

Hasil pemeriksaan implementasi tercatat dalam [VALIDATION.md](VALIDATION.md): **33 tes unit** dan **13 tes browser** lulus pada verifikasi terakhir. Angka ini terpisah dari **35 pemeriksaan data** dan **12 pemeriksaan batas wilayah** yang dilaporkan kelompok pada tahap pembersihan; pemeriksaan tahap pembersihan tersebut tidak diklaim sebagai tes yang dijalankan oleh website.

## Referensi

Referensi berikut mengikuti daftar pustaka laporan kelompok; tautan dicantumkan sebagai rujukan proyek.

1. Cahya DSN. (2024). [*wilayah_boundaries: Data boundaries wilayah administrasi pemerintahan Indonesia*](https://github.com/cahyadsn/wilayah_boundaries). GitHub.
2. Cleveland, W. S., & McGill, R. (1984). [*Graphical perception: Theory, experimentation, and application to the development of graphical methods*](https://doi.org/10.1080/01621459.1984.10478080). Journal of the American Statistical Association, 79(387), 531–554.
3. de Onis, M., dkk. (2019). [*Prevalence thresholds for wasting, overweight and stunting in children under 5 years*](https://doi.org/10.1017/S1368980018002434). Public Health Nutrition, 22(1), 175–179.
4. Dinas Kesehatan Provinsi Jawa Tengah. (t.t.). [*Prevalensi stunting*](https://data.jatengprov.go.id/dataset/42f-sdjt-prevalensi-stunting). Portal Satu Data Provinsi Jawa Tengah.
5. Kementerian Kesehatan RI. (2021). [*Hasil Survei Status Gizi Indonesia (SSGI) tahun 2021 tingkat kabupaten/kota*](https://repository.badankebijakan.kemkes.go.id/id/eprint/4899/).
6. Kementerian Kesehatan RI. (2023). [*Buku saku hasil Survei Status Gizi Indonesia (SSGI) 2022*](https://repository.badankebijakan.kemkes.go.id/id/eprint/4855/).
7. Munzner, T. (2014). [*Visualization Analysis and Design*](https://doi.org/10.1201/b17511). A K Peters/CRC Press.
8. Republik Indonesia. (2021). [*Peraturan Presiden Nomor 72 Tahun 2021 tentang Percepatan Penurunan Stunting*](https://peraturan.bpk.go.id/Details/174964/perpres-no-72-tahun-2021).
9. Shneiderman, B. (1996). [*The eyes have it: A task by data type taxonomy for information visualizations*](https://doi.org/10.1109/VL.1996.545307). Proceedings 1996 IEEE Symposium on Visual Languages, 336–343.
10. Kelompok 14. [Arsip data bersih, batas wilayah, dan dokumentasi dashboard](https://doi.org/10.5281/zenodo.24267455). Zenodo; tautan sesuai laporan.
