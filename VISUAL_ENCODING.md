# Munzner Level 3 dan Visual Reverse-Mapping Test

Perbaikan pada dashboard yang sudah ada, 18 November 2026. Fokus: **idiom, marks, dan channels**, dengan layout, fitur interaktif, data, serta rumus KPI dipertahankan.

## Evaluasi sebelum dan sesudah

| Temuan sebelumnya | Risiko ketika judul disembunyikan | Perubahan encoding |
| --- | --- | --- |
| Sumbu batang tersembunyi dan ada sisa batang abu-abu | Terbaca seperti progress menuju 100% | Sumbu persentase terlihat dari nol; sisa progress dihapus; garis acuan 14% dipertahankan |
| Domain kuantitatif berubah ketika filter atau seri berubah | Panjang/posisi yang sama dapat berarti nilai berbeda | Kedua grafik memakai domain seluruh dataset yang sama, saat ini 0–40%, tetap selama filter/mode berubah |
| Kategori peta terutama dibedakan melalui hue | Merah/hijau sulit dibedakan sebagian pembaca | Hijau polos, kuning bertitik, merah berarsir; pola sama pada area, batang, dan legenda |
| Seri tren terutama memakai hue dan ikon legenda serupa | Identitas seri mudah tertukar dalam grayscale | Garis netral dengan lima pola garis serta lingkaran, persegi, belah ketupat, segitiga, dan silang; glyph legenda mengikuti plot |
| Titik tren belum menunjukkan kategori nilainya | Capaian target kurang terlihat pada stimulus statis | Warna titik mengikuti prevalensi; pita kategori halus, ambang 14%/20%, label sumbu dan nilai satu seri memperjelas pembacaan |
| Kekosongan 2020 terutama dijelaskan lewat anotasi | Kekosongan terlewat ketika anotasi ditutup | Tidak ada titik 2020, garis terputus, dan ada daerah bertekstur vertikal netral tanpa nilai pengamatan |
| Rata-rata 2021 dibulatkan menjadi 20,0% di grafik | Label tampak bertentangan dengan warna kuning | Label grafik menunjukkan 19,96%; presisi ditambah hanya jika pembulatan melintasi kategori |

Pola adalah **redundansi data**, bukan dekorasi. Lapisan pola tidak menerima pointer, sehingga hover, klik, pemilihan keyboard, zoom, dan pan tetap bekerja. Tidak ada efek 3D.

## Marks, channels, dan CBQ

| Idiom | Mark | Magnitude channel | Identity channel | Dukungan utama |
| --- | --- | --- | --- | --- |
| Choropleth | Poligon | Nilai dikelompokkan; luas wilayah tidak mengodekan besarnya prevalensi | Spatial region, hue dan texture kategori | CBQ 1/3: lokasi prioritas dan kategori capaian |
| Batang horizontal | Batang dan garis acuan | Length/position dari nol pada skala bersama | Label/posisi kota–kabupaten; hue/texture kategori | CBQ 4: rata-rata kelompok dan selisih K3; pembanding target |
| Tren temporal | Garis dan titik pengamatan | Position pada sumbu tahun numerik dan persentase | Shape/pola garis untuk seri; hue titik untuk kategori | CBQ 2: perubahan waktu; mode kelompok juga mendukung CBQ 4 |

**Eyes Beat Memory:** skala tetap selama filter berubah, kedua kelompok berbagi titik nol, dan seri tren dapat dibandingkan bersamaan. Peta menampilkan kelas, bukan angka jarak target yang presisi; angka tersebut tetap tersedia di tabel, tooltip, dan detail. Grafik kelompok tidak menunjukkan peringkat setiap wilayah; gunakan mode wilayah dan tabel untuk pertanyaan itu.

| Kategori | Ambang dari nilai asli | Hue | Pola area |
| --- | --- | --- | --- |
| Rendah | ≤14% | Hijau `#08a33e` | Polos |
| Sedang | >14% dan <20% | Kuning `#ffd000` | Titik |
| Tinggi | ≥20% | Merah `#ed2429` | Arsir diagonal |

Identitas seri tren ditentukan bentuk/pola garis, bukan warna titik. Satu seri dapat memiliki titik berbeda warna karena nilainya berubah. Glyph legenda seri memakai warna netral agar tidak menyiratkan bahwa suatu wilayah selalu berada pada kategori tertentu.

Scorecard rata-rata 2021 tetap **20,0%**, sesuai format satu desimal yang sudah disepakati. Grafik menunjukkan **19,96%** supaya label tidak melintasi ambang warna. Nilai sumber dan rumus rata-rata tetap sama.

## Stimulus dan prosedur uji

```sh
npx playwright test tests/e2e/visual-encoding.spec.ts
```

Tes menghasilkan capture di `.impeccable/review/`. Salinan pilihan tersedia di [docs/visual-encoding](docs/visual-encoding).

Asal gambar: tangkapan browser Chromium lokal, bukan gambar rancangan atau hasil edit bitmap. Versi sebelum dibangun dari commit `4800130`; versi sesudah berasal dari implementasi perbaikan ini. Pasangan utama memakai viewport 1672×941; versi mobile memakai lebar 390px. Masking judul, kontrol, dan catatan diterapkan pada kedua versi; anotasi 2020 versi lama juga disamarkan. Perintah tes di atas meregenerasi versi sesudah, sedangkan versi sebelum memerlukan sumber pada commit tersebut.

**Masking:** sembunyikan judul, subjudul, catatan/paragraf penjelasan, toolbar mode/pemilihan, kontrol peta, dan anotasi penjelasan 2020. Pertahankan marks, angka data, sumbu, satuan, tick, batas kategori, legenda, serta garis acuan: bagian tersebut adalah metadata pembacaan dan encoding grafik.

Gunakan **potongan satu panel** sebagai stimulus agar panel lain tidak membocorkan jawaban. Full-page desktop/mobile hanya untuk QA layout. Grayscale merupakan pemeriksaan redundansi tambahan, bukan simulasi lengkap semua kondisi buta warna.

### Kunci peneliti — jangan diberikan sebelum responden menjawab

| Berkas | Isi | Kondisi |
| --- | --- | --- |
| `01.png` | Peta | Sebelum |
| `02.png` | Batang kota–kabupaten | Sebelum |
| `03.png` | Tren rata-rata | Sebelum |
| `04.png` | Peta | Sesudah |
| `05.png` | Batang kota–kabupaten | Sesudah |
| `06.png` | Tren rata-rata | Sesudah |
| `07.png` | Peta | Sesudah, grayscale |
| `08.png` | Batang kota–kabupaten | Sesudah, grayscale |
| `09.png` | Tren kelompok | Sesudah, grayscale |
| `10.png` | Peta | Sesudah, mobile |
| `11.png` | Batang kota–kabupaten | Sesudah, mobile |
| `12.png` | Tren kelompok | Sesudah, mobile |

Pasangan sebelum/sesudah memakai 2022, semua wilayah, dan tren rata-rata pada kedua versi. Grayscale/mobile adalah kondisi tambahan, bukan pasangan identik untuk seluruh perbandingan. Acak ID/urutan presentasi; pertimbangkan pembagian kelompok atau counterbalancing untuk mengurangi efek belajar.

Pertanyaan yang dapat digunakan:

1. Jenis grafik dan atribut apa yang dibandingkan?
2. Apa makna panjang, posisi, warna, pola, dan bentuknya?
3. CBQ mana yang sesuai: prioritas wilayah, perubahan waktu, capaian target, atau kota–kabupaten? Mengapa?
4. Apa kesimpulan mengenai target/perubahan, dan bukti visualnya?
5. Adakah pengamatan yang hilang atau informasi yang mudah disalahartikan?

Catat jawaban, waktu respons, dan keyakinan. Tetapkan rubrik sebelum pengumpulan data, misalnya 0 = keliru, 1 = sebagian benar, 2 = benar dengan alasan visual tepat. Tetapkan kriteria keberhasilan bersama penguji; dokumen ini tidak mengklaim ambang skor/jumlah responden sebagai standar tervalidasi.

Makna domain atau nama KPI tidak dapat dipastikan dari geometri bila seluruh metadata semantik dihapus. Untuk scorecard numerik, pertahankan satuan dan konteks penyebut, lalu uji pemetaan indikator secara terpisah. Mengenali angka persentase belum membuktikan pemahaman “rata-rata prevalensi stunting”.

## Verifikasi dan batas kesimpulan

- **46 tes unit dan 24 tes browser lulus**, termasuk audit data/interaksi/viewport serta lima tes khusus encoding dan masking.
- Tes memeriksa rasio panjang batang terhadap nilai, domain bersama, pola/glyph berbeda, warna kategori titik, jarak tahun numerik, serta tidak adanya titik/interpolasi 2020.
- Reviewer visual independen memeriksa capture biasa, tersamar, grayscale, desktop, dan mobile; tidak meminta perbaikan material. Capture mobile satu panel juga diperiksa ulang sebagai stimulus.
- CSV, GeoJSON, rumus KPI dan fitur interaktif tetap dipertahankan. Detail audit data: [VALIDATION.md](VALIDATION.md).
- **Belum ada hasil uji responden.** Tes otomatis memverifikasi implementasi, sedangkan efektivitas reverse-mapping harus dinilai melalui jawaban responden.
