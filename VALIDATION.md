# Hasil verifikasi implementasi

Dilaksanakan pada 16 November 2026 menggunakan berkas lampiran pengguna.

| Pemeriksaan | Hasil |
| --- | --- |
| Parsing dan cakupan CSV | 105 baris; 35 wilayah pada masing-masing 2019, 2021, 2022 |
| Join geometri | 35 kode unik, cocok satu-ke-satu dengan CSV |
| Tes unit Vitest | 33 lulus |
| Tes browser Playwright Chromium | 13 lulus, termasuk regresi tinggi viewport |
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

Sumber upstream/lisensi GeoJSON dan metodologi survei tidak tercantum pada lampiran; keterbatasan tersebut dicatat di README dan tidak diganti dengan atribusi yang belum terverifikasi.
