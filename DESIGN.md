---
name: "Dashboard Prioritas Intervensi Stunting Jawa Tengah"
description: "Sistem visual yang diekstrak dari dashboard dan referensi pengguna yang sudah ditetapkan."
colors: {"page": "#f8f9fb", "surface": "#fff", "ink": "#15181e", "panel-border": "#a8adb4", "link": "#295d94", "focus": "#2469a9", "blue-surface": "#d7edfd", "blue-border": "#71b4e8", "blue-ink": "#0e2538", "orange-surface": "#ffead0", "orange-border": "#d9a164", "orange-ink": "#382616", "purple-surface": "#f1e2fc", "purple-border": "#be91df", "purple-ink": "#2d1c3c", "green-surface": "#e4f7db", "green-border": "#8cbd77", "green-ink": "#1f3419", "achieved": "#08a33e", "achieved-soft": "#dcf4e2", "achieved-text": "#11652e", "moderate": "#ffd000", "moderate-soft": "#fff3bf", "moderate-text": "#735600", "high": "#ed2429", "high-soft": "#ffdada", "high-text": "#9d1c22", "outside-scope": "#e2e5e9", "table-header": "#ededee", "row-hover": "#f4f7fa", "row-selected": "#eaf3fc", "icon-border": "#d4d8de", "icon-hover": "#edf2f7", "field-border": "#9b9fa6", "retry": "#275f96", "tab-track": "#f0f2f5", "tab-ink": "#5a6472", "tab-active-ink": "#213e60", "trend-blue": "#2563a6", "trend-purple": "#a14399", "trend-orange": "#bd5c12", "trend-teal": "#117866", "trend-violet": "#5f55bb"}
typography: {"display": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "clamp(22px, 1.75vw, 31px)", "fontWeight": 790, "lineHeight": 1.21, "letterSpacing": "-.035em"}, "title": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "clamp(19px, 1.76vw, 29px)", "fontWeight": 760, "lineHeight": 1.25, "letterSpacing": "-.032em"}, "kpi-title": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "clamp(15px, 1.4vw, 22px)", "fontWeight": 620, "lineHeight": 1.3, "letterSpacing": "-.025em"}, "kpi-value": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "clamp(31px, 3.15vw, 54px)", "fontWeight": 780, "lineHeight": 1.17, "letterSpacing": "-.045em"}, "kpi-note": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "clamp(12px, 1.22vw, 18px)", "lineHeight": 1.4}, "table-body": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "12px"}, "field-label": {"fontFamily": "'Inter Variable', Inter, sans-serif", "fontSize": "13px", "fontWeight": 600}}
rounded: {"panel": "16px", "panel-mobile": "13px", "kpi-mobile": "12px", "field": "9px", "table": "8px", "control": "7px", "rank-tab": "6px", "legend": "5px", "tooltip": "11px"}
spacing: {"filter-gap": "10px", "kpi-gap": "17px", "overview-gap": "18px", "panel-padding": "24px", "dashboard-padding": "26px 26px 28px"}
components: {"panel": {"backgroundColor": "{colors.surface}", "textColor": "{colors.ink}", "rounded": "{rounded.panel}"}, "scorecard-blue": {"backgroundColor": "{colors.blue-surface}", "textColor": "{colors.blue-ink}", "rounded": "{rounded.panel}", "padding": "17px 23px 16px"}, "scorecard-orange": {"backgroundColor": "{colors.orange-surface}", "textColor": "{colors.orange-ink}", "rounded": "{rounded.panel}", "padding": "17px 23px 16px"}, "scorecard-purple": {"backgroundColor": "{colors.purple-surface}", "textColor": "{colors.purple-ink}", "rounded": "{rounded.panel}", "padding": "17px 23px 16px"}, "scorecard-green": {"backgroundColor": "{colors.green-surface}", "textColor": "{colors.green-ink}", "rounded": "{rounded.panel}", "padding": "17px 23px 16px"}, "icon-button": {"backgroundColor": "{colors.surface}", "textColor": "{colors.ink}", "rounded": "{rounded.control}", "size": "34px"}, "icon-button-hover": {"backgroundColor": "{colors.icon-hover}"}, "retry-button": {"backgroundColor": "{colors.retry}", "textColor": "{colors.surface}", "rounded": "{rounded.table}", "padding": "11px 18px"}, "filter-field": {"backgroundColor": "{colors.surface}", "typography": "{typography.field-label}", "rounded": "{rounded.field}", "height": "43px"}, "prevalence-achieved": {"backgroundColor": "{colors.achieved-soft}", "textColor": "{colors.achieved-text}", "rounded": "{rounded.control}", "padding": "4px 9px"}, "prevalence-moderate": {"backgroundColor": "{colors.moderate-soft}", "textColor": "{colors.moderate-text}", "rounded": "{rounded.control}", "padding": "4px 9px"}, "prevalence-high": {"backgroundColor": "{colors.high-soft}", "textColor": "{colors.high-text}", "rounded": "{rounded.control}", "padding": "4px 9px"}, "trend-tab": {"textColor": "{colors.tab-ink}", "rounded": "{rounded.rank-tab}", "padding": "8px 12px"}, "trend-tab-active": {"backgroundColor": "{colors.surface}", "textColor": "{colors.tab-active-ink}"}}
---

# Design System: Dashboard Prioritas Intervensi Stunting Jawa Tengah

## Overview

Sistem ini merekam implementasi yang sudah ada, dengan referensi visual pengguna `C:/Users/LOQ/Downloads/Dasbor Prioritas Stunting Jawa Tengah (1).png` sebagai otoritas komposisi. Latar terang, empat kartu KPI pastel biru–oranye–ungu–hijau, peta geografis di kiri, grafik batang dan peringkat di kanan, serta tren di bawah mengikuti referensi tersebut dan komitmen dalam `PRODUCT.md`.

Penjelasan berbahasa Indonesia, angka besar, dan label pendamping mendukung pembacaan data. Dokumentasi ini tidak menetapkan metafora, identitas, atau keputusan estetika baru. Nilai berasal dari kode; token YAML di atas bersifat normatif. Metadata, cuplikan komponen, fokus, bayangan, gerak, dan breakpoint tersimpan dalam `.impeccable/design.json`.

**Key Characteristics:**

- Kanvas terang dan panel putih dengan garis tepi tipis.
- Empat warna pastel untuk membedakan jenis indikator.
- Merah–kuning–hijau untuk kategori prevalensi, didampingi rentang angka.
- Inter dengan angka tabular dan hierarki angka KPI yang kuat.
- Kontrol ringkas, fokus keyboard terlihat, serta tata letak yang menjadi satu kolom pada layar kecil.

## Colors

### Primary

Warna semantik `achieved`, `moderate`, dan `high` berasal dari `CATEGORIES` di `src/lib/calculations.ts`. Hijau berarti mencapai target (≤ 14%), kuning berarti perlu perhatian (> 14% hingga < 20%), dan merah berarti prioritas tinggi (≥ 20%). Batas memakai nilai yang belum dibulatkan. Peta dan batang memakai warna utamanya; lencana tabel memakai pasangan `soft` dan `text` untuk menjaga keterbacaan.

### Secondary

Empat keluarga `blue`, `orange`, `purple`, dan `green` di `src/styles/index.css` masing-masing memiliki latar, garis tepi, dan warna teks. Dalam `src/components/Scorecards.tsx`, urutannya adalah rata-rata prevalensi, wilayah di atas target, selisih kabupaten–kota, lalu persentase wilayah yang mencapai target. Warna kartu membedakan indikator; kategori data tetap mengikuti `CATEGORIES`.

### Tertiary

Palet `trend-*` berasal dari `PALETTE` di `src/components/TrendPanel.tsx` dan membedakan seri. Perbandingan kota memakai biru dan kabupaten memakai ungu. Warna garis tren tidak menyatakan kategori prevalensi.

### Neutral

`page`, `surface`, `ink`, dan `panel-border` mengatur kanvas, panel, teks utama, serta batas panel. `table-header`, `row-hover`, dan `row-selected` membedakan struktur dan keadaan tabel. Wilayah di luar cakupan memakai `outside-scope` dalam `src/components/MapPanel.tsx`. Tautan dan fokus memakai biru; teks sekunder memakai abu-abu spesifik sesuai konteks di CSS, tanpa skala tonal terpusat.

## Typography

Font tunggal ialah Inter Variable dengan fallback Inter dan sans-serif. `src/main.tsx` memuat `@fontsource-variable/inter`; `--font-sans` didefinisikan pada `@theme` dalam `src/styles/index.css`. Root mengaktifkan `font-variant-numeric: tabular-nums`.

Peran `display` dipakai judul halaman, `title` untuk judul panel, dan tiga peran KPI untuk judul, angka, serta penjelasan kartu. Judul panel perbandingan dan peringkat memiliki ukuran khusus `clamp(18px, 1.66vw, 27px)` dan `clamp(18px, 1.65vw, 27px)`. Tabel memakai ukuran dasar pada token `table-body`, dengan header (10px, bobot 650), nama wilayah (550), dan nilai lencana (15px, 750). Bobot bukan kelipatan seratus dipertahankan sesuai font variabel.

Ukuran berubah melalui media query; angka pada YAML menggambarkan aturan dasar. Pada lebar ≤ 560px, judul halaman menjadi (25px, line-height 1.23), judul panel (22px), judul kartu (13px), dan nilai KPI mengikuti aturan terakhir `clamp(25px, 7.5vw, 33px)` dengan `white-space: nowrap`. Teks bantuan peta, catatan tabel, dan footer akhirnya (10px); aturan terakhir CSS mengatasi deklarasi lebih awal.

## Layout

Sumber ukuran dan breakpoint: `src/styles/index.css`. Kontainer maksimal (1840px), terpusat, memakai `dashboard-padding`. Header memakai flex dengan jarak (24px). Kartu KPI membentuk empat kolom sama lebar dengan `kpi-gap`, tinggi minimal (146px), dan jarak bawah (23px). Overview memakai dua kolom (1.02fr / 1fr) dengan `overview-gap`; kolom kanan menumpuk perbandingan dan peringkat dengan jarak (17px). Panel tren berada setelah overview dan detail pilihan (`src/App.tsx`).

Peta memakai SVG `viewBox="0 0 760 440"`, lebar 100%, tinggi otomatis, dan inset Karimunjawa. Tinggi minimum kanvas dasar (330px), maksimum SVG (410px). Grafik batang dasar (156px); grafik tren (288px). Tabel dapat digulir horizontal, dan mode semua wilayah dibatasi tinggi (408px) dengan gulir vertikal serta header lengket.

Aturan desktop terakhir pada lebar ≥1100px dan tinggi viewport ≥600px mengatasi ukuran dasar: `.dashboard-overview` memakai tinggi `calc(100svh - 36px)`, empat baris grid (`auto auto minmax(0, 1fr) auto`), dan jarak `clamp(10px, 1.6vh, 16px)`. Padding dashboard (18px 22px 24px). Header (21–29px), angka KPI `clamp(30px, 5.1vh, 47px)`, tanpa tinggi minimum kartu. Kanvas/SVG peta mengikuti ruang tersisa tanpa tinggi minimum. Kolom analisis memakai `minmax(125px, 2fr) minmax(0, 5fr)` dengan jarak (12px). Tabel mengisi sisa panel, menggulir internal pada semua mode, dengan baris `clamp(30px, 4.8vh, 43px)`. Detail/tren tetap berada di bawah ringkasan pada aliran dokumen biasa; jangan memotong halaman memakai `overflow: hidden` atau CSS zoom.

- Pada ≥ 1650px, tabel menjadi (14px), lencana (18px), dan kanvas peta minimal (340px).
- Pada ≤ 1190px, padding kontainer (22px 20px), header membungkus, kolom overview (0.95fr / 1.05fr), jarak (15px), dan pilihan banyak wilayah menjadi empat kolom.
- Pada ≤ 960px, KPI menjadi dua kolom dengan jarak (13px), overview satu kolom, legenda dapat berjajar dan membungkus, heading tren bertumpuk, serta detail menjadi dua kolom. Kanvas peta minimal (360px), maksimum SVG (430px).
- Pada ≤ 560px, padding kontainer (20px 14px), KPI tetap dua kolom dengan jarak (10px), filter membungkus selebar kontainer, legenda kembali vertikal, tabel minimal (530px) di dalam area gulir, tab tren dibagi rata, dan daftar multiwilayah menjadi dua kolom. Grafik tren setinggi (265px); kanvas peta minimal (250px). Lebar minimum body (320px).

## Elevation & Depth

Panel utama, kartu, dan kontrol menggunakan bidang warna serta garis tepi tanpa bayangan. Tooltip peta yang mengambang memakai `box-shadow: 0 8px 24px #192b431f`, garis (1px solid #aeb8c5), dan lapisan `z-index: 5`. Sumber: `src/styles/index.css`, aturan `.map-tooltip`. Tooltip bawaan Recharts dikonfigurasi dengan sudut (10px), garis (1px solid #dce0e5), dan font (13px) dalam `ComparisonChart.tsx` serta `TrendPanel.tsx`; rincian bawaan pustaka lainnya tidak dijadikan token proyek.

## Shapes

Panel dan kartu memakai `rounded.panel`; pada ponsel panel memakai `panel-mobile` dan KPI memakai `kpi-mobile`. Kontrol, tabel, tab, legenda, dan tooltip memakai ukuran terpisah dalam YAML. Garis panel dan kartu (1px); batas wilayah peta putih (1.4px), bergabung membulat, dan memakai `vector-effect: non-scaling-stroke`. Hover/fokus wilayah memakai garis gelap (2px); pilihan aktif (2.8px). Kota memiliki penanda lingkaran (r 5.5) dengan garis dasar (1.1px), menjadi (2.5px) saat aktif, hover, atau fokus. Sumber: `src/styles/index.css` dan `src/components/MapPanel.tsx`.

## Components

**Kartu KPI.** Kontainer pastel bergaris dengan ukuran minimum dan padding di YAML. Tidak menjadi tombol. Perubahan filter diperbarui melalui area `aria-live="polite"`. Ketika selisih kabupaten–kota tidak berlaku, teks `Tidak berlaku` memakai aturan ukuran tersendiri. Sumber: `Scorecards.tsx` dan stylesheet.

**Filter.** Select native berada dalam bingkai putih dengan garis `field-border`, padding kiri (12px), tinggi pada token, serta ikon chevron di kanan. Select memiliki padding (10px 31px 10px 5px), tinggi minimum (41px), dan maksimum lebar (197px). Tahun awal 2022, cakupan awal seluruh kabupaten/kota. Reset memulihkan tahun/cakupan, pencarian dan mode tren, serta zoom peta. Sumber: `Filters.tsx`, `App.tsx`.

**Tombol.** Tombol ikon memiliki ukuran dasar pada YAML, garis `icon-border`, dan latar `icon-hover` saat hover, dengan garis hover (#9aa6b5). Tombol peta (32px), tombol reset filter (38px × 42px); ponsel masing-masing (30px) dan (31px × 40px). Tombol teks ringkas menggunakan warna (#315f8d); hover menambahkan garis bawah. Tombol muat ulang pada halaman gagal memakai varian `retry-button`. Keadaan disabled memakai opacity (.5) dan cursor default.

**Fokus dan navigasi.** Aturan global `:focus-visible` menampilkan outline (3px solid) dengan warna `focus`, offset umum (4px); select dalam bingkai memakai offset (0). Tautan analisis tren menuju heading tren melalui anchor. Skip link muncul di posisi kiri/atas (15px) ketika fokus. Tidak ada bilah navigasi aplikasi terpisah. Tombol mode tren memakai `aria-pressed`, bukan peran tab ARIA.

**Peta.** Geometri yang diberikan diproyeksikan melalui `geoIdentity().reflectY(true)`; bukan gambar ilustrasi. Geser/pan aktif, tombol zoom memakai faktor (1.4) dengan rentang skala (1–6), roda mouse tidak memicu zoom. Hover dan fokus membuka tooltip; klik, Enter, atau Space memilih wilayah. Escape menutup tooltip. Wilayah di luar cakupan tetap dapat dipilih dan ditampilkan abu-abu. Pilihan wilayah memperbarui filter, memunculkan detail, dan diikuti mode satu wilayah pada tren sampai pengguna mengganti kontrol tren. Sumber: `MapPanel.tsx`, `App.tsx`, `TrendPanel.tsx`.

**Grafik batang dan peringkat.** Batang horizontal memakai kategori semantik, ujung membulat (8px), tinggi (26px), label angka, serta garis target putus-putus (5 4). Tabel awalnya menampilkan lima peringkat; pencarian, tampilkan semua, dan pengurutan kolom bekerja pada cakupan filter. Urutan awal prevalensi menurun. Lencana memakai pasangan warna kategori; nilai perubahan positif merah (#a12b30), nilai nonpositif hijau (#216a49), dan nilai tidak tersedia abu-abu. Hover baris memakai `row-hover`; pilihan memakai `row-selected`. Sumber: `ComparisonChart.tsx`, `RankingTable.tsx`, stylesheet.

**Tren.** Empat mode: rata-rata, satu wilayah, multiwilayah (maksimal lima), serta kota vs kabupaten. Tombol aktif putih dengan bobot (650) di dalam track abu-abu. Garis seri (2.5px), titik (r 4.5, garis 2px), titik aktif (r 6). Tahun 2020 memiliki nilai null, `connectNulls={false}`, dan anotasi data tidak tersedia; tidak ada interpolasi. Animasi Recharts dinonaktifkan untuk batang dan garis. Sumber: `TrendPanel.tsx`, `ComparisonChart.tsx`.

**Gerak.** Perubahan isi wilayah peta memakai transisi `fill .18s`. Halaman menggunakan scroll halus, dan indikator loading berputar (1s linear infinite). `prefers-reduced-motion: reduce` menonaktifkan animasi/transisi dan mengganti scroll menjadi otomatis. Sumber: stylesheet.

## Do's and Don'ts

### Do:

- **Do** Pertahankan urutan KPI pastel serta komposisi overview dan tren yang ditetapkan referensi pengguna.
- **Do** Gunakan kategori dari `CATEGORIES` bersama label, rentang, dan nilai yang dapat dibaca.
- **Do** Pertahankan fokus keyboard, keadaan terpilih, area gulir tabel, dan perubahan tata letak pada breakpoint yang tercatat.
- **Do** Perbarui token berdasarkan sumber kode saat implementasi berubah.

### Don't:

- **Don't** Mengganti referensi terang yang ditetapkan pengguna dengan tema atau identitas visual baru.
- **Don't** Mengubah batas kategori berdasarkan angka yang sudah dibulatkan atau memakai warna seri tren sebagai kategori risiko.
- **Don't** Menyambung garis melewati 2020 atau menggambar data yang tidak tersedia.
- **Don't** Menganggap contoh sidecar sebagai komponen baru atau mengubah tampilan aplikasi dari dokumentasi ini.
