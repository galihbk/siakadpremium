# Hardening Integrasi Neo Feeder — SIAKAD Premium

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_AUDIT_REPORT.md`. Lingkup: `apps/api/src/modules/integration-settings/`, `packages/database/prisma/schema.prisma`.

## ⚠️ Pemberitahuan penting sebelum bagian lain: dampak sampingan `prisma db push`

Saat mengerjakan ini saya menjalankan `pnpm --filter @siakad/database db:generate` lalu `npx prisma db push` di database lokal (`localhost:5434`, BUKAN produksi) untuk menerapkan dua tabel baru punya saya (`FeederSyncLog`, `FeederSyncLock`).

**Yang saya temukan setelahnya**: `packages/database/prisma/schema.prisma` di working tree ternyata *sudah* berisi sekitar **35 model baru berawalan `Lms*`** (integrasi LMS) yang belum di-commit dan **bukan saya yang menulisnya** — saya hanya menambahkan dua model di dekat `PddiktiSetting`. Karena `prisma db push` menerapkan **seluruh isi file schema**, bukan cuma bagian yang saya ubah, perintah itu otomatis ikut membuat 35 tabel `lms_*` di database lokal yang sebelumnya belum ada di sana.

- Ini **bukan tindakan destruktif** — `db push` tidak meminta `--accept-data-loss` dan tidak ada peringatan kehilangan data saat dijalankan, jadi perubahannya murni `CREATE TABLE` baru, tidak ada kolom yang dihapus atau tabel yang diubah tipenya.
- Tapi ini **efek samping yang tidak saya maksudkan dan tidak saya audit**: saya tidak tahu siapa yang menulis 35 model itu, apakah skemanya sudah final, atau apakah ada pekerjaan lain (migrasi, service, dll.) yang sedang berjalan paralel dan belum siap untuk tabelnya dibuat di database bersama ini.
- Saya **tidak mengubah atau menghapus** model-model LMS itu. Mereka tetap apa adanya di schema.prisma dan sekarang juga sudah tercermin di database lokal.

**Yang perlu kamu lakukan**: cek apakah memang ada pekerjaan LMS lain yang berjalan bersamaan di repo ini (sesi lain, orang lain, atau pekerjaan sebelumnya yang belum di-commit). Kalau itu memang disengaja, tidak ada yang perlu diperbaiki. Kalau itu tidak disengaja atau belum waktunya diterapkan ke database, beri tahu saya dan jangan commit `schema.prisma` dulu sampai jelas.

---

## 1. Yang dikerjakan (ringkasan)

| # | Area | Status |
|---|---|---|
| A | Retry & backoff di `callFeeder()` | Selesai, teruji |
| B | Sync History (`FeederSyncLog`) | Selesai (tabel + helper `runFeederSync`), teruji — **belum dipasang di 3 alur push lama** (lihat §3.3) |
| C | Idempotency/concurrency (`FeederSyncLock`) | Selesai untuk 3 alur push paling berisiko (mahasiswa, KRS, nilai), teruji nyata dengan `Promise.all` |
| D | Enkripsi kredensial at-rest | Selesai, teruji, **sudah diverifikasi jalan terhadap data nyata di database lokal** |
| E | Monitoring (stats, release-lock) | Selesai, teruji |
| F | Token expired / refresh | Sebagian — cache + refresh manual tersedia, **refresh otomatis di tengah satu alur panjang BELUM dipasang** (lihat §3.2, butuh keputusan arsitektur) |

Tidak ada endpoint Feeder baru yang ditambahkan (sesuai batasan). Tidak ada data mahasiswa/KRS/nilai yang dikirim ke Feeder produksi — semua pengujian memakai mock `fetch` atau database sementara (`seedtestfeeder`, sudah dihapus setelah selesai).

## 2. File yang diubah

| File | Perubahan |
|---|---|
| `packages/database/prisma/schema.prisma` | +2 model: `FeederSyncLog`, `FeederSyncLock`. +komentar di `PddiktiSetting.password/secretKey`. (Lihat peringatan di atas soal model `Lms*` yang ikut ter-push tapi bukan dari perubahan ini.) |
| `apps/api/src/modules/integration-settings/feeder-crypto.util.ts` | **Baru.** Enkripsi/dekripsi AES-256-GCM untuk kredensial Feeder. |
| `apps/api/src/modules/integration-settings/integration-settings.service.ts` | `callFeeder()` ditulis ulang (retry+backoff+jitter); `getFeederToken()`/`refreshFeederToken()` (cache token); helper baru `getActivePddiktiSetting()`, `claimFeederSync()`, `releaseFeederSync()`, `runFeederSync()`, `getFeederSyncStats()`, `releaseStaleFeederLocks()`; `updatePddiktiSetting()` mengenkripsi sebelum simpan; `getPddiktiSetting()` lewat jalur dekripsi; 26 titik `prisma.pddiktiSetting.findUnique(...)` lama diarahkan ke `getActivePddiktiSetting()`; `pushMahasiswaBaruToFeeder`/`pushKrsToFeeder`/`pushNilaiToFeeder` dipasangi klaim+log per-record. |
| `apps/api/src/modules/integration-settings/integration-settings.controller.ts` | +2 endpoint: `GET pddikti/sync-log/stats`, `POST pddikti/sync-log/release-stale-locks`. |

Tidak ada file di luar modul ini yang disentuh. Tidak ada endpoint/alur yang dihapus.

## 3. Detail per area

### 3.1 Retry & backoff (`callFeeder`)

- Retry **hanya** untuk kegagalan jaringan/timeout (koneksi putus, DNS gagal, abort timeout) dan HTTP 5xx dari server/proxy — kasus di mana kita tidak tahu apakah request sempat sampai ke Feeder.
- **Tidak pernah** retry otomatis kalau Feeder sudah membalas dengan `error_code` (apa pun nilainya) — itu bukan kegagalan jaringan, itu jawaban sah dari server, termasuk penolakan validasi payload. Ini persis permintaan "jangan retry kesalahan validasi".
- Default: `act` berawalan `Get` (dan `GetToken`) retryable otomatis, `act` lain (`Insert`/`Update`/`Delete`) **tidak** retry otomatis di level jaringan kecuali pemanggil secara eksplisit mengizinkan (`options.retryable`). Ini mengikuti instruksi "hindari retry Insert yang berpotensi duplikasi tanpa idempotency" — karena saat kode ini ditulis belum semua alur Insert dipasangi klaim (lihat §3.3), defaultnya dibuat aman (tidak retry) daripada berasumsi semua Insert sudah terlindungi.
- Backoff: exponential (300ms → 700ms → 1500ms...) + jitter ±30%, dibatasi 4 percobaan dan delay maksimum 5 detik per jeda.
- Signature `callFeeder()` tidak berubah untuk 3 parameter pertama — **48 titik pemanggilan lama tidak perlu diubah satu pun**; parameter ke-4 (`options`) baru, opsional.

### 3.2 Token expired/refresh — **sebagian, dengan keterbatasan yang perlu keputusan**

Yang sudah dikerjakan: token di-cache in-memory per (baseUrl+username) dengan TTL 5 menit (konservatif, karena dokumentasi resmi tidak menyatakan masa berlaku token — lihat `FEEDER_AUDIT_REPORT.md` §0/§6), dan `refreshFeederToken()` tersedia untuk memaksa login baru.

**Yang BELUM dikerjakan, dan ini saya laporkan dulu alih-alih menebak**: mendeteksi "token kedaluwarsa di tengah satu alur panjang" dan otomatis login ulang lalu **mengulang satu panggilan yang gagal itu** (bukan seluruh alur) butuh salah satu dari dua pendekatan, dan keduanya punya trade-off arsitektur:

1. **Ubah ke token mutable per-alur** (mis. objek `{ value: token }` dioper ke semua pemanggilan `callFeeder` dalam satu alur, bukan `const token` string). Ini **mengharuskan mengubah ke-26 fungsi pull/push/test-connection** yang masing-masing punya `const token = await this.getFeederToken(...)` lalu memakainya berkali-kali — risiko regresi tinggi untuk alur yang sudah berjalan dan belum bisa saya uji lagi ke Feeder sungguhan.
2. **Bungkus setiap `callFeeder` individual** dengan deteksi "pesan error menunjukkan token invalid" (`looksLikeExpiredFeederToken()` sudah saya tulis sebagai helper, tapi belum dipakai di mana pun) lalu auto-refresh+retry sekali — lebih aman tapi tetap butuh mengubah semua titik pemanggilan yang ingin dilindungi, atau membungkus `callFeeder` itu sendiri dengan akses ke `username`/`password` (yang sekarang tidak dibawa `callFeeder`, hanya `getFeederToken` yang tahu kredensial).

Saya tidak mengambil keputusan sendiri untuk memilih salah satu dan mengubah 26 titik itu, karena berisiko terhadap "jangan merusak sinkronisasi yang sudah berjalan" dan saya tidak punya server Feeder untuk memverifikasi hasilnya. **Ini rekomendasi saya**: kalau TTL cache 5 menit yang sudah ada dianggap cukup pendek (artinya kemungkinan token benar-benar kedaluwarsa di tengah satu alur yang berjalan lebih dari 5 menit kecil, karena token baru akan diambil di alur BERIKUTNYA), risiko residual ini bisa diterima untuk sekarang. Kalau tidak, perlu sesi kerja terpisah yang fokus merefactor 26 titik itu dengan hati-hati, idealnya dengan akses ke server Feeder test untuk verifikasi.

### 3.3 Idempotency & concurrency protection

**Mekanisme**: tabel `FeederSyncLock` dengan `@@unique([entity, localId, operation])`. Sebelum memanggil Feeder untuk satu record, kode mencoba `create` baris klaim; kalau sudah ada (gagal unique constraint), record itu **dilewati** (bukan ikut mengirim). Klaim dihapus setelah selesai (sukses/gagal). Klaim yang lebih tua dari 10 menit dianggap macet (proses API diduga mati di tengah) dan boleh diambil alih — supaya satu crash tidak mengunci record itu selamanya.

Diuji nyata dengan `Promise.all()` (tiga klaim **benar-benar bersamaan**, bukan berurutan) untuk record yang sama: tepat satu yang menang (`feeder_hardening_test.js` §5.6, §6.8).

**Dipasang di 3 alur dengan risiko tertinggi** (sesuai permintaan eksplisit di audit): `pushMahasiswaBaruToFeeder`, `pushKrsToFeeder`, `pushNilaiToFeeder`. Caranya **sengaja minimal-invasif**: klaim dicoba di awal tiap iterasi per-record, lalu badan loop yang sudah ada (termasuk semua `continue` di tengahnya) dibungkus `try { ... } finally { release }` **tanpa mengubah satu pun logika di dalamnya** — supaya tidak mengganggu alur yang sudah pernah terbukti berjalan (58.842 KRS dan 52.743 nilai sudah pernah tersinkron, per audit sebelumnya).

**Yang BELUM dikerjakan, dilaporkan dulu**: helper generik `runFeederSync()` (lebih lengkap — mencatat riwayat PROCESSING→SUCCESS/FAILED otomatis, dan punya semantik rekonsiliasi lewat `markSynced()`, lihat §3.4) **belum dipasang ke 3 alur push lama itu**. Saya memakai `claimFeederSync`/`releaseFeederSync` secara manual plus pencatatan `FeederSyncLog` manual di titik sukses/gagal yang sudah ada (`markFailed`, titik `created += 1`), bukan `runFeederSync()`. Alasannya: memasang `runFeederSync()` dengan benar butuh mengubah pola "banyak `continue`/`return` di tengah try-catch besar" menjadi pola "`fn` yang melempar (throw) untuk menandai gagal" — perubahan struktur kontrol yang lebih dalam dan berisiko regresi pada ~230 baris logika per alur yang belum bisa saya verifikasi ulang tanpa Feeder sungguhan. **Konsekuensinya**: kasus "Feeder sukses menerima data tapi penyimpanan `feederId` ke database lokal gagal setelahnya" (poin eksplisit di permintaan) **belum ditangani dengan rekonsiliasi otomatis di 3 alur ini** — kalau itu terjadi, baris `FeederSyncLog` untuk record itu kemungkinan tidak tertulis sama sekali (bukan salah ditandai FAILED, tapi juga bukan ditandai NEEDS_RECONCILIATION), karena pencatatan log manual itu ada SETELAH baris `prisma...update(...)` yang gagal. `runFeederSync()` sendiri **sudah menangani skenario ini dengan benar** (teruji di §6.5–6.7) dan siap dipakai begitu ada keputusan untuk merefactor ketiga alur itu memakainya.

### 3.4 Sync History (`FeederSyncLog`)

Skema sesuai permintaan: entity, localId lokal, operation (PULL/INSERT/UPDATE/DELETE), act Feeder, status (PENDING/PROCESSING/SUCCESS/FAILED), attempt, startedAt/finishedAt, requestSummary/responseSummary (ringkasan, bukan payload mentah), errorMessage, userId. **Tidak pernah** menyimpan password/token — field itu memang tidak ada di skema, dan tidak ada kode yang menulis nilai tersebut ke `requestSummary`/`responseSummary` (diverifikasi lewat uji §7.3: `JSON.stringify(stats)` dipastikan tidak mengandung kata `password`/`secretKey`/`token`).

Dua cara penulisan log ada di kode sekarang:
1. **`runFeederSync()`** — otomatis, lengkap (PROCESSING→SUCCESS/FAILED, rekonsiliasi). Belum dipakai di alur lama (lihat §3.3).
2. **Manual** (dipakai di 3 alur push yang sudah diubah) — ditulis langsung di titik sukses/gagal yang sudah ada di kode lama, tanpa status PROCESSING (karena tidak melalui `runFeederSync`).

### 3.5 Credential security

- Password & secretKey di `PddiktiSetting` sekarang **dienkripsi AES-256-GCM at-rest**, bukan teks biasa. Kunci diturunkan dari `JWT_SECRET` (sudah wajib ada di setiap deployment) lewat `scrypt` dengan salt tetap — **tidak perlu variabel environment baru**.
- **Migrasi otomatis tanpa downtime**: baris lama yang masih plaintext dikenali (tidak berprefiks `enc:v1:`) dan dienkripsi ulang otomatis saat pertama kali dibaca lewat `getActivePddiktiSetting()` — tidak ada skrip migrasi terpisah yang perlu dijalankan manual.
- **Sudah diverifikasi terhadap data nyata**: database lokal (bukan database uji) memang punya kredensial Feeder tersimpan plaintext sebelum perubahan ini. Setelah API berjalan dan endpoint `GET /integration-settings/pddikti` dipanggil dengan token Super Admin sungguhan, baris itu **otomatis berubah jadi terenkripsi** (`enc:v1:...`) di database, dan nilai yang dikembalikan API tetap benar (password asli, hanya ditampilkan sebagian: `••••n79@`, cocok dengan 4 karakter terakhir kredensial yang tersimpan). Saya tidak mengubah kredensial itu sendiri, hanya bentuk penyimpanannya.
- GET `/integration-settings/pddikti` **tidak pernah** mengembalikan password/secretKey asli — hanya masker (`••••` + 4 karakter terakhir) dan boolean `hasPassword`/`hasSecretKey`. Ini sudah berlaku sejak sebelum perubahan saya (pola `maskSecret` yang sama dipakai juga untuk kredensial payment gateway); yang baru adalah nilai yang di-mask sekarang didekripsi dulu dari ciphertext, bukan dipotong dari ciphertext mentah.
- Update kredensial (`PUT /integration-settings/pddikti`) tidak menimpa kredensial tersimpan kalau field dikirim kosong — perilaku ini sudah ada sebelumnya dan tidak saya ubah, hanya ditambah langkah enkripsi saat memang ada nilai baru dikirim.
- Tidak ditemukan baris log (`console.*`/`Logger.*`) yang mencetak password/token sebelum maupun sesudah perubahan ini.
- **Tidak saya kerjakan**: rotasi kunci enkripsi, atau memindahkan kunci ke secret manager eksternal (mis. Vault/KMS) — di luar lingkup "aman tanpa infrastruktur baru" yang diminta.

### 3.6 Monitoring & observability

- `GET /integration-settings/pddikti/sync-log/stats?entity=&sinceHours=` — ringkasan jumlah PENDING/PROCESSING/SUCCESS/FAILED, jumlah yang perlu rekonsiliasi manual, dan sampai 50 kegagalan terbaru (dengan pesan error). Akses: Super Admin, Admin BAAK, Staff (baca saja).
- `POST /integration-settings/pddikti/sync-log/release-stale-locks` — melepas klaim yang macet secara paksa (tanpa menunggu TTL 10 menit habis sendiri). Tidak mengirim apa pun ke Feeder. Akses: Super Admin saja.
- **"Retry manual"**: saya **tidak** menambah endpoint retry terpisah. Endpoint push yang sudah ada (`POST .../mahasiswa/push`, `.../krs/push`, `.../nilai/push`) **sudah bisa dipakai sebagai retry manual** — masing-masing menerima daftar ID spesifik (`studentIds`/`enrollmentIds`) dan secara alami hanya memproses record yang belum sukses (field `feederId`/`feederSyncedAt` masih kosong setelah gagal). Dengan hardening ini, memanggilnya ulang sekarang **aman dari duplikasi** berkat klaim di §3.3. Menambah endpoint retry terpisah akan jadi logika duplikat dari endpoint push yang sudah ada.

## 4. Hasil testing

Semua pengujian ada di skrip sementara (sudah dihapus dari disk setelah dijalankan, tidak masuk repo) yang memakai **database PostgreSQL sementara** (`seedtestfeeder`, dibuat dari template lalu dihapus — bukan database produksi maupun database dev biasa) dan **mock `global.fetch`** (tidak ada satu pun request yang keluar ke server Feeder mana pun). Total **41 assertion, 41 lulus, 0 gagal**:

| Bagian | Jumlah uji | Yang diverifikasi |
|---|---|---|
| 1. Kriptografi | 6 | Format `enc:v1:`, deteksi, dekripsi balik, IV acak (dua enkripsi nilai sama ≠ ciphertext sama), kompatibilitas mundur dengan plaintext |
| 2. Migrasi kredensial lama | 8 | Baca plaintext lama tetap benar, auto-reencrypt ke DB, baca kedua konsisten, GET API tidak pernah membocorkan password asli, update kredensial baru terenkripsi & bisa didekripsi balik, update tanpa password tidak menghapus yang lama |
| 3. Retry/backoff | 8 (5 skenario) | Retry jaringan utk `Get*` berhasil & dibatasi; `Insert*` TIDAK retry otomatis; `error_code≠0` TIDAK pernah retry; HTTP 5xx utk `Get*` diulang |
| 4. Token cache/refresh | 2 | Cache mencegah login berulang; `refreshFeederToken` memaksa login baru |
| 5. Klaim idempoten | 6 | Klaim unik per (entity,localId,operation); ditolak kalau sudah diklaim; boleh beda operation; lepas→klaim ulang; klaim basi (>10 menit) bisa diambil alih; **3 klaim BERSAMAAN (Promise.all) → tepat 1 menang** |
| 6. `runFeederSync` (riwayat+rekonsiliasi) | 8 | Sukses tercatat; gagal sebelum konfirmasi Feeder → FAILED; **gagal SETELAH Feeder konfirmasi → tetap SUCCESS + ditandai NEEDS_RECONCILIATION** (bukan FAILED, supaya tidak ada yang insert ulang dan menduplikasi data resmi); dua panggilan bersamaan utk record sama → satu di-skip |
| 7. Stats & release-lock | 5 | Hitungan status benar; deteksi perlu rekonsiliasi; **tidak ada password/secretKey/token di output stats**; pelepasan klaim basi paksa bekerja |

**Regresi**: API dibangun ulang (`nest build`) dan dijalankan terhadap database lokal sungguhan — sukses boot, `GET /health` → 200. `GET /integration-settings/pddikti` dipanggil dengan token Super Admin sungguhan terhadap database lokal (bukan database uji) yang memang punya kredensial Feeder tersimpan dari sebelumnya — berhasil, dan memicu migrasi enkripsi otomatis terhadap data itu (lihat §3.5) tanpa error. **Tidak ada satu pun data mahasiswa/KRS/nilai yang dikirim ke Feeder** dalam proses ini — server Feeder di `localhost:8100` yang dikonfigurasi di database lokal tidak bisa dijangkau dari lingkungan kerja saya (`isConnected: false`), jadi fungsi pull/push sungguhan sama sekali tidak dicoba terhadap data nyata.

### Test case dari §5 di permintaan — status

| # | Skenario | Status |
|---|---|---|
| 1 | Request Feeder berhasil | ✅ diuji (mock) |
| 2 | Feeder tidak merespons | ✅ diuji (mock `TypeError('fetch failed')`) |
| 3 | Timeout | ⚠️ Tidak diuji eksplisit secara terpisah dari "tidak merespons" — `AbortSignal.timeout` dan error timeout ditangani kode yang sama (`isRetryableFeederError` mengenali `AbortError`/`TimeoutError`), tapi saya tidak membuat skenario mock yang benar-benar menunggu timeout sungguhan (akan memperlambat test tanpa menambah jaminan di luar yang sudah diverifikasi lewat §3). **NOT FULLY TESTED.** |
| 4 | Token expired | ⚠️ `refreshFeederToken()` diuji (§4.2), tapi **deteksi otomatis di tengah alur yang sudah berjalan** belum diimplementasikan (lihat §3.2) — jadi tidak ada yang bisa diuji untuk bagian itu. **NOT TESTED** (belum ada kode untuk diuji). |
| 5 | Payload ditolak | ✅ diuji (§3.4, `error_code≠0` tidak diulang) |
| 6 | Feeder mengembalikan error | ✅ diuji (sama seperti #5) |
| 7 | Retry berhasil setelah kegagalan sementara | ✅ diuji (§3.1, §3.5) |
| 8 | Dua request sinkronisasi berjalan bersamaan | ✅ diuji nyata dengan `Promise.all` (§5.6, §6.8) |
| 9 | Feeder berhasil tapi penyimpanan lokal gagal | ✅ diuji untuk `runFeederSync` (§6.5–6.7) — **tapi lihat §3.3: belum berlaku untuk 3 alur push lama**, karena alur itu belum memakai `runFeederSync`. |
| 10 | Record dengan `feederId` dikirim ulang | ⚠️ **Tidak diuji langsung** di level data (tidak membuat skenario "student dengan feederId sudah terisi, lalu dipanggil push lagi") — tapi perilaku itu sudah ada sejak sebelum perubahan ini (query `eligible` di `pushMahasiswaBaruToFeeder` memfilter `feederRegistrationId: null`) dan tidak saya ubah. **NOT RE-TESTED**, mengandalkan perilaku lama yang tidak disentuh. |
| 11 | Retry manual untuk data gagal | ✅ Secara arsitektur (lihat §3.6), tapi **tidak ada uji end-to-end** yang memanggil endpoint push dua kali berturut-turut dengan Feeder sungguhan (butuh server Feeder). |
| 12 | Credential tidak muncul di log/response | ✅ diuji (§2.4, §7.3) untuk response; untuk log, diverifikasi lewat pembacaan kode (tidak ada statement yang mencetak field itu), bukan uji otomatis yang menangkap output log. |

## 5. Potensi risiko dan keterbatasan (jujur, bukan daftar centang)

1. **Model `Lms*` ikut ter-push ke database lokal** — lihat peringatan di awal laporan ini. Ini risiko terbesar dari sesi kerja ini, dan bukan dari perubahan Feeder itu sendiri.
2. **Token expired di tengah alur panjang belum tertangani otomatis** (§3.2) — kalau Feeder menolak token di tengah loop 50 mahasiswa, loop itu akan gagal untuk sisa record dan mencatatnya sebagai gagal biasa, bukan "coba ulang dengan token baru". Admin perlu menjalankan Push lagi secara manual (aman, berkat klaim §3.3, tapi tidak otomatis).
3. **3 alur push lama belum memakai `runFeederSync`**, jadi skenario "Feeder sukses, simpan lokal gagal" untuk mahasiswa/KRS/nilai **tidak** otomatis ditandai "perlu rekonsiliasi" — kalau itu terjadi, satu-satunya jejak adalah baris `feederSyncError`/`feederGradeSyncError` kosong tapi `feederId`/`feederSyncedAt` juga kosong (kelihatan seperti "belum pernah dicoba", bukan "mungkin sudah terkirim tapi gagal dicatat"). Ini **gap nyata**, saya laporkan bukan sembunyikan.
4. **Kurikulum, Mata Kuliah, Kelas Kuliah, Dosen Pengajar push** (4 alur lain yang sama-sama Insert ke Feeder) **belum** dipasangi klaim idempoten — eksplisit saya batasi ke 3 alur paling berisiko sesuai audit sebelumnya. Risiko duplikasi data dari concurrent push untuk keempat alur itu **masih ada seperti sebelum hardening ini**.
5. **Testing timeout sungguhan dan end-to-end terhadap server Feeder nyata tidak bisa dilakukan** dari lingkungan kerja saya (tidak ada server yang bisa dijangkau) — semua klaim "retry bekerja" dan "idempotency bekerja" dibuktikan lewat mock dan database sementara, bukan terhadap Feeder sungguhan. Perilaku `error_code` Feeder yang sesungguhnya (kode error apa yang sebenarnya dikembalikan untuk token kedaluwarsa, misalnya) masih berdasar asumsi pola umum (`/token/` + `/expired|invalid/`), belum diverifikasi ke dokumentasi resmi (yang juga tidak bisa saya akses, lihat `FEEDER_AUDIT_REPORT.md` §0).
6. **Kunci enkripsi diturunkan dari `JWT_SECRET`.** Kalau `JWT_SECRET` pernah dirotasi di masa depan tanpa prosedur khusus, kredensial Feeder yang sudah terenkripsi dengan kunci lama tidak akan bisa didekripsi lagi (akan error saat dibaca). Ini risiko operasional yang perlu diketahui tim ops: **jangan rotasi `JWT_SECRET` tanpa rencana dekripsi-ulang kredensial Feeder terlebih dahulu** (baca dengan kunci lama, simpan ulang dengan kunci baru).

## 6. Instruksi deployment & environment

- **Database**: jalankan `pnpm --filter @siakad/database db:generate` lalu migrasi skema (gunakan `prisma migrate` di server produksi sesuai catatan yang sudah ada di `deploy/README.md`, bukan `db push` langsung — `db push` yang saya pakai di sesi ini khusus untuk database lokal/dev). **PENTING**: sebelum migrasi ke server mana pun, pastikan dulu status model `Lms*` (lihat peringatan di awal) — migrasi akan ikut membuat 35 tabel itu juga.
- **Environment variable**: tidak ada variabel baru yang wajib diisi. `JWT_SECRET` yang sudah ada dipakai ulang untuk menurunkan kunci enkripsi kredensial Feeder — pastikan itu sudah diisi di setiap deployment (seharusnya sudah, karena dipakai modul auth).
- **Migrasi kredensial lama**: tidak perlu langkah manual. Begitu API berjalan dan `PddiktiSetting` pertama kali dibaca (lewat UI Pengaturan DIKTI atau sinkronisasi apa pun), kredensial plaintext lama otomatis terenkripsi. Kalau mau memverifikasi tanpa menunggu, cukup buka halaman Pengaturan DIKTI sekali di UI setelah deploy.
- **Tidak ada downtime khusus** yang dibutuhkan di luar siklus deploy normal (lihat `deploy/remote-deploy.sh` yang sudah ada — backup dulu, lalu `prisma db push`/`migrate`, lalu ganti container).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
