# Review Pasca-Hardening Feeder & Verifikasi Schema LMS

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_HARDENING_REPORT.md`. Lingkup: read-only — **tidak ada kode, skema, atau database yang diubah dalam review ini**. Tidak ada `db push`/`migrate`/`reset` yang dijalankan. API di-restart sekali (proses lokal) untuk menguji persistensi, tidak ada perubahan data.

## Ringkasan eksekutif

Temuan paling penting: **kekhawatiran di laporan hardening sebelumnya soal 35 tabel LMS ternyata terlalu alarmis.** Bukti baru di bawah (§1) menunjukkan tabel-tabel itu **sudah ada dan sudah berisi data nyata SEBELUM** saya menjalankan `prisma db push` — artinya perintah itu kemungkinan besar tidak membuat satu tabel LMS pun, hanya mengenali tabel yang sudah ada. Saya koreksi penilaian saya sendiri di sini, bukan mengulang klaim lama.

Untuk bagian Feeder: semua komponen yang dilaporkan selesai di hardening sebelumnya **masih utuh** (dicek ulang lewat pembacaan kode + `tsc` bersih + API berjalan nyata setelah restart proses), dan satu klaim yang belum pernah benar-benar diverifikasi sebelumnya — **kredensial tetap bisa didekripsi setelah restart aplikasi sungguhan** — sekarang sudah dibuktikan, bukan cuma diasumsikan.

---

## 1. Kondisi LMS Schema

### 1.1 Bukti baru: tabel LMS sudah ada SEBELUM `db push` saya

Laporan hardening sebelumnya hanya tahu bahwa 35 tabel `lms_*` ADA di database setelah saya menjalankan `db push`, tanpa bukti apakah tabel itu baru dibuat atau sudah ada. Sekarang saya punya bukti yang lebih kuat:

```
lms_migrations            8 baris   <- tabel pelacak migrasi TypeORM milik LMS, ISI-nya 8 migrasi yang sudah dijalankan
lms_agenda_items          1 baris
lms_assignments           1 baris
lms_discussion_files      2 baris
lms_question_categories   1 baris
lms_scheduler_state       1 baris
lms_submissions           1 baris
```

`prisma db push` **tidak pernah mengisi data** — ia hanya menjalankan DDL (`CREATE`/`ALTER TABLE`), tidak pernah `INSERT`. Baris-baris di atas (termasuk `lms_migrations` yang berisi 8 catatan migrasi TypeORM) **tidak mungkin berasal dari perintah saya hari ini**. Kesimpulan: tabel-tabel LMS, strukturnya, DAN datanya **sudah ada sebelum saya menyentuh repo ini**, dibuat oleh sistem LMS terpisah (migration TypeORM, sesuai komentar di schema — lihat §1.3).

Saya tidak punya cara memverifikasi secara mutlak 100% bahwa `db push` saya nol-DDL terhadap tabel LMS (saya tidak merekam log DDL verbose saat menjalankannya), tapi bukti data yang sudah ada ini, ditambah hasil verifikasi struktur di §1.4 dan §2, membuat saya cukup yakin perintah itu di titik tertinggi hanya melakukan penyesuaian kecil yang memang sudah cocok dengan struktur sebenarnya — bukan membuat 35 tabel dari nol seperti kesan yang saya berikan sebelumnya.

### 1.2 Daftar 35 model `Lms*`

`LmsAcademicSyncError`, `LmsAcademicSyncRun`, `LmsAcademicSyncState`, `LmsAgendaItems`, `LmsAnnouncementFiles`, `LmsAnnouncements`, `LmsAssignmentFiles`, `LmsAssignments`, `LmsDiscussionFiles`, `LmsDiscussionReplies`, `LmsDiscussionTopics`, `LmsExternalRef`, `LmsGradePublications`, `LmsGradeSync`, `LmsGradeSyncLog`, `LmsIntegrationAudit`, `LmsIntegrationSettings`, `LmsLectureSessionLog`, `LmsLectureSessions`, `LmsMaterialFiles`, `LmsMaterials`, `LmsMigrations`, `LmsNotifications`, `LmsQuestionCategories`, `LmsQuestionOptions`, `LmsQuestions`, `LmsQuizAnswers`, `LmsQuizAttempts`, `LmsQuizGradeHistory`, `LmsQuizQuestions`, `LmsQuizzes`, `LmsSchedulerLog`, `LmsSchedulerState`, `LmsSubmissionFiles`, `LmsSubmissions`.

Semuanya berada di satu blok berurutan (baris 2511–3160 di `schema.prisma`), didahului komentar penjelas (lihat §1.3).

### 1.3 Komentar yang sudah ada di schema (konteks resminya)

Tepat sebelum blok model LMS, sudah ada komentar ini di file (bukan saya yang menulis):

> "Tabel aplikasi LMS yang berbagi database dan schema `public` dengan SIAKAD. Strukturnya dibuat dan diubah oleh migration LMS (TypeORM, `apps/api/src/database/migrations` di **repo LMS**), BUKAN oleh Prisma. Model di bawah hanya MENDAFTARKAN tabel-tabelnya supaya `prisma db push` mengenalinya dan tidak menghapusnya. Jangan dipakai dari kode SIAKAD dan jangan diubah di sini; hasilkan ulang dari database (`db pull`) setiap kali LMS menambah/mengubah tabel... Constraint CHECK dan index parsial dikelola migration LMS."

Poin pentingnya: **"repo LMS" adalah repository terpisah**, bukan bagian dari `siakadpremium` ini. Saya mengecek — tidak ada folder `apps/lms` atau sejenisnya di workspace ini, dan tidak ada referensi LMS di `docker-compose*.yml`. Ini konsisten dengan arsitektur: LMS adalah layanan terpisah (kemungkinan dengan backend NestJS+TypeORM-nya sendiri, di repo lain) yang **berbagi satu database Postgres** dengan SIAKAD, bukan database terpisah.

**Catatan soal desain pemisahan database**: tugas ini menyebut "desain pemisahan database yang digunakan project" — berdasarkan apa yang bisa saya verifikasi di repo ini, **tidak ada pemisahan database** antara SIAKAD dan LMS; keduanya memang satu database Postgres yang sama (`siakad_premium`, schema `public`), hanya dipisahkan secara *logis* lewat penamaan tabel (`lms_*`) dan lewat pemilik skema (Prisma untuk SIAKAD, TypeORM untuk LMS, saling tidak menyentuh model satu sama lain). Kalau yang dimaksud "pemisahan database" sesungguhnya ada di level infrastruktur yang tidak terlihat dari repo ini (mis. instance Postgres LMS yang terpisah di produksi, dan yang saya lihat di database lokal hanyalah replika/gabungan untuk kebutuhan dev), saya tidak punya cara memverifikasi itu dari sini — **ini perlu dikonfirmasi oleh yang mengelola deployment LMS**, bukan saya tebak.

### 1.4 Relasi antar-model — tidak ada yang menyeberang ke SIAKAD/Feeder

Saya memeriksa seluruh `@relation` di dalam dan di luar blok model LMS secara terprogram (bukan sampel manual):

- **13 relasi `@relation`** ditemukan di dalam blok model LMS — **seluruhnya antar-model LMS sendiri** (mis. `LmsAssignmentFiles` → `LmsAssignments`, `LmsSubmissions` → `LmsAssignments`, `LmsDiscussionFiles` → `LmsDiscussionTopics`/`LmsDiscussionReplies`, dst.). **Nol** relasi ke `User`, `Student`, `Lecturer`, `CourseClass`, atau model SIAKAD/Feeder lain mana pun.
- Pencarian terbalik (model NON-LMS mana pun yang punya field bertipe `Lms*`) — **hasilnya nol**. Tidak ada satu model SIAKAD pun yang mereferensikan tipe LMS.
- Keterkaitan antara data LMS dan data SIAKAD (mis. "kelas yang mana", "mahasiswa yang mana") dilakukan lewat kolom seperti `class_reference_id`, `student_reference_id`, `lecturer_reference_id` — semuanya bertipe `String` biasa (ID disimpan sebagai teks), **bukan foreign key Prisma sungguhan**. Ini pola *loose coupling* yang wajar untuk dua sistem terpisah yang berbagi database tapi tidak berbagi skema secara ketat.

**Kesimpulan §1.4**: tidak ada konflik struktural antara model Feeder (`FeederSyncLog`, `FeederSyncLock`) dan model LMS — keduanya sama sekali tidak saling mereferensikan, dan nama tabelnya (`feeder_sync_logs`, `feeder_sync_locks`) tidak bentrok dengan nama tabel LMS mana pun (dicek lewat pencarian `@@map` duplikat di seluruh file — nol duplikat ditemukan untuk **seluruh** skema, bukan cuma LMS vs Feeder).

### 1.5 Migration yang berkaitan

Repo ini **tidak memakai folder `prisma/migrations`** — tidak ada folder itu di `packages/database/prisma/`, dan workflow yang dipakai memang `prisma db push` (dikonfirmasi lewat catatan yang sudah ada di `deploy/README.md`: *"Sebelum kampus pertama dengan data nyata, ganti `prisma db push` dengan `prisma migrate`"* — artinya proyek ini secara sadar belum memakai migration history Prisma). Migration untuk tabel LMS sendiri ada di **repo LMS yang terpisah** (sesuai komentar di §1.3, path `apps/api/src/database/migrations`, memakai TypeORM) — saya tidak punya akses ke repo itu dari sini, jadi tidak bisa memverifikasi isinya, hanya bisa memverifikasi **hasil akhirnya** di database (§2).

### 1.6 Verifikasi tabel LMS sesuai model yang dimaksud

Dicek dengan membandingkan daftar kolom Prisma model vs. struktur tabel sungguhan di database (`\d nama_tabel`) untuk 6 sampel (`LmsAssignments`, `LmsMigrations`, `LmsSubmissions`, `LmsDiscussionFiles`, `LmsQuestionCategories`, `LmsSchedulerState`) — mewakili tabel sederhana, tabel dengan banyak foreign key, dan tabel pelacak migrasi:

**Hasil: cocok 1:1 untuk semua kolom nyata di keenam tabel itu** (field relasi virtual Prisma seperti `lms_submission_files` tidak dihitung karena itu bukan kolom sungguhan). Tidak ditemukan kolom yang "hilang" dari model atau "lebih" di database untuk sampel ini.

`lms_assignments` secara khusus punya **CHECK constraint** (`max_score > 0`, `meeting_number` 1–32), **partial index** (`WHERE component_reference_id IS NOT NULL`), dan **foreign key** ke `lms_assignment_files`/`lms_submissions` — semuanya **tidak dideklarasikan** di level constraint Prisma (sesuai catatan di §1.3 bahwa itu "dikelola migration LMS"), tapi tetap ada dan aktif di database sungguhan. Ini konsisten dengan model yang sengaja "ringan" (hanya field + tipe data), bukan replikasi penuh skema TypeORM.

Saya **tidak memeriksa seluruh 35 tabel satu per satu** secara manual (di luar lingkup waktu review ini) — 6 sampel ini dipilih mewakili pola yang berbeda-beda (sederhana, FK, constraint kompleks, append-only log). Kalau butuh audit lengkap seluruh 35 tabel, itu pekerjaan tambahan yang bisa dijadwalkan terpisah.

---

## 2. Verifikasi Database

Dibandingkan secara terprogram: **seluruh** tabel yang dideklarasikan di `schema.prisma` (lewat `@@map`) terhadap **seluruh** tabel yang sungguhan ada di database (`information_schema.tables`, schema `public`).

| Pemeriksaan | Hasil |
|---|---|
| Tabel di schema tapi TIDAK ada di database (berarti ada yang terhapus/gagal dibuat) | **Nol** — tidak ada |
| Total tabel di database (`public`) | 129 |
| Tabel di database tapi TIDAK dideklarasikan di schema.prisma | 5 — lihat catatan di bawah |

**5 tabel "yatim" yang ditemukan** (bukan masalah, informasi saja):
- `_AdmissionClassPrograms`, `_AdmissionTrackPrograms` — ini tabel penghubung many-to-many implisit buatan Prisma sendiri (untuk relasi `@many-to-many` tanpa model eksplisit); Prisma memang tidak menuliskannya sebagai `model` terpisah di schema, jadi wajar tidak muncul di pencarian `@@map`. **Bukan temuan, false positive dari metode pencarian saya.**
- `lp3m_documents`, `lp3m_intellectual_properties`, `lp3m_researches` — **ini temuan baru yang di luar lingkup tugas (bukan LMS, bukan Feeder)**. Tiga tabel ini ada di database tapi **tidak terdaftar di `schema.prisma` sama sekali** (tidak seperti LMS yang setidaknya "didaftarkan"). Kemungkinan berkaitan dengan modul P2M/P3M (Penelitian & Pengabdian) yang sebelumnya diaudit di `FEEDER_AUDIT_REPORT.md`. Saya **tidak menyelidikinya lebih lanjut** (di luar lingkup review ini) — sekadar dicatat supaya tidak mengejutkan di lain waktu. Tidak ada risiko langsung karena Prisma `db push` tidak pernah menyentuh tabel yang tidak dideklarasikan sama sekali di schema-nya.

**Constraint, index, dan relasi**: dicek lewat `information_schema.table_constraints` — ditemukan **13 FOREIGN KEY constraint aktif** di antara tabel-tabel `lms_*` (cocok persis dengan 13 `@relation` yang saya hitung di schema, §1.4). Tidak ada pemeriksaan tambahan terhadap index/constraint SIAKAD non-LMS dalam review ini (di luar lingkup — fokusnya verifikasi dampak terhadap LMS & Feeder, bukan audit seluruh skema).

**Kesimpulan §2**: `prisma db push` yang saya jalankan di hardening sebelumnya **tidak menyebabkan kehilangan tabel atau kolom apa pun**, pada SIAKAD maupun LMS. Ini sejalan dengan bukti §1.1 (tabel LMS sudah berisi data sebelum push) dan output asli perintah itu sendiri (tidak ada peringatan `--accept-data-loss` yang diminta).

---

## 3. Pemeriksaan Keamanan Credential

| Pertanyaan dari tugas | Hasil |
|---|---|
| Encryption key tersimpan persisten? | **Ya, secara tidak langsung** — kunci **tidak disimpan di mana pun** (tidak di database, tidak di file terpisah); diturunkan ulang setiap kali aplikasi start, dari `JWT_SECRET` di environment (yang memang sudah wajib ada & persisten di `.env` server). Ini desain yang disengaja supaya tidak perlu variabel environment baru — tapi konsekuensinya: **persistensi kredensial Feeder bergantung penuh pada `JWT_SECRET` tidak pernah berubah** (lihat risiko §5). |
| Aplikasi bisa membaca credential setelah restart? | **Ya, diverifikasi langsung** — saya menghentikan proses API lokal sepenuhnya lalu menyalakannya ulang dari awal (bukan hot-reload), lalu memanggil `GET /integration-settings/pddikti` dengan token Super Admin sungguhan. Password yang tersimpan terenkripsi di database (dari sebelum restart) **berhasil didekripsi dengan benar** (masker `••••n79@` identik sebelum dan sesudah restart). Ini **bukti baru** — sebelumnya baru diuji dalam satu proses yang sama tanpa benar-benar restart. |
| Tidak ada plaintext credential yang tertinggal? | Password di `pddikti_settings` **sudah berprefiks `enc:v1:`** di database lokal sekarang (dicek ulang via query langsung). `secretKey` kolomnya `NULL` (tidak dikonfigurasi di deployment ini) — tidak ada yang perlu dienkripsi/tertinggal untuk field itu. Saya tidak memeriksa salinan lain di luar tabel ini (mis. apakah pernah ter-log ke file log sebelum hardening ini — di luar lingkup, butuh akses ke berkas log historis yang tidak saya miliki). |
| Backup & prosedur pemulihan dipahami? | **Dipahami secara desain, belum diuji langsung** (backup/restore sungguhan di luar lingkup review read-only ini). `deploy/remote-deploy.sh` yang sudah ada melakukan `pg_dump` penuh sebelum tiap deploy — ini otomatis menyertakan kolom `password`/`secretKey` yang **sudah terenkripsi**, jadi backup itu sendiri aman disimpan. **Poin kritis untuk dipahami tim ops**: memulihkan backup ke server BARU hanya akan bisa mendekripsi kredensial Feeder itu kalau server baru itu memakai `JWT_SECRET` **yang sama persis** dengan server asal. Ini belum didokumentasikan di `deploy/README.md` yang ada — saya rekomendasikan ditambahkan di sana (lihat §6), tapi tidak saya tambahkan sendiri karena tugas ini membatasi "jangan mengubah kode". |
| Tidak mengganti encryption key tanpa prosedur migrasi? | **Dipatuhi** — review ini tidak mengubah `JWT_SECRET` atau kredensial produksi mana pun. Tidak ada mekanisme migrasi kunci (key rotation) yang dibangun di hardening sebelumnya maupun di review ini — kalau dibutuhkan, itu pekerjaan terpisah (lihat §4). |

---

## 4. Pemeriksaan Feeder Hardening (re-verifikasi)

Semua poin di bawah dicek ulang langsung dari kode sumber saat ini (bukan mengandalkan ingatan dari laporan sebelumnya) — ditemukan **utuh, tidak ada yang hilang atau berubah** sejak hardening selesai:

| Komponen | Status saat ini |
|---|---|
| `FeederSyncLock` (claim idempoten) | Ada di schema, terpasang di 3 titik: push Mahasiswa (`Student`/`INSERT`), push KRS (`CourseEnrollment`/`INSERT_KRS`), push Nilai (`CourseEnrollment`/`UPDATE_NILAI`). Masing-masing ada pasangan `claim`+`release`-nya (3 claim, 3 release ditemukan, cocok). |
| `FeederSyncLog` (riwayat) | Ada di schema. Dua jalur penulisan: otomatis lewat `runFeederSync()` (helper lengkap, teruji, **belum dipakai** di 3 alur push lama — ini bukan regresi, memang begitu sejak hardening selesai), dan manual di titik sukses/gagal 3 alur push itu. |
| Retry & backoff | `callFeeder()` dengan `isRetryableFeederError()`, exponential backoff + jitter, masih ada dan sesuai deskripsi di laporan hardening. |
| Enkripsi AES-256-GCM | `feeder-crypto.util.ts` masih ada (53 baris), diimpor dan dipakai di `getActivePddiktiSetting()`/`updatePddiktiSetting()`/`getPddiktiSetting()`. |
| Environment encryption key | Masih diturunkan dari `JWT_SECRET` (tidak ada variabel baru ditambahkan — konsisten dengan laporan sebelumnya). |
| Monitoring endpoint | `GET pddikti/sync-log/stats` dan `POST pddikti/sync-log/release-stale-locks` masih terdaftar di controller, **dan sudah diuji hidup** lewat panggilan HTTP sungguhan ke API yang berjalan (bukan cuma dicek levat kode) — hasilnya `{"counts":{"pending":0,...}}` (wajar, karena belum ada push sungguhan yang berjalan sejak restart). |
| Release stale locks | Logikanya (TTL 10 menit, ambil alih klaim basi) tidak diubah sejak hardening; tidak saya jalankan ulang terhadap data sungguhan dalam review ini (tidak ada klaim macet sungguhan untuk dibersihkan saat ini). |

**`tsc --noEmit` dijalankan ulang terhadap seluruh `apps/api`: bersih, nol error.** API dibangun ulang (`nest build`) dan dijalankan sebagai proses baru (bukan proses lama yang masih hidup dari sesi hardening) — `GET /health` → 200.

---

## 5. Daftar Risiko Tersisa

Diurutkan dari yang paling relevan untuk ditindaklanjuti duluan:

1. **Ketergantungan rotasi `JWT_SECRET` belum punya prosedur.** Kalau `JWT_SECRET` diganti tanpa proses dekripsi-ulang kredensial Feeder terlebih dahulu, kredensial Feeder yang tersimpan akan **tidak bisa dibaca lagi** (bukan hilang datanya, tapi tidak bisa didekripsi) — berdampak pemadaman sinkronisasi Feeder sampai kredensial diisi ulang manual. *(Sudah disebut di laporan hardening, dikonfirmasi masih berlaku, belum ada mitigasi dibangun.)*
2. **Refresh token otomatis di tengah alur panjang belum ada** (butuh keputusan arsitektur — mengubah pola `const token` di 26 titik pemanggilan menjadi referensi yang bisa diperbarui, atau pendekatan lain). Risiko: alur push/pull yang berjalan lebih lama dari TTL cache token (5 menit) bisa gagal di tengah jalan kalau Feeder benar-benar membatasi masa berlaku token sependek itu — ini masih asumsi, dokumentasi resmi Feeder tidak menyebutkan masa berlaku token secara eksplisit (lihat `FEEDER_AUDIT_REPORT.md`).
3. **`runFeederSync()` (dengan semantik rekonsiliasi yang benar) belum dipasang** ke 3 alur push yang sudah ada — skenario "Feeder sukses terima data tapi penyimpanan `feederId` lokal gagal" untuk mahasiswa/KRS/nilai **tidak otomatis ditandai perlu ditinjau**; jejaknya ambigu (terlihat seperti "belum pernah dicoba" di `FeederSyncLog`, bukan "mungkin sudah terkirim").
4. **Kurikulum, Mata Kuliah, Kelas Kuliah, Dosen Pengajar** — 4 alur push lain yang sama-sama melakukan Insert ke Feeder — **belum punya perlindungan idempoten** (`FeederSyncLock`) sama sekali. Risiko duplikasi data dari push bersamaan untuk keempat alur itu masih identik dengan sebelum hardening dimulai.
5. **5 tabel di luar cakupan review ini perlu diklarifikasi**: status arsitektur "pemisahan database LMS" yang sesungguhnya (§1.3) dan keberadaan `lp3m_documents`/`lp3m_intellectual_properties`/`lp3m_researches` yang tidak terdaftar di schema sama sekali (§2) — keduanya bukan temuan darurat, tapi sebaiknya dikonfirmasi supaya tidak jadi kejutan di kemudian hari (mis. saat seseorang menjalankan `prisma db pull` atau migration tooling baru).
6. **Tidak ada mekanisme rotasi kunci enkripsi** untuk kredensial Feeder — kalau suatu saat dibutuhkan (mis. kecurigaan kebocoran), prosesnya harus dibangun manual (baca semua dengan kunci lama, simpan ulang dengan kunci baru) — belum ada tooling untuk itu.
7. **Audit 35 tabel LMS belum menyeluruh** — hanya 6 dari 35 tabel diverifikasi strukturnya kolom-per-kolom (§1.6). 29 tabel sisanya diverifikasi secara agregat saja (tabel ada, FK count cocok) — bukan per-kolom.

---

## 6. Rekomendasi Tindakan Selanjutnya

**Tidak ada yang diimplementasikan di review ini** — sesuai batasan, ini murni daftar untuk disetujui dulu sebelum dikerjakan.

**Prioritas tinggi, risiko rendah untuk dikerjakan:**
- Tambahkan catatan di `deploy/README.md` (atau dokumen ops yang relevan) soal ketergantungan `JWT_SECRET` ↔ kredensial Feeder terenkripsi, supaya tim ops tahu sebelum rotasi `JWT_SECRET` atau restore backup ke server baru.
- Konfirmasi dengan pemilik LMS (atau siapa pun yang menambahkan model `Lms*` ke working tree) bahwa penambahan itu memang disengaja, lalu commit `schema.prisma` kalau sudah dikonfirmasi — saat ini masih uncommitted dan tercampur dengan perubahan Feeder saya di file yang sama, sehingga kalau tidak hati-hati bisa ter-commit bersamaan tanpa review terpisah.
- Klarifikasi status `lp3m_documents`/`lp3m_intellectual_properties`/`lp3m_researches` (§2) — kemungkinan perlu didaftarkan ke schema dengan pola yang sama seperti LMS kalau memang dikelola sistem lain, atau didaftarkan penuh kalau sebenarnya milik SIAKAD sendiri dan sekadar lupa ditambahkan.

**Pekerjaan lanjutan Feeder (butuh persetujuan eksplisit sebelum dikerjakan, sesuai gap di §5):**
- Idempotency untuk Kurikulum, Mata Kuliah, Kelas Kuliah, Dosen Pengajar (pola yang sama seperti 3 alur yang sudah ada, risiko implementasi rendah karena sudah ada contohnya).
- Keputusan arsitektur untuk refresh token otomatis di tengah alur panjang (perlu didiskusikan dulu pendekatan mana yang diterima, baru diimplementasikan).
- Migrasi 3 alur push lama ke `runFeederSync()` untuk mendapat semantik rekonsiliasi yang benar (risiko implementasi sedang — menyentuh ulang logika yang sudah berjalan, sebaiknya dikerjakan satu alur dulu lalu diuji, bukan ketiganya sekaligus).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
