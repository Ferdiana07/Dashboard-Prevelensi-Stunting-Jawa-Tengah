# Paket pengujian pengguna (Munzner Level 3 & 4)

| Berkas | Isi | Luaran |
| --- | --- | --- |
| [INSTRUMEN_UJI.md](INSTRUMEN_UJI.md) | Peran dan kriteria responden, prosedur sesi, gambar stimulus, pertanyaan, opsi, kunci, skenario tugas, SUS, pernyataan kesediaan, rumus metrik, dan penyesuaian terhadap lembar tugas | 1. Alat uji (unggah ke Google Drive bersama folder `stimulus/`) |
| [apps-script.gs](apps-script.gs) | Penerima data ke Google Sheet + lembar Analisis berisi rumus | 2. Data asli (.xlsx) |
| Formulir `/uji/` | Pengisian oleh responden; pernyataan sukarela disetujui elektronik dan dapat dicetak sebagai PDF | 3. Pernyataan sukarela |

Kode formulir: [src/uji/](../../src/uji/). Teks pertanyaan, opsi, kunci, dan skenario berasal dari [src/uji/content.ts](../../src/uji/content.ts); ubah di sana bila instrumen direvisi, lalu samakan INSTRUMEN_UJI.md.

## 1. Menyiapkan Google Sheet

1. Buat Google Sheet baru, misalnya “Data Uji Dashboard Stunting – Kelompok 14”.
2. **Ekstensi → Apps Script**, hapus isi bawaan, tempel seluruh [apps-script.gs](apps-script.gs), lalu simpan.
3. Pilih fungsi **`siapkan`** → **Jalankan** → izinkan akses Spreadsheet. Lembar Responden, L3, L4, SUS, Persetujuan, dan Analisis akan dibuat.
4. **Terapkan → Deployment baru → ⚙ Aplikasi web**. *Jalankan sebagai*: **Saya**. *Yang memiliki akses*: **Siapa saja**. Salin URL yang berakhiran `/exec`.
5. Uji cepat: buka URL `/exec` di peramban; harus muncul `{"ok":true,"responden":0}`.

Bila skrip diubah, gunakan **Kelola deployment → Edit → Versi baru** agar URL tetap sama.

> **Perlu disesuaikan saat Google Sheet dipasang.** Sejak Tahap 8, setiap baris L4 di payload membawa field `reset` (`true`/`false` untuk B2, `null` untuk task lain). [apps-script.gs](apps-script.gs) belum menulis field ini; tambahkan kolom `reset` di lembar L4 (dan rumus Analisis bila perlu) sebelum pengambilan data. Sampai saat itu, nilai `reset` tetap tersimpan di berkas `.json`, ringkasan teks, dan `localStorage`.

## 2. Menghubungkan formulir

Formulir membaca dua variabel lingkungan saat build:

| Variabel | Contoh | Fungsi |
| --- | --- | --- |
| `VITE_UJI_SHEET_URL` | `https://script.google.com/macros/s/AKfy…/exec` | Pengiriman otomatis ke Google Sheet |
| `VITE_UJI_WA` (opsional) | `6281234567890` | Tombol cadangan “Kirim lewat WhatsApp” |

- **Vercel**: Project → Settings → Environment Variables → tambahkan, lalu *Redeploy*.
- **Lokal**: buat berkas `.env.local` di akar proyek berisi `VITE_UJI_SHEET_URL=…`, lalu `npm run dev`.

Tanpa `VITE_UJI_SHEET_URL`, formulir tetap berjalan: responden mengunduh `.json` atau menyalin ringkasan, dan data juga tersimpan di `localStorage` peramban.

## 3. Menjalankan sesi

| Tautan | Kegunaan |
| --- | --- |
| `/uji/?persona=A` | Responden dengan peran Operator Internal, peran terkunci |
| `/uji/?persona=B` | Responden dengan peran Warga Publik, peran terkunci |
| `/uji/?mode=mandiri` | Responden mengisi sendiri (dicatat sebagai mode daring) |

Responden: mahasiswa S1 Informatika, bukan anggota Kelompok 14, masing-masing hanya ikut sekali. Persona adalah peran yang diberikan penguji; bagi berselang-seling A, B, A, B menurut urutan kedatangan sampai 10/10, dan selalu pakai tautan dengan peran terkunci.

Lakukan satu sesi percobaan (pilot) sebelum pengambilan data, lalu hapus barisnya dari semua lembar data. Di akhir setiap sesi, simpan PDF pernyataan sukarela dengan nama file kode responden (misalnya `A-K7PQ.pdf`), lalu tekan **Responden berikutnya** untuk memulai sesi baru dengan tautan yang sama.

Untuk sesi tatap muka, pakai satu laptop dengan lebar ≥ 1100 px, mouse, zoom 100%, dan peramban selain mode penyamaran (agar cadangan `localStorage` tersimpan). Pada layar yang lebih sempit, layar pembuka menampilkan peringatan agar responden pindah ke laptop/komputer atau menghubungi penguji.

## 4. Lembar data dan analisis

| Lembar | Satu baris = | Kolom penting |
| --- | --- | --- |
| Responden | 1 responden | ID, persona, usia, literasi grafik, mode sesi, durasi, skor SUS, komentar |
| L3 | 1 diagram × responden (3 baris/responden) | Diagram, urutan tampil, KPI/CBQ dipilih, benar (1/0), E2E, latency, confidence, lucky guess |
| L4 | 1 task × responden (2 baris/responden) | Sukses, menyerah, time-on-task, jawaban salah, klik, klik tanpa respons, error, cross-filter, reset (B2, kolom perlu ditambahkan; lihat bagian 1), log |
| SUS | 1 responden | Q1–Q10, skor |
| Persetujuan | 1 responden | Waktu persetujuan dan pernyataan yang disetujui |
| Analisis | Tidak ada (lembar rumus) | Rumus otomatis: A. Level 3 per diagram dan persona (Acc_E2E, latency mean ± SD, confidence, CBQ-1/2/3, MAX, modus, % mayoritas, P_i); B. Fleiss' κ Total/Internal/Publik; C. Level 4 per task dan persona; D. SUS; E. tabel komparasi persona; F. diagnosis prioritas perbaikan |

Ekspor: **File → Download → Microsoft Excel (.xlsx)**. Rumus ikut terbawa. Simpan berkas di Google Drive kelompok dan cantumkan tautannya di laporan.

Bila lembar Analisis rusak atau terhapus, jalankan fungsi `buatAnalisis` di Apps Script untuk membuatnya ulang.

## 5. Batasan

- Waktu diukur di peramban responden (`performance.now()`), dengan resolusi 0,1 detik.
- “Klik tanpa respons” adalah proksi salah klik: klik di luar tombol, tautan, kolom isian, atau elemen peta/tabel yang dapat diklik. Klik pada area grafik untuk melihat tooltip juga terhitung. Laporkan definisi ini bersama angkanya.
- Stimulus ada di `docs/pengujian/stimulus/` dan diambil dari dashboard saat ini. Bila tampilan dashboard berubah, buat ulang dengan `UJI_STIMULI=1 npx playwright test tests/e2e/uji-stimulus.spec.ts`, lalu samakan `width`/`height` di `DIAGRAMS` (`src/uji/content.ts`) dengan ukuran PNG. Tes itu memastikan ukuran area grafik sama dengan render normal; baris judul yang kosong dihapus hanya bila ukuran grafik tidak berubah, dan peta dipotong mulai dari kanvasnya.
- Label sumbu dan legenda kategori tetap tampil pada stimulus karena berisi data, sehingga Level 3 berpotensi lebih mudah. Laporkan bersama hasil Acc_E2E.
- Stimulus D2 memakai tampilan bawaan panel tren (mode Rata-rata, satu seri). Panel menyediakan mode multi-garis (Multiwilayah, Kota vs Kab.), tetapi mode Kota vs Kab. akan tumpang tindih dengan makna CBQ-3 pada Diagram 3.
- B2 dinilai dari isian dan keadaan dashboard saat jawaban dikirim (Tahun 2022, Wilayah “Semua Kab/Kota”). Cara kembalinya tidak dibedakan; log interaksi menunjukkan apakah responden memakai tombol Reset Filter atau dropdown.
- Kunci jawaban ikut termuat di kode formulir. Responden yang membuka *developer tools* dapat melihatnya; sesi tatap muka mengurangi risiko ini.
