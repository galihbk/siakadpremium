# Fase 2 — Idempotency Insert: Kurikulum, Mata Kuliah, Kelas Kuliah

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_FINAL_READINESS_REPORT.md` dan `FEEDER_PHASE_1_IMPLEMENTATION_REPORT.md`. **Hanya tiga
alur Insert yang diubah** (`pushMataKuliahBaruToFeeder`, `pushKurikulumBaruToFeeder`,
`pushKelasKuliahBaruToFeeder`), sesuai batasan tugas ini.

## 0. Audit sebelum mengubah kode (ringkasan)

Sebelum menyentuh satu baris pun, ketiga fungsi dibaca penuh. Temuan pentingnya: **ketiganya SUDAH punya
pencarian berdasarkan identifier bisnis sebelum Insert** -- bukan sesuatu yang perlu dibangun dari nol:

| Fungsi | Act pencarian (sebelum insert) | Identifier bisnis yang dicocokkan |
|---|---|---|
| `pushMataKuliahBaruToFeeder` | `GetListMataKuliah` | `id_prodi` + `kode_mata_kuliah` |
| `pushKurikulumBaruToFeeder` | `GetListKurikulum` | `id_prodi` + `nama_kurikulum` |
| `pushKelasKuliahBaruToFeeder` | `GetListKelasKuliah` | `id_prodi` + `id_semester` + `id_matkul` + `nama_kelas_kuliah` |

Ini berarti permintaan #7–#8 di tugas ini ("sebelum retry Insert, lakukan pemeriksaan ke Feeder berdasarkan
identifier bisnis... kalau ditemukan, tautkan `feederId` tanpa Insert baru") **sudah berjalan setiap kali fungsi
dipanggil** (bukan cuma saat retry) -- tidak ada yang dikarang, tidak ada action/field baru yang ditebak, sesuai
instruksi "jangan mengarang nama action atau field".

**Yang BENAR-BENAR hilang**, dan menjadi fokus Fase 2 ini:
1. **Tidak ada klaim idempoten (`FeederSyncLock`)** -- dua proses push bersamaan bisa sama-sama lolos
   pengecekan "belum ada di Feeder" sebelum salah satu sempat menyimpan `feederId`, lalu keduanya mencoba Insert.
2. **Panggilan `InsertX...` tidak dibungkus try/catch sama sekali** di ketiga fungsi (dicek lewat pembacaan baris
   demi baris) -- kalau `callFeeder()` melempar error jaringan/timeout persis saat memanggil Insert, exception itu
   **tidak tertangkap di dalam loop**, melainkan lolos ke `catch` di level FUNGSI, yang MENGHENTIKAN seluruh batch
   push (bukan cuma satu record) dan mengembalikan pesan generik "Gagal push data ...". Ini bug reliability nyata
   yang ditemukan lewat audit, independen dari soal idempotency -- diperbaiki sekaligus di Fase 2 ini karena
   termasuk "komponen yang benar-benar diperlukan" untuk menangani permintaan #6 ("Feeder berhasil menerima Insert
   tetapi respons tidak sampai ke SIAKAD").
3. **Tidak ada pembedaan error bisnis vs jaringan** -- pengecekan existing yang gagal (`catch` di sekitar
   `GetListX`) menandai SEMUA kegagalan sebagai `markFailed`, termasuk kegagalan jaringan yang seharusnya
   "tidak pasti", bukan "pasti gagal".

Tidak ada bagian dari ketiga fungsi yang butuh action/field baru yang belum dikonfirmasi -- semua perbaikan di
atas memakai act yang SUDAH ada dan sudah dipakai sebelumnya.

## 1. File yang Diubah

| File | Perubahan |
|---|---|
| `apps/api/src/modules/integration-settings/integration-settings.service.ts` | +1 helper kecil `classifyPushError()` (dipakai bersama ketiga fungsi). Tiga fungsi ditulis ulang: tambah klaim `FeederSyncLock`, bungkus panggilan Insert dengan try/catch + klasifikasi error, tambah counter & field hasil `uncertain`. |
| `apps/api/test/feeder-insert-idempotency.test.ts` | **Baru.** Test permanen, 20 assertion. |
| `apps/api/package.json` | +1 script: `test:feeder-insert`. |

Tidak ada perubahan skema database atau migration -- `FeederSyncLock` sudah ada sejak hardening sebelumnya,
dipakai dengan label entity baru (`'Course'`, `'Curriculum'`, `'CourseClass'`) yang tidak butuh perubahan struktur
apa pun (kolom `entity` sudah `String` bebas, bukan enum tetap).

## 2. Perubahan Setiap Alur

### 2.1 `pushMataKuliahBaruToFeeder`

- Klaim `claimFeederSync('Course', course.id, 'INSERT')` di awal tiap iterasi, dilepas di `finally`.
- Pengecekan existing (`GetListMataKuliah`) dan Insert (`InsertMataKuliah`) masing-masing punya try/catch
  sendiri sekarang (sebelumnya Insert sama sekali tidak dibungkus).
- Error dari kedua langkah itu diklasifikasi lewat `classifyPushError()`: jaringan/timeout → `markUncertain`
  (counter `uncertain`, pesan jelas "akan dicek ulang"); selain itu → `markFailed` seperti sebelumnya.
- **Tidak ada perubahan pada logika pencarian prodi, validasi field, atau kontrak hasil lama** (`processed/
  created/linked/failed/skipped/failReasons` tetap ada dengan makna yang sama) -- `uncertain` murni field
  tambahan.

### 2.2 `pushKurikulumBaruToFeeder`

Pola identik dengan 2.1, dengan penyesuaian: pengecekan `GetSemester` (validasi semester mulai berlaku) ikut
berada di dalam blok try yang sama dengan `GetListKurikulum`, karena keduanya sama-sama langkah "pemeriksaan
sebelum insert" yang belum mengubah apa pun -- kalau salah satu gagal karena jaringan, seluruh langkah
pemeriksaan itu diklasifikasi `uncertain`, bukan hanya salah satunya. Validasi SKS dan Insert tetap terpisah
sesudahnya, sama seperti pola 2.1.

### 2.3 `pushKelasKuliahBaruToFeeder`

- Klaim `claimFeederSync('CourseClass', cls.id, 'INSERT')` **hanya** melingkupi bagian pencarian/Insert kelas itu
  sendiri -- **dilepas sebelum** langkah dosen pengajar (`InsertDosenPengajarKelasKuliah`) dijalankan. Ini
  disengaja: begitu `idKelas` dipastikan (baik lewat tautan maupun Insert baru), risiko duplikasi Insert kelas
  sudah lewat; langkah dosen pengajar beroperasi pada kelas yang ID Feeder-nya sudah pasti dan **sudah punya**
  mekanisme idempotensinya sendiri yang tidak disentuh di fase ini (`errorCode === '1192'` -- "Data Dosen
  Pengajar sudah ada" -- diperlakukan sebagai sukses, sudah ada sebelum fase ini).
- Error pada pencarian (`GetListKelasKuliah`) dan Insert (`InsertKelasKuliah`) diklasifikasi sama seperti 2.1/2.2.
- Validasi field (kode prodi, mata kuliah harus sudah terdaftar, format ID semester, panjang nama kelas) dan
  seluruh logika dosen pengajar **tidak diubah satu baris pun**.

## 3. Mekanisme Idempotency

Sama persis dengan pola yang sudah terbukti bekerja di `pushMahasiswaBaruToFeeder`/`pushKrsToFeeder` (hardening
sebelumnya) -- **bukan mekanisme baru**, hanya diterapkan ke tiga alur yang sebelumnya belum memilikinya:

1. Sebelum memproses satu record, coba `claimFeederSync(entity, localId, 'INSERT')` -- gagal (sudah diklaim
   proses lain) → `skipped += 1`, lanjut ke record berikutnya tanpa menyentuh Feeder sama sekali.
2. Body pemrosesan (cek existing → Insert → simpan `feederId` lokal) dibungkus `try { ... } finally { release }`
   -- klaim **selalu** dilepas, baik sukses, gagal, atau error tak terduga, lewat `finally` (dibuktikan lewat
   skenario 5 di §5: percobaan pertama gagal, percobaan kedua untuk record yang sama tetap bisa jalan).
3. Dua proses yang kebetulan memproses record yang sama **persis bersamaan** (bukan berurutan) -- diuji nyata
   dengan `Promise.all()` plus jeda buatan 30ms pada panggilan Insert supaya benar-benar tumpang tindih -- hanya
   SATU yang lolos klaim dan benar-benar memanggil `InsertX...`; yang satunya lagi berhenti di langkah 1.

## 4. Mekanisme Rekonsiliasi

Berbeda dari Fase 1 (`pushNilaiToFeeder`), ketiga alur ini **tidak memakai `runFeederSync()`/`FeederSyncLog`**
untuk rekonsiliasi -- dan ini sengaja, bukan kelalaian: karena pencarian-berdasarkan-identifier-bisnis sudah
dijalankan **setiap kali fungsi dipanggil ulang** (lihat §0), rekonsiliasi terjadi secara alami tanpa perlu
menyimpan status "tidak pasti" di tabel terpisah:

1. Percobaan pertama gagal jaringan saat Insert → `uncertain += 1`, record TIDAK diberi `feederId`, klaim dilepas.
2. Admin menjalankan Push lagi (kapan saja, tidak perlu memeriksa status apa pun lebih dulu).
3. Percobaan kedua otomatis mengulang langkah pencarian (`GetListMataKuliah`/`GetListKurikulum`/
   `GetListKelasKuliah`) terhadap identifier bisnis yang sama **sebelum** mencoba Insert lagi.
4. Kalau percobaan pertama TERNYATA sempat diterima Feeder sebelum koneksi putus, pencarian itu akan
   menemukannya dan record ditautkan (`linked += 1`) -- **`InsertX...` tidak dipanggil kedua kalinya**. Kalau
   tidak ditemukan, Insert dicoba lagi seperti biasa -- aman, karena belum pernah berhasil sebelumnya.

Ini dibuktikan langsung di test (§5, skenario 3 untuk Mata Kuliah dan skenario KLS 2 untuk Kelas Kuliah): jumlah
baris yang akhirnya tersimpan di sisi Feeder (tiruan) untuk satu record yang sama selalu **1**, tidak pernah
ganda, walau percobaan pertama gagal jaringan.

## 5. Hasil Test

**20 assertion, 20 lulus, 0 gagal** (`apps/api/test/feeder-insert-idempotency.test.ts`), terhadap database
Postgres sementara (disalin dari `siakad_premium`, dihapus otomatis di akhir) dan `global.fetch` yang sepenuhnya
di-mock.

| # | Skenario yang diminta | Hasil |
|---|---|---|
| Push berhasil | PASS (MK 1.1–1.2) |
| Dua proses push bersamaan | PASS, diuji dengan `Promise.all` sungguhan -- hanya 1 `InsertMataKuliah`/`InsertKurikulum` yang benar-benar terjadi (MK 4.1–4.2, KUR 1.1–1.2) |
| Error bisnis Feeder | PASS, ditandai `failed` bukan `uncertain`, `feederId` tetap kosong (MK 2.1–2.2) |
| Network failure dan timeout | PASS, ditandai `uncertain` bukan `failed` (MK 3.1, KLS 2.1) |
| Feeder menerima Insert tetapi respons hilang | PASS -- disimulasikan lewat `networkFailInsertFor`, lalu dibuktikan percobaan berikutnya menemukan data itu lewat pencarian (MK 3.2–3.5, KLS 2.2–2.3) |
| Rekonsiliasi menemukan data yang sudah ada | PASS, `InsertMataKuliah`/`InsertKelasKuliah` **tidak** dipanggil lagi setelah data ditemukan (MK 3.3, dibuktikan lewat hitungan `callLog`) |
| Data yang tidak ditemukan dapat diproses ulang dengan aman | PASS -- skenario 5 (MK): percobaan pertama ditolak Feeder (`rejectInsertFor`), percobaan kedua (Feeder tiruan diset menerima) berhasil tanpa halangan dari percobaan pertama |
| Lock dilepas setelah kegagalan | PASS (MK 5.1) -- dibuktikan tidak langsung, lewat keberhasilan percobaan kedua untuk record yang sama persis setelah percobaan pertama gagal (kalau lock tidak dilepas, percobaan kedua akan ikut `skipped`, bukan `created`) |
| Push ulang tidak membuat data ganda | PASS -- dicek langsung jumlah baris di `stored` (Feeder tiruan) untuk satu record selalu 1, baik lewat jalur `Promise.all` maupun jalur gagal-lalu-coba-lagi (MK 3.5, MK 4 implisit lewat `insertCalls===1`, KUR 1.3, KLS 2.3) |

**Regresi**: test Fase 1 (`test:feeder-nilai`) dijalankan ulang setelah perubahan Fase 2 -- **26/26 tetap lulus**,
karena perubahan Fase 2 sama sekali tidak menyentuh `pushNilaiToFeeder` maupun `runFeederSync` (hanya menambah
satu method baru `classifyPushError`, tidak mengubah yang sudah ada).

## 6. Hasil Build dan Typecheck

| Alat | Hasil |
|---|---|
| `tsc --noEmit` (`apps/api/src`, konfigurasi resmi) | Bersih, nol error |
| `tsc --noEmit` terhadap `test/feeder-insert-idempotency.test.ts` (konfigurasi setara nestjs) | Bersih, nol error |
| `nest build` | Bersih, nol error; API lokal dinyalakan ulang dari hasil build, `GET /api/v1/health` → `200` |
| `eslint` | **Tetap tidak bisa dijalankan** -- binary tidak terpasang di lingkungan ini sama sekali (kondisi pra-ada, bukan akibat fase ini, lihat `FEEDER_PHASE_1_IMPLEMENTATION_REPORT.md` §4) |

## 7. Risiko yang Belum Diselesaikan

1. **`eslint` tetap tidak terverifikasi** (sama seperti Fase 1).
2. **Rekonsiliasi di sini lebih sederhana dari Fase 1** -- tidak memakai `FeederSyncLog`/status `PENDING`
   eksplisit, murni mengandalkan pencarian-ulang setiap kali fungsi dipanggil. Ini valid dan terbukti bekerja
   (§4–5), tapi berarti **tidak ada riwayat tersimpan** untuk kejadian "sempat gagal jaringan" pada ketiga alur
   ini -- admin tidak akan melihat jejaknya di `FeederSyncLog` (tabel itu tetap kosong untuk `entity IN ('Course',
   'Curriculum', 'CourseClass')`), hanya di `feederSyncError` per-baris (yang tertimpa begitu percobaan berikutnya
   berhasil). Kalau keseragaman riwayat lintas semua alur penting, migrasi ketiganya ke `runFeederSync()` seperti
   Nilai adalah pekerjaan terpisah (lebih besar, menyentuh struktur try/catch yang lebih dalam) -- **tidak
   dikerjakan di fase ini** sesuai batasan "hindari perubahan yang tidak benar-benar diperlukan".
3. **Langkah dosen pengajar di `pushKelasKuliahBaruToFeeder` tidak diberi klaim idempoten tersendiri** (§2.3) --
   risiko duplikasi di langkah itu sudah ditangani SEBELUM fase ini lewat `errorCode === '1192'`, jadi bukan gap
   baru, tapi juga bukan sesuatu yang diperkuat lebih lanjut di fase ini.
4. **Test ini belum pernah dijalankan terhadap server Feeder sungguhan** -- seperti seluruh rangkaian audit
   sebelumnya.
5. **Klaim `'Course'/'INSERT'`** di tabel `FeederSyncLock` memakai nama entity yang sama persis dengan yang
   dipakai Prisma untuk model `Course` -- tidak ada tabrakan dengan label lain yang sudah ada (`'Student'`,
   `'CourseEnrollment'`), dicek lewat pencarian seluruh pemanggilan `claimFeederSync`/`releaseFeederSync` di file
   (§ akhir laporan ini, 6 pasangan total, semuanya kombinasi entity+operation yang berbeda).

---

**Konfirmasi batasan** (dicek ulang lewat pembacaan kode, bukan asumsi):
- `pushNilaiToFeeder` (Fase 1): **tidak disentuh** -- `runFeederSync` tidak diubah, hanya ditambah 1 method baru
  terpisah (`classifyPushError`) yang tidak dipanggil dari `pushNilaiToFeeder`.
- `pushMahasiswaBaruToFeeder`, `pushKrsToFeeder`: klaimnya (`'Student'/'INSERT'`, `'CourseEnrollment'/'INSERT_KRS'`)
  **masih persis seperti sebelumnya**.
- `refreshFeederToken`/`looksLikeExpiredFeederToken`: **tidak disentuh**, masih kode yang tidak pernah dipanggil.
- Tidak ada perubahan kontrak API (nama field hasil lama dipertahankan, `uncertain` murni tambahan).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
