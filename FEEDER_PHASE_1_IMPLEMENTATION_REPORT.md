# Fase 1 — Integrasi `runFeederSync()` ke `pushNilaiToFeeder`

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_FINAL_READINESS_REPORT.md` §9/§10 (rekomendasi urutan implementasi, poin 1). **Hanya
alur Push Nilai yang diubah**, sesuai batasan tugas ini.

## 1. File yang Diubah

| File | Perubahan |
|---|---|
| `apps/api/src/modules/integration-settings/integration-settings.service.ts` | `runFeederSync()` (helper bersama): klasifikasi error diperluas dari 2 jadi 3 kasus (SUCCESS / **PENDING baru** / FAILED). `pushNilaiToFeeder()`: ditulis ulang untuk memakai `runFeederSync()`, menambah langkah rekonsiliasi, dan field hasil baru `uncertain`. |
| `apps/api/test/feeder-nilai-reconciliation.test.ts` | **Baru.** Test permanen, 26 assertion. |
| `apps/api/package.json` | +1 script: `test:feeder-nilai`. |

Tidak ada perubahan skema database, tidak ada migration baru (`FeederSyncLog.status` sudah berupa `String` bebas
sejak awal, bukan enum tetap — nilai `'PENDING'` yang baru dipakai tidak butuh perubahan struktur apa pun).

## 2. Perubahan Perilaku

### 2.1 `pushNilaiToFeeder` — sebelum vs sesudah

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Klaim idempoten | Manual (`claimFeederSync('CourseEnrollment', id, 'UPDATE_NILAI')`) | Dilakukan **di dalam** `runFeederSync` (operasi `'UPDATE'`) — perilaku sama (satu klaim aktif per enrollment), hanya label operasi internal berubah dari `UPDATE_NILAI` menjadi `UPDATE`. Tidak berdampak ke pemanggil lain karena tidak ada kode lain yang memakai label `UPDATE_NILAI`. |
| Pencatatan riwayat (`FeederSyncLog`) | Ditulis manual, hanya 2 status (`SUCCESS`/`FAILED`), **tanpa status PROCESSING** di antaranya | Otomatis lewat `runFeederSync`: `PROCESSING` → `SUCCESS`/`PENDING`/`FAILED`, `attempt` terhitung otomatis per (entity, localId, operation, act) |
| Kegagalan jaringan/timeout | Ditandai `FAILED` (sama seperti penolakan bisnis Feeder -- **tidak dibedakan**) | Ditandai **`PENDING`** ("status tidak pasti") -- beda tegas dari `FAILED`. Hasil fungsi (`uncertain`) ikut memisahkannya dari `failed` |
| Feeder konfirmasi sukses, lalu simpan lokal gagal | Tertulis sebagai `FAILED` biasa di log (kalau tertangkap) -- jejak "mungkin sudah terkirim" **hilang** | Tertulis **`SUCCESS`** + `responseSummary: 'NEEDS_RECONCILIATION: ...'` -- tidak pernah mendorong pengiriman ulang yang bisa menduplikasi data resmi di Feeder |
| Percobaan ulang setelah status tidak pasti | Tidak ada pembedaan -- langsung kirim ulang buta | **Rekonsiliasi**: kalau ada log `PENDING` sebelumnya untuk enrollment itu, cek dulu ke Feeder (`GetDetailNilaiPerkuliahanKelas`) sebelum memutuskan kirim ulang atau cukup menandai tersinkron |
| Field hasil (`processed/created/linked/failed/skipped/failReasons`) | Sudah ada | **+1 field baru: `uncertain`** (jumlah yang berstatus tidak pasti). Field lama tidak dihapus/diganti maknanya -- aditif, bukan breaking change. |
| Filter `gradeStatus = 'FINAL'` dan `gradeLetter` wajib ada | Ada di query `eligible` | **Tidak diubah sama sekali** -- baris query persis sama |
| Pengecekan `errorCode !== '0'` sebagai syarat sukses | Ada | **Tidak diubah** -- tetap satu-satunya syarat `markSynced()` dipanggil (lihat §2.2) |

### 2.2 Bagaimana rekonsiliasi bekerja

1. **Penanda sukses TIDAK PERNAH diberikan hanya karena request HTTP selesai.** `markSynced()` hanya dipanggil
   setelah `callFeeder()` mengembalikan `errorCode === '0'` (balasan bisnis Feeder yang eksplisit), persis di
   baris sebelum `courseEnrollment.update(...)` dijalankan. Kalau Feeder membalas menolak (`errorCode !== '0'`),
   kode **melempar Error** sebelum sempat memanggil `markSynced()` -- `runFeederSync` lalu menandainya `FAILED`
   karena `feederConfirmed` tetap `false`.
2. **Status tidak pasti (`PENDING`) muncul hanya kalau tidak ada balasan Feeder sama sekali** -- `callFeeder()`
   melempar exception murni jaringan (koneksi putus, timeout) sebelum sempat membaca respons. `runFeederSync`
   membedakan ini dari penolakan bisnis lewat `isRetryableFeederError(err)` (helper yang sama yang sudah dipakai
   `callFeeder` sendiri untuk retry jaringan -- tidak ditulis ulang, dipakai ulang).
3. **Pada percobaan berikutnya** untuk enrollment yang sama, sebelum mengirim, kode mencari log `PENDING`
   terakhir untuk `(entity, localId, operation, act)` itu. Kalau ada, ia memanggil `GetDetailNilaiPerkuliahanKelas`
   (baca-saja) dan membandingkan `nilai_huruf` yang tersimpan di Feeder dengan yang akan dikirim:
   - **Cocok** → dianggap sudah tersinkron dari percobaan sebelumnya; `markSynced()` dipanggil dengan catatan
     "rekonsiliasi", data lokal ditandai tersinkron, **`UpdateNilaiPerkuliahanKelas` TIDAK dipanggil lagi**.
   - **Tidak cocok/tidak ketemu** → lanjut kirim seperti biasa (aman, karena `UpdateNilaiPerkuliahanKelas` bersifat
     menimpa/idempoten dari sisi konten, bukan menambah baris baru seperti Insert).
4. **Kegagalan simpan lokal SETELAH Feeder konfirmasi** (`markSynced()` sudah terpanggil, lalu
   `courseEnrollment.update(...)` melempar error) ditangani oleh `runFeederSync` yang sudah ada sebelumnya (tidak
   diubah di fase ini) -- tetap `SUCCESS` + `NEEDS_RECONCILIATION`, bukan `FAILED`.

## 3. Hasil Seluruh Test

**26 assertion, 26 lulus, 0 gagal.** Dijalankan terhadap database Postgres **sementara** (disalin dari
`siakad_premium` lalu dihapus otomatis di akhir skrip -- bukan database development, bukan produksi) dan
`global.fetch` yang **sepenuhnya di-mock** (nol permintaan jaringan sungguhan ke Feeder mana pun).

| # | Skenario yang diminta | Assertion | Hasil |
|---|---|---|---|
| 1 | Pengiriman nilai berhasil | 1.1–1.3 | PASS -- `feederGradeSyncedAt` terisi, log `SUCCESS` (bukan dari HTTP 200 semata, dibuktikan lewat jalur `markSynced` yang hanya terpanggil setelah `error_code=0`) |
| 2 | Feeder mengembalikan error bisnis | 2.1–2.3 | PASS -- ditandai `failed` (bukan `uncertain`), data lokal TIDAK berubah, log `FAILED` |
| 3 | Kegagalan jaringan | 3.1–3.3 | PASS -- ditandai `uncertain` (bukan `failed`), log `PENDING` |
| 4 | Timeout dan retry | 4.1 | PASS untuk klasifikasi timeout (`AbortError`) sebagai `uncertain`. **Catatan jujur**: "retry" di sini berarti admin menjalankan Push lagi (callFeeder TIDAK auto-retry `act` Update, sesuai desain hardening sebelumnya yang sengaja tidak retry otomatis Insert/Update demi hindari duplikasi -- tidak diubah di fase ini) |
| 5 | Feeder sukses tetapi penyimpanan lokal gagal | 5.1–5.4 | PASS -- log tetap `SUCCESS` + `NEEDS_RECONCILIATION`, data lokal (`feederGradeSyncedAt`) sengaja TIDAK terisi supaya kelihatan perlu ditinjau admin |
| 6 | Rekonsiliasi setelah status tidak pasti | 6.1–6.5 | PASS -- percobaan kedua memanggil `GetDetailNilaiPerkuliahanKelas` dulu (1 kali), **tidak** memanggil `UpdateNilaiPerkuliahanKelas` lagi karena nilai sudah cocok, hasil dihitung sebagai berhasil |
| 7 | Dua proses mengirim nilai yang sama bersamaan | 7.1–7.2 | PASS -- diuji dengan `Promise.all` sungguhan (bukan berurutan), hanya **1** panggilan `UpdateNilaiPerkuliahanKelas` yang benar-benar terjadi walau dua proses dijalankan serentak |
| 8 | Nilai DRAFT tidak pernah dikirim | 8.1–8.2 | PASS -- `processed: 0`, nol panggilan `UpdateNilaiPerkuliahanKelas` (filter `gradeStatus: 'FINAL'` yang sudah ada, tidak diubah, terbukti tetap berfungsi) |
| 9 | Nilai FINAL yang sudah terkirim tidak dikirim ulang | 9.1–9.2 | PASS -- enrollment dengan `feederGradeSyncedAt` terisi tidak masuk `eligible` sama sekali |

## 4. Hasil Typecheck, Lint, dan Build

| Alat | Hasil |
|---|---|
| `tsc --noEmit` (seluruh `apps/api/src`, konfigurasi resmi proyek) | **Bersih, nol error** |
| `tsc --noEmit` terhadap file test itu sendiri (konfigurasi setara, karena `test/` sengaja di luar `include` resmi `tsconfig.json` -- hanya `src/**/*`) | **Bersih, nol error** setelah dua penyesuaian tipe kecil di file test (cast `PrismaClient` → tipe `PrismaService` yang diminta konstruktor, dan akses `runFeederSync` yang bersifat `private` lewat `as any` -- lazim untuk kode uji yang sengaja menembus visibilitas `private`) |
| `eslint` (`pnpm run lint`) | **TIDAK BISA DIJALANKAN** -- binary `eslint` tidak terpasang di `node_modules/.bin` lingkungan kerja ini sama sekali (`sh: eslint: not found`), bukan sesuatu yang rusak akibat perubahan fase ini. Saya tidak menginstal paket baru untuk memperbaikinya (di luar lingkup "hanya ubah yang benar-benar diperlukan untuk integrasi ini"). |
| `nest build` | **Bersih, nol error**, dan API lokal berhasil dinyalakan ulang dari hasil build itu (`GET /api/v1/health` → `200`) |

## 5. Risiko yang Masih Tersisa

1. **`eslint` tidak bisa diverifikasi** di lingkungan kerja ini (§4) -- kalau ada aturan lint yang dilanggar file
   baru/yang diubah, itu belum terdeteksi. `tsc` sudah bersih, tapi itu bukan pengganti lint penuh.
2. **"Retry" untuk `act` Update tetap manual** (jalankan Push lagi), bukan otomatis di dalam satu kali panggilan
   -- ini konsisten dengan keputusan desain hardening sebelumnya (jangan retry otomatis Insert/Update demi hindari
   duplikasi), **sengaja tidak diubah** di fase ini sesuai batasan "jangan mengubah mekanisme refresh token" dan
   "jangan mengubah alur push lain" -- tapi perlu diketahui kalau ekspektasinya "retry otomatis dalam satu klik".
3. **Rekonsiliasi hanya dipicu oleh log `PENDING` yang sudah tercatat** -- kalau proses API mati tepat setelah
   `markSynced()`/update lokal tapi SEBELUM baris `FeederSyncLog` sempat tertulis `PENDING` (jendela sangat
   sempit, antara `callFeeder` melempar dan `runFeederSync` menulis log), rekonsiliasi tidak akan terpicu untuk
   kasus itu secara spesifik -- walau risikonya sangat kecil (celah waktu sangat pendek, murni operasi tulis DB
   lokal) dan bukan skenario yang diminta diuji secara eksplisit di tugas ini.
4. **Test ini belum pernah dijalankan terhadap server Feeder sungguhan** -- seperti seluruh rangkaian audit
   sebelumnya, tidak ada server yang bisa dijangkau dari lingkungan kerja ini. Mock Feeder yang dipakai
   (`installFeederMock` di file test) meniru perilaku yang didokumentasikan sebelumnya (`error_code`/`error_desc`,
   kode `1178`), bukan diverifikasi langsung terhadap server asli.
5. **Tidak ada test runner (Jest/Vitest) yang ditambahkan ke proyek** -- test ditulis sebagai skrip `ts-node`
   mandiri (`pnpm --filter @siakad/api test:feeder-nilai`), konsisten dengan ketiadaan infrastruktur test apa pun
   di repo ini sebelumnya (dikonfirmasi di `FEEDER_FINAL_READINESS_REPORT.md` §8), dan sesuai batasan "hanya ubah
   komponen yang benar-benar diperlukan" -- menambah Jest ke seluruh proyek NestJS yang belum pernah punya test
   sama sekali adalah keputusan arsitektur terpisah yang lebih besar dari lingkup fase ini.

## 6. Konfirmasi: Enam Alur Push Lainnya Tidak Diubah

Diverifikasi lewat pembacaan ulang kode (bukan asumsi):

- `pushMahasiswaBaruToFeeder`, `pushKrsToFeeder`: klaim idempoten manual (`claimFeederSync`/`releaseFeederSync`
  dengan label `'Student'/'INSERT'` dan `'CourseEnrollment'/'INSERT_KRS'`) **masih ada persis seperti sebelumnya**
  -- dicek lewat pencarian baris kode: kedua pasangan klaim/lepas itu tidak tersentuh sama sekali oleh perubahan
  fase ini (hanya `pushNilaiToFeeder` yang klaimnya berpindah ke dalam `runFeederSync`).
- `pushKurikulumBaruToFeeder`, `pushMataKuliahBaruToFeeder`, `pushKelasKuliahBaruToFeeder`: **tidak disentuh sama
  sekali** -- tetap seperti kondisi di `FEEDER_FINAL_READINESS_REPORT.md` (tanpa klaim idempoten, hanya
  mengandalkan `feederId IS NULL`), persis sesuai batasan tugas ini untuk tidak mengerjakannya di fase ini.
- Mekanisme refresh token (`refreshFeederToken`, `looksLikeExpiredFeederToken`) **tidak disentuh** -- masih kode
  yang tidak pernah dipanggil, seperti dilaporkan di `FEEDER_FINAL_READINESS_REPORT.md`.
- Filter `gradeStatus = 'FINAL'` dan validasi `gradeLetter` di query `eligible` pada `pushNilaiToFeeder`:
  **baris kode persis sama**, tidak diubah satu karakter pun.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
