# Sumber dan pengolahan data

Kedua berkas di folder ini merupakan salinan lokal data bersih dan batas wilayah yang dilampirkan untuk implementasi dashboard:

- `stunting.csv`: `prevalensi_stunting_jateng_2019_2022_clean.csv`.
- `jateng.geojson`: `batas_kabkota_jateng.geojson`.

CSV memuat 105 baris dalam format long: 35 wilayah (29 kabupaten dan 6 kota) untuk masing-masing 2019, 2021, dan 2022. GeoJSON memuat 35 batas kabupaten/kota. Aplikasi menggabungkan keduanya berdasarkan `kode_wilayah`, mempertahankan presisi CSV dan koordinat GeoJSON lampiran.

## Atribusi sesuai laporan Kelompok 14

| Data | Sumber yang disebutkan dalam laporan | Lisensi yang disebutkan |
| --- | --- | --- |
| Prevalensi stunting | Dinas Kesehatan Provinsi Jawa Tengah, [Portal Satu Data Jawa Tengah](https://data.jatengprov.go.id/dataset/42f-sdjt-prevalensi-stunting) | CC-BY |
| Batas wilayah | Cahya DSN (2024), [wilayah_boundaries](https://github.com/cahyadsn/wilayah_boundaries), dengan kode wilayah Kementerian Dalam Negeri | MIT |
| Data bersih dan dokumentasi kelompok | [Zenodo, DOI: 10.5281/zenodo.24267455](https://doi.org/10.5281/zenodo.24267455) | Tidak dirinci pada laporan yang diberikan |

Menurut laporan, pembersihan mencakup penggabungan tahun, pemeriksaan nilai kosong/duplikat, penghapusan `_id`, perapian nama, penambahan kode empat digit dan atribut turunan. Galat representasi floating point dirapikan ke presisi sumber: dua desimal pada 2019, satu desimal pada 2021/2022. Untuk geometri, kelompok menyesuaikan urutan koordinat ke GeoJSON dan memperbaiki geometri Kabupaten Cilacap.

Website tidak melakukan penyederhanaan geometri tambahan. Batas pada sumber sudah disederhanakan, sehingga digunakan untuk visualisasi tematik, bukan pengukuran luas. Data 2020 tidak tersedia dan tidak diisi dengan interpolasi.

Atribusi dan keterangan lisensi di atas berasal dari laporan kelompok yang diberikan kemudian, bukan hasil audit lisensi atau unduhan ulang sumber. Versi/commit upstream, kesesuaian salinan dengan arsip Zenodo, dan metadata survei rinci belum diverifikasi secara independen. Keterangan ini tidak menetapkan lisensi untuk kode aplikasi.

Lihat [README utama](../../README.md) untuk rumus indikator, kategori warna, cara memperbarui data, batasan interpretasi, dan daftar pustaka.
