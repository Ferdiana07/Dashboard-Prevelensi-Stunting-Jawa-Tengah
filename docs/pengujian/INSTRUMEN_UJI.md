# Instrumen Uji Dashboard Prioritas Intervensi Stunting Jawa Tengah

**Validasi visualisasi Munzner Nested Model Level 3 (Visual Encoding & Idiom) dan Level 4 (Task-Based Usability, ISO 9241-11)**
Kelompok 14 · Visualisasi Data · Departemen Informatika, Universitas Diponegoro · 2026

| Komponen | Isi |
| --- | --- |
| Objek uji | 1 dashboard terpadu dengan 3 komponen diagram: Choropleth Map (“Peta Prevalensi Stunting”), Line Trend (“Analisis Tren Temporal”), Horizontal Bar (“Rata-rata Prevalensi: Kota vs Kabupaten”) |
| Alat uji | Formulir web `/uji/` pada situs dashboard (satu sesi: profil → persetujuan → Level 3 → Level 4 → SUS) |
| Partisipan | N = 20: 10 Persona A (Operator Internal), 10 Persona B (Warga Publik) |
| Data | Terkirim otomatis ke Google Sheet (lembar Responden, L3, L4, SUS, Persetujuan, Analisis) |

## A. Persona

| Persona | Kriteria responden | Fokus uji |
| --- | --- | --- |
| **A · Operator Internal** (n = 10) | Staf teknis/analis pemerintah daerah, Dinas Kesehatan, TPPS, atau mahasiswa yang berperan sebagai analis | Analisis diagnostik dan cross-filtering |
| **B · Warga Publik** (n = 10) | Masyarakat umum tanpa latar belakang analisis data | Pencarian informasi mandiri dan pemahaman cepat |

Data profil yang dicatat: nama (tidak dilaporkan), usia, literasi grafik (1 = hampir tidak pernah membaca grafik … 5 = hampir setiap hari), dan mode sesi.

## B. Prosedur sesi (± 15 menit, 1-on-1)

1. Penguji membuka tautan sesuai persona: `/uji/?persona=A` atau `/uji/?persona=B`. Gunakan laptop dengan lebar layar ≥ 1100 px, zoom peramban 100%.
2. Responden mengisi profil dan **Pernyataan Kesediaan Sukarela** (4 butir yang dicentang).
3. **Level 3**: 3 diagram tersamar disajikan satu per satu dalam urutan acak; urutan opsi jawaban juga diacak.
4. **Level 4**: 2 tugas sesuai persona pada dashboard asli yang dimuat di dalam formulir.
5. **SUS**: 10 pernyataan skala 1–5, satu pernyataan per layar, diisi segera setelah tugas selesai.
6. Komentar terbuka, lalu kirim. Penguji memastikan layar menampilkan “hasil terkirim” dan meminta responden mencetak/menyimpan pernyataan sebagai PDF.

Penguji tidak memberi petunjuk selama Level 3 dan Level 4. Bila responden bertanya, jawab: “Silakan lakukan sesuai pemahaman Anda.”

## C. Tugas 1 — Level 3: Visual Reverse-Mapping Test (Blinded Chart Masking)

**Stimulus**: potongan satu panel dari render dashboard saat ini (`docs/pengujian/stimulus/peta.png`, `tren.png`, `batang.png`; dibuat ulang dengan `UJI_STIMULI=1 npx playwright test tests/e2e/uji-stimulus.spec.ts`). Judul, subjudul, catatan, toolbar, dan anotasi disembunyikan; marks, sumbu, satuan, legenda kategori, dan garis acuan dipertahankan.

**Langkah per diagram**: tekan *Tampilkan diagram* → hitung mundur 3-2-1 → gambar muncul (stopwatch mulai) → pilih KPI → pilih CBQ → *Kunci jawaban* (stopwatch berhenti = **Decode Latency**) → pilih **Confidence** 1–5 (1 Menebak, 2 Ragu-ragu, 3 Cukup yakin, 4 Yakin, 5 Sangat yakin).

### Pertanyaan per persona

| Diagram | Pertanyaan Persona A (Operator Internal) | Pertanyaan Persona B (Warga Publik) |
| --- | --- | --- |
| **D1** Choropleth Map | “Berdasarkan pola gradasi warna spasial pada peta ini, indikator pemantauan dan keputusan alokasi intervensi apa yang sedang ditunjukkan?” | “Melihat perbedaan warna antarwilayah pada peta ini, informasi kondisi apa yang paling tepat digambarkan?” |
| **D2** Line Trend | “Berdasarkan pergerakan garis deret waktu ini, evaluasi kinerja antarperiode apa yang harus Anda laporkan?” | “Melihat naik-turunnya garis dari tahun ke tahun pada grafik ini, perubahan kondisi apa yang sedang terjadi?” |
| **D3** Horizontal Bar | “Berdasarkan perbandingan panjang batang horizontal ini, prioritas distribusi intervensi untuk kelompok wilayah mana yang sedang dianalisis?” | “Melihat panjang batang dari atas ke bawah ini, perbandingan apa yang sedang ditampilkan?” |

### Opsi jawaban (sama untuk semua diagram dan persona)

**Pilihan 1: Informasi (KPI) yang ditampilkan**

| Kode | Label | Teks opsi |
| --- | --- | --- |
| KPI-1 | Sebaran wilayah | Tingkat prevalensi stunting tiap kabupaten/kota, dikelompokkan ke dalam kategori risiko |
| KPI-2 | Perubahan antarperiode | Perubahan prevalensi stunting dari periode ke periode (2019, 2021, 2022) |
| KPI-3 | Selisih kelompok | Selisih rata-rata prevalensi stunting antara kelompok kota dan kelompok kabupaten |

**Pilihan 2: Pertanyaan bisnis (CBQ) yang dijawab** — kategori untuk matriks Fleiss' κ

| Kode | Label | Teks opsi | Padanan pada lembar tugas | CBQ laporan kelompok |
| --- | --- | --- | --- | --- |
| CBQ-1 | Wilayah risiko tertinggi | Wilayah mana yang prevalensinya paling tinggi dan perlu diprioritaskan untuk intervensi? | Wilayah kepadatan/risiko tertinggi | CBQ 1 · Wilayah prioritas |
| CBQ-2 | Laju perubahan tren | Bagaimana prevalensi berubah dari periode ke periode: membaik atau memburuk? | Laju perubahan tren bulanan | CBQ 2 · Perubahan 2019–2022 |
| CBQ-3 | Peringkat perbandingan kelompok | Kelompok wilayah mana (kota atau kabupaten) yang peringkatnya lebih tinggi dan perlu porsi intervensi lebih besar? | Peringkat alokasi anggaran sektor | CBQ 4 · Kota dan kabupaten |

Data dashboard bersifat tahunan (2019, 2021, 2022), sehingga “bulanan” pada lembar tugas disesuaikan menjadi “antarperiode”. “Sektor/anggaran” disesuaikan menjadi kelompok wilayah (kota vs kabupaten) dan porsi intervensi.

### Kunci jawaban (Ground Truth) — khusus penguji

| Diagram | KPI benar | CBQ benar |
| --- | --- | --- |
| D1 Choropleth Map | KPI-1 | CBQ-1 |
| D2 Line Trend | KPI-2 | CBQ-2 |
| D3 Horizontal Bar | KPI-3 | CBQ-3 |

**E2E benar** = KPI benar **dan** CBQ benar. **Lucky guess** = E2E benar dengan Confidence ≤ 2 (dicatat sebagai anomali).

## D. Tugas 2 — Level 4: Task-Based Usability Testing

Dashboard asli dimuat di dalam formulir. Dok di bagian bawah layar selalu menampilkan skenario, stopwatch, dan tombol **Jawab** yang membuka laci jawaban. Stopwatch mulai setelah dashboard selesai dimuat dan berhenti saat jawaban benar atau responden menekan **Saya menyerah**. Jawaban salah boleh diperbaiki; setiap jawaban salah dihitung sebagai error.

### Persona A — Operator Internal (analisis diagnostik & cross-filtering)

| Task | Skenario | Isian jawaban | Kunci |
| --- | --- | --- | --- |
| **A1** Identifikasi Anomali Spasial-Temporal | Temukan kabupaten/kota dengan prevalensi stunting tertinggi tahun 2022 pada peta “Peta Prevalensi Stunting”. Klik wilayah tersebut agar grafik “Analisis Tren Temporal” di bagian bawah otomatis mengikuti wilayah itu, lalu tentukan pada periode mana prevalensi wilayah tersebut melonjak (naik). | Wilayah tertinggi 2022; periode lonjakan (2019 → 2021 / 2021 → 2022 / Tidak ada kenaikan) | Kab. Brebes (29,1%); 2021 → 2022 (26,3% → 29,1%) |
| **A2** Perbandingan Lintas Kelompok | Pada grafik batang “Rata-rata Prevalensi: Kota vs Kabupaten” tahun 2022, bandingkan kelompok kota dan kabupaten. Tentukan kelompok dengan rata-rata prevalensi tertinggi, lalu cari wilayah di kelompok itu yang kinerjanya paling menurun, yaitu kenaikan prevalensi terbesar 2019→2022 (kolom “Perubahan 2019→2022” pada tabel “Peringkat Wilayah”). | Kelompok; rata-rata (%); wilayah | Kabupaten; 21,7%; Kab. Pati (+3,6 pp) |

### Persona B — Warga Publik (pencarian informasi mandiri & pemahaman cepat)

| Task | Skenario | Isian jawaban | Kunci |
| --- | --- | --- | --- |
| **B1** Kondisi Wilayah Tempat Tinggal | Bayangkan Anda tinggal di Kabupaten Temanggung. Cari Kab. Temanggung pada peta “Peta Prevalensi Stunting” dan klik wilayahnya. Lalu periksa pada grafik “Analisis Tren Temporal” apakah kondisi stunting di wilayah tersebut membaik atau memburuk pada periode terakhir (2021 → 2022). | Prevalensi 2022 (%); kondisi (Membaik / Memburuk / Tetap sama) | 28,9%; Memburuk (20,5% → 28,9%) |
| **B2** Transparansi Prioritas | Ubah filter Tahun menjadi 2021. Pada grafik batang “Rata-rata Prevalensi: Kota vs Kabupaten”, temukan kelompok wilayah dengan rata-rata prevalensi paling besar. | Kelompok; rata-rata (%) | Kabupaten; 20,1% |

Wilayah B1 dibuat tetap (Kab. Temanggung) agar tingkat kesulitan sama bagi semua responden, termasuk yang tidak tinggal di Jawa Tengah. Skenario menyebut panel dengan judul yang tertulis di dashboard. Pada B2, responden tidak diminta mengembalikan filter ke tampilan awal; jawaban dinilai dari isian saja, apa pun posisi filter saat menjawab (penyesuaian kelompok terhadap butir “reset filter” pada lembar tugas).

Jawaban angka diterima dengan koma atau titik (21,7 atau 21.7) dan harus sama dengan nilai satu desimal yang ditampilkan dashboard.

### Data yang direkam otomatis per task

| Data | Definisi |
| --- | --- |
| Sukses | 1 bila semua isian benar tanpa bantuan; 0 bila menyerah |
| Time-on-task | Detik sejak dashboard siap hingga jawaban benar/menyerah |
| Jawaban salah | Jumlah pengiriman jawaban yang belum tepat |
| Klik tanpa respons | Klik pada area dashboard yang bukan kontrol interaktif (indikator salah klik/kebingungan navigasi) |
| Error | Jawaban salah + klik tanpa respons |
| Perubahan filter | Jumlah perubahan dropdown/kotak centang |
| Cross-filter dipakai | A1 (Brebes) / B1 (Temanggung): wilayah sasaran pernah terpilih lewat peta/tabel sehingga grafik tren mengikutinya |
| Log interaksi | Urutan klik dan perubahan filter dengan cap waktu, untuk analisis kebingungan |

## E. System Usability Scale (SUS)

Skala 1 (sangat tidak setuju) – 5 (sangat setuju).

1. Saya berpikir akan sering menggunakan dashboard ini.
2. Saya merasa dashboard ini rumit untuk digunakan.
3. Saya merasa dashboard ini mudah digunakan.
4. Saya membutuhkan bantuan orang teknis untuk dapat menggunakan dashboard ini.
5. Saya merasa fitur-fitur dashboard ini (peta, grafik, tabel, filter) terintegrasi dengan baik.
6. Saya merasa ada banyak hal yang tidak konsisten pada dashboard ini.
7. Saya merasa kebanyakan orang akan cepat memahami cara menggunakan dashboard ini.
8. Saya merasa dashboard ini membingungkan.
9. Saya merasa percaya diri saat menggunakan dashboard ini.
10. Saya perlu banyak belajar sebelum dapat menggunakan dashboard ini.

Skor = [Σ(butir ganjil − 1) + Σ(5 − butir genap)] × 2,5 → 0–100. Grade (Sauro–Lewis): A ≥ 80,3; B ≥ 74; C ≥ 68; D ≥ 51; F < 51.

Pertanyaan terbuka: “Bagian dashboard mana yang paling membingungkan, dan apa saran Anda?”

## F. Pernyataan Kesediaan Sukarela

Saya yang bertanda tangan di bawah ini menyatakan bahwa:

1. Saya mengikuti uji coba dashboard ini secara sukarela, tanpa paksaan dan tanpa imbalan yang mengikat.
2. Saya memahami bahwa yang diuji adalah dashboard, bukan kemampuan saya, dan saya boleh berhenti kapan saja tanpa konsekuensi.
3. Saya mengizinkan jawaban, waktu pengerjaan, dan aktivitas klik saya selama uji direkam dan diolah untuk laporan mata kuliah Visualisasi Data, Departemen Informatika, Universitas Diponegoro.
4. Saya memahami bahwa nama saya tidak akan dicantumkan dalam laporan; hasil disajikan dengan kode responden.

Disetujui secara elektronik dengan mencentang keempat butir pada formulir; waktu persetujuan tercatat di lembar Persetujuan. Setiap responden dapat mencetak lembar pernyataan sebagai PDF di akhir sesi.

## G. Metrik dan target kelulusan

| Level | Metrik | Rumus | Target |
| --- | --- | --- | --- |
| 3 | Acc_E2E | Σ E2E benar ÷ n | ≥ 85% |
| 3 | Decode Latency | Mean ± SD detik sejak gambar tampil hingga jawaban dikunci | ≤ 10 s |
| 3 | Fleiss' κ | Subjek = 3 diagram, penilai = responden, kategori = CBQ-1/2/3. P_i = (Σ n_ij² − n) / (n(n − 1)); P̄ = rata-rata P_i; p_j = Σ n_ij ÷ (N·n); P̄e = Σ p_j²; κ = (P̄ − P̄e) / (1 − P̄e). Dihitung untuk κ_Internal, κ_Publik, κ_Total | ≥ 0,75 |
| 3 | Confidence | Rata-rata skor 1–5; lucky guess = E2E benar dengan skor ≤ 2 | — |
| 3 | Modus / Majority Vote | MAX dan kategori terbanyak per diagram (Total, A, B), dibandingkan dengan kunci | Mayoritas ≥ 85% dan sama dengan kunci |
| 4 | Task Completion Rate | Σ sukses ÷ jumlah task | ≥ 90% |
| 4 | Time-on-Task & Error | Rata-rata detik per task; rata-rata error per task | ≤ 30 s/task |
| 4 | SUS | Skor 0–100 | ≥ 75 (Grade B) |

Komponen diagram dengan mayoritas < 85%, modus meleset dari kunci, P_i terendah, confidence terendah, atau error tertinggi ditetapkan sebagai prioritas perbaikan. Lembar **Analisis** pada Google Sheet menghitung semuanya secara otomatis (bagian F: diagnosis).
