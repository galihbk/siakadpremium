# Review Final: Keamanan Credential, Audit LP3M, Arsitektur LMS, dan Pemisahan Git

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_AUDIT_REPORT.md`, `FEEDER_HARDENING_REPORT.md`, `FEEDER_POST_HARDENING_REVIEW.md`.
Lingkup: audit, dokumentasi, dan pelaporan. **Satu file dokumentasi ditambahkan** (`deploy/README.md`, lihat §2) —
selain itu murni read-only. **Tidak ada `db push`, migration, atau commit yang dijalankan.**

## Koreksi penting di awal: temuan "tabel yatim" di laporan sebelumnya salah, karena bug saya sendiri

`FEEDER_POST_HARDENING_REVIEW.md` §2 melaporkan `lp3m_documents`, `lp3m_intellectual_properties`, dan
`lp3m_researches` sebagai "tabel di database tapi tidak terdaftar di schema.prisma". **Itu salah.** Penyebabnya:
skrip pencarian saya memakai pola regex `@@map\("[a-zA-Z_]+"\)` yang **tidak menyertakan angka** di kelas
karakternya — sementara nama tabelnya mengandung angka (`lp3m`, ada "3"-nya), sehingga regex itu gagal
mencocokkan baris `@@map("lp3m_researches")` yang sebenarnya ADA di schema, padahal secara visual terlihat jelas
kalau dicari manual. Saya temukan dan buktikan kesalahan ini sendiri di awal review kali ini (lihat §3.1) sebelum
melanjutkan ke bagian lain. Permintaan maaf atas simpangan itu — detail pembuktiannya ada di §3.

---

## 1. Status Keamanan Credential

| Pertanyaan dari tugas | Status |
|---|---|
| AES-256-GCM credential encryption | **Tidak diubah** di review ini (sesuai batasan "jangan mengubah mekanisme enkripsi yang sedang berjalan"). Dicek ulang: `feeder-crypto.util.ts` masih ada, masih dipakai di `getActivePddiktiSetting()`/`updatePddiktiSetting()`/`getPddiktiSetting()` — tidak berubah sejak `FEEDER_POST_HARDENING_REVIEW.md`. |
| Ketergantungan encryption key terhadap `JWT_SECRET` | Dikonfirmasi ulang, tidak berubah. |
| Dokumentasi risiko & prosedur | **Ditambahkan** di `deploy/README.md` — lihat §2. |

Tidak ada pengujian ulang terhadap kredensial produksi atau database lokal dalam review ini (sudah dilakukan dan
dilaporkan di `FEEDER_POST_HARDENING_REVIEW.md` §3; tidak perlu diulang karena mekanismenya tidak diubah).

---

## 2. Dokumentasi Deployment yang Ditambahkan

File: **`deploy/README.md`** — bagian baru **"Kredensial Web Service Neo Feeder PDDIKTI (enkripsi at-rest)"**
ditambahkan di akhir file, setelah bagian "Catatan penting" yang sudah ada. Isinya:

- Penjelasan singkat bahwa password/secretKey Feeder terenkripsi AES-256-GCM, dengan rujukan ke file kode dan
  kedua laporan sebelumnya.
- **Ketergantungan kunci ke `JWT_SECRET`**, dan konsekuensinya (kredensial hanya bisa didekripsi oleh server
  dengan `JWT_SECRET` yang sama).
- **Larangan tegas** mengganti `JWT_SECRET` tanpa prosedur migrasi, beserta dua pilihan prosedur: (a) skrip
  dekripsi-dengan-kunci-lama lalu simpan-ulang-dengan-kunci-baru dalam satu sesi deploy (belum ada skrip siap
  pakai, perlu ditulis & diuji di staging dulu), atau (b) terima sinkronisasi Feeder berhenti dan admin mengisi
  ulang kredensial manual setelah rotasi.
- **Syarat restore backup ke server baru**: backup (`pg_dump`) aman disimpan karena kredensialnya sudah
  terenkripsi, tapi hanya bisa didekripsi di server dengan `JWT_SECRET` yang sama dengan server asal.
- **Migrasi otomatis kredensial lama** (plaintext → terenkripsi) terjadi sendiri saat pertama kali dibaca — tidak
  perlu langkah manual untuk kasus itu (beda dengan kasus rotasi `JWT_SECRET`).
- **Rekomendasi rotasi**: tidak ada jadwal otomatis; kalau organisasi punya kebijakan rotasi secret, `JWT_SECRET`
  harus ikut prosedur migrasi kredensial Feeder di atas, karena juga dipakai modul auth (sesi login).
- **Prosedur pemulihan** kalau kredensial sudah terlanjur tidak bisa didekripsi: isi ulang manual lewat UI
  Pengaturan DIKTI — tidak ada cara memulihkan nilai lama tanpa kunci yang dipakai mengenkripsinya.

**Mekanisme enkripsi itu sendiri tidak disentuh** — perubahan ini murni penambahan teks di file Markdown.

---

## 3. Hasil Audit Tabel LP3M

### 3.1 Pembuktian kesalahan laporan sebelumnya

```
$ grep -oE '@@map\("[a-zA-Z_]+"\)' schema.prisma   # pola LAMA (salah)
# "lp3m_researches" TIDAK tertangkap, karena '3' bukan bagian dari [a-zA-Z_]

$ grep -oE '@@map\("[a-zA-Z0-9_]+"\)' schema.prisma   # pola BARU (benar, menyertakan angka)
# "lp3m_researches", "lp3m_documents", "lp3m_intellectual_properties" SEMUA tertangkap
```

Dengan pola yang diperbaiki, perbandingan penuh **seluruh tabel database vs seluruh `@@map` di schema** hanya
menyisakan `_AdmissionClassPrograms` dan `_AdmissionTrackPrograms` sebagai "tidak terdaftar" — dan itu memang
wajar: keduanya tabel penghubung many-to-many implisit yang dibuat otomatis oleh Prisma dari relasi `@many-to-many`
tanpa model eksplisit, sehingga tidak muncul sebagai baris `@@map` tersendiri. **Bukan temuan, bukan masalah.**

### 3.2 Kepemilikan: 100% internal SIAKAD, bukan sistem eksternal

Ketiga tabel **terdaftar penuh** di `packages/database/prisma/schema.prisma` (baris 1467–1545) sebagai model
Prisma bernama **`Lp3mResearch`**, **`Lp3mIntellectualProperty`**, **`Lp3mDocument`** — di bawah komentar bagian
`// LP3M (LEMBAGA PENELITIAN & PENGABDIAN KEPADA MASYARAKAT) MODELS`. Ketiganya **sudah ada di commit `HEAD`**
(dikonfirmasi lewat `git show HEAD:...schema.prisma`), jauh mendahului pekerjaan Feeder hari ini maupun
penambahan model LMS yang masih belum di-commit — jadi ini **bukan bagian dari perubahan siapa pun baru-baru
ini**, murni modul yang sudah mapan.

**Dipakai aktif** oleh `apps/api/src/modules/lp3m/lp3m.service.ts` (571 baris) lewat Prisma Client standar
(`this.prisma.lp3mResearch.findMany(...)`, `.create(...)`, `.update(...)`, `.delete(...)`, dst. — ditemukan di
puluhan titik), bukan raw SQL. Modul ini adalah backend untuk situs publik LP3M/P3M (`apps/p3m`) yang sebelumnya
dikerjakan dalam sesi ini — struktur kolomnya (`type`, `scheme`, `focusArea`, `leader`, `regNumber`, `inventor`,
`fileType`, `downloadsCount`, dst.) **cocok persis** dengan interface `PublicResearch`/`PublicHaki`/
`PublicDocument` di `apps/p3m/src/lib/data.ts`.

**Kesimpulan: dikelola sepenuhnya oleh SIAKAD sendiri, bukan LMS, bukan sistem eksternal.** Tidak perlu
didaftarkan ulang (sudah terdaftar) dan tidak perlu dipertimbangkan sebagai milik sistem lain.

### 3.3 Struktur kolom, PK/FK, index, constraint

| Tabel | Primary Key | Unique | Foreign Key | Index lain |
|---|---|---|---|---|
| `lp3m_researches` | `id` (text, uuid dari aplikasi) | `code` | **Tidak ada** | `lecturerId` (btree) |
| `lp3m_intellectual_properties` | `id` | `regNumber` | **Tidak ada** | — |
| `lp3m_documents` | `id` | `code` | **Tidak ada** | — |

Kolom di database **cocok 1:1** dengan field di model Prisma masing-masing (dicek lewat `\d` langsung terhadap
ketiga tabel). Field `lecturerId` di `lp3m_researches` bertipe teks biasa, **bukan foreign key Prisma** ke model
`Lecturer` — pola *loose reference* yang sama seperti dipakai LMS (lihat §4), tapi ini pilihan desain SIAKAD
sendiri untuk modul ini, bukan tanda keterkaitan dengan LMS.

### 3.4 Relasi dengan modul SIAKAD lain

**Tidak ada relasi Prisma (`@relation`)** dari ketiga model ini ke model lain mana pun, dan tidak ada model lain
yang mereferensikan tipe `Lp3m*`. Keterkaitannya ke data dosen (`lecturerId`) murni lewat ID teks, divalidasi di
level aplikasi (kode `lp3m.service.ts`), bukan di level database.

### 3.5 Rekomendasi

**Tidak perlu tindakan.** Ketiga tabel sudah terdaftar dengan benar di Prisma, dikelola murni oleh SIAKAD lewat
modul `lp3m` yang sudah mapan, dan tidak ada tumpang tindih dengan LMS maupun Feeder. Temuan "orphan" di laporan
sebelumnya ditutup sebagai **tidak valid** (kesalahan metode pencarian saya sendiri, bukan masalah di sistem).

---

## 4. Konfirmasi Arsitektur Database LMS

Peringatan dari tugas ini saya patuhi: **saya tidak menyimpulkan arsitektur produksi dari database lokal semata.**
Bagian-bagian di bawah yang berasal dari observasi database lokal ditandai jelas sebagai demikian, dan tidak
diperlakukan sebagai representasi produksi.

### 4.1 Yang BISA dipastikan dari repo ini (bukti langsung, bukan tebakan)

- **Tidak ada satu pun referensi LMS** di `docker-compose.yml`, `docker-compose.prod.yml`,
  `docker-compose.local-proxy.yml`, `deploy/*.sh`, `deploy/*.md`, `deploy/customers*.json`, atau
  `apps/api/src/app.module.ts` — dicek lewat pencarian kata kunci "lms" (tanpa membedakan besar/kecil huruf) di
  seluruh file konfigurasi deployment yang ada di repo ini.
- `.env.prod.example` (template environment produksi yang ada di repo) **hanya mendeklarasikan satu
  `DATABASE_URL`** — tidak ada `LMS_DATABASE_URL` atau variabel sejenis.
- Tidak ada folder `apps/lms` atau sejenisnya di workspace ini — konfirmasi bahwa LMS memang berada di **repository
  terpisah** yang tidak ter-checkout di sini, persis seperti yang disebut komentar di schema (`"repo LMS"`).
- Komentar yang sudah ada di `schema.prisma` (ditulis sebelum review ini, bukan oleh saya) secara eksplisit
  menyatakan: tabel LMS "berbagi database dan schema `public` dengan SIAKAD", dan strukturnya "dibuat dan diubah
  oleh migration LMS (TypeORM, `apps/api/src/database/migrations` **di repo LMS**)".
- Model `LmsIntegrationSettings` di schema (field `base_url`, `auth_type` default `'API_KEY'`, `token_url`,
  `client_id`, `credential_enc`) menunjukkan **LMS sendiri punya pengaturan koneksi ke sistem eksternal** (dengan
  kredensialnya sendiri yang juga terenkripsi, kolom `credential_enc`) — kemungkinan ini konfigurasi LMS untuk
  memanggil API SIAKAD (atau API lain), tapi **ini saya tidak bisa pastikan arahnya tanpa membaca kode LMS**.

### 4.2 Yang HANYA teramati di database lokal (ditandai eksplisit, TIDAK digeneralisasi ke produksi)

- Database lokal (`siakad_premium` di `localhost:5434`) memang berisi tabel `lms_*` dengan data nyata (8 baris
  migrasi TypeORM, beberapa baris data fungsional) — **ini fakta tentang database lokal pengembangan saya**, bukan
  bukti tentang topologi produksi.
- Saya **tidak tahu** apakah di produksi: (a) SIAKAD dan LMS memakai **instance Postgres yang sama** seperti di
  lokal, (b) memakai **server Postgres fisik yang sama tapi database logis berbeda**, atau (c) **server terpisah
  sepenuhnya** dengan mekanisme sinkronisasi lain yang membuat database lokal gabungan ini hanya kebetulan/untuk
  kemudahan development. Ketiganya sama-sama konsisten dengan apa yang saya lihat, dan repo ini tidak memberi
  bukti yang membedakan ketiganya untuk lingkungan produksi.

### 4.3 Mekanisme sinkronisasi identitas mahasiswa/dosen/kelas — **NEEDS CONFIRMATION**

Dari struktur model LMS saya bisa menyusun **dugaan yang didukung bukti struktural**, tapi **bukan kepastian**
(kode LMS sendiri tidak bisa saya baca dari repo ini):

- `LmsExternalRef` (kunci `entity` + `local_id`, kolom `external_id`, `source_system`, `content_hash`,
  `last_seen_at`, `inactive_at`) berpola seperti **tabel cache pemetaan identitas** untuk sinkronisasi inkremental
  (`content_hash` dipakai mendeteksi perubahan tanpa membandingkan seluruh field).
- `LmsAcademicSyncRun`/`LmsAcademicSyncState`/`LmsAcademicSyncError` berpola **job tracker** untuk proses sinkron
  terjadwal (field `kind`, `trigger`, `status`, `cursor`, `stats` di `LmsAcademicSyncState`).
- Pola ini **konsisten dengan dua kemungkinan arsitektur yang sama validnya** dari sisi bukti yang saya punya:
  1. **LMS membaca langsung tabel SIAKAD** (`User`/`Student`/`Lecturer`/`CourseClass`, dst.) lewat akses database
     bersama (query TypeORM langsung ke `public` schema) — mirip pola yang sudah ada di proyek ini untuk integrasi
     OBE (lihat `docs/integrasi-obe.md`: view baca-saja `obe_api.*` + akun database `obe_reader` berhak baca
     terbatas, tanpa HTTP). **Ini preseden yang sudah terbukti dipakai proyek ini untuk kasus serupa**, tapi tidak
     ada bukti langsung bahwa LMS memakai pola yang sama (tidak ada skema `lms_api` atau akun pembaca setara
     `obe_reader` yang saya temukan di database lokal).
  2. **LMS memanggil REST API SIAKAD** untuk menarik data identitas, dan `LmsIntegrationSettings` (`base_url`,
     `token_url`, `client_id`, `auth_type`) adalah konfigurasi panggilan itu — lalu `LmsExternalRef` dipakai
     sebagai cache lokal hasil tarikan, bukan akses langsung ke tabel.
- `LmsGradeSync`/`LmsGradeSyncLog`/`LmsGradePublications` tampak sebagai **arah sebaliknya**: LMS mencoba mengirim
  nilai yang dihitungnya (field `score`, `status`, `attempts`, `idempotency_key`, `external_grade_id`) ke suatu
  tujuan — bisa jadi ke tabel SIAKAD (`CourseEnrollment`) langsung lewat akses database bersama, atau ke API
  SIAKAD, atau bahkan ke Feeder/PDDIKTI langsung tanpa lewat SIAKAD sama sekali. **Saya tidak bisa memastikan
  tujuan akhirnya dari schema saja.**

**Status: NEEDS CONFIRMATION.** Pertanyaan konkret yang perlu dijawab oleh siapa pun yang mengelola LMS:
1. Apakah LMS membaca data mahasiswa/dosen/kelas SIAKAD lewat akses database langsung, atau lewat API SIAKAD?
2. Ke mana `LmsGradeSync` sebenarnya mengirim nilai — tabel SIAKAD langsung, API SIAKAD, atau tujuan lain?
3. Apakah ada risiko tabrakan dengan modul Feeder SIAKAD yang **juga** mengirim nilai (`CourseEnrollment`) ke
   PDDIKTI (lihat `FEEDER_AUDIT_REPORT.md`) — misalnya kalau LMS dan Feeder sama-sama berusaha menulis ke kolom
   nilai yang sama di `course_enrollments` tanpa saling tahu? **Saya tidak menemukan bukti konflik aktif** (tidak
   ada baris kode SIAKAD yang terganggu, dan model LMS tidak mereferensikan `CourseEnrollment` lewat Prisma), tapi
   saya juga tidak bisa **menyingkirkan** kemungkinan itu tanpa melihat kode LMS yang menulis lewat jalur lain
   (raw SQL dari sisi TypeORM, yang tidak akan terlihat dari sisi Prisma/SIAKAD).

### 4.4 Database LMS di development vs production

- **Development (lokal)**: dikonfirmasi — satu instance Postgres, satu database (`siakad_premium`), tabel LMS
  dan tabel SIAKAD hidup berdampingan di schema `public` yang sama.
- **Production**: **NEEDS CONFIRMATION.** Tidak ada bukti di repo ini (lihat §4.1–4.2).

---

## 5. Status Perubahan Git

**Tidak ada commit yang dijalankan** (dipatuhi sesuai batasan di seluruh rangkaian tugas Feeder sejak awal).

### 5.1 Peta perubahan pada `packages/database/prisma/schema.prisma`

Working tree saat ini (dibanding `HEAD`, commit `2c540ec`) berisi **tepat 3 hunk diff**, dan ketiganya **tidak
saling beririsan** — artinya secara mekanis BISA dipisah jadi commit terpisah tanpa mengedit ulang isinya:

| Hunk | Baris (versi lama → baru) | Isi | Sumber |
|---|---|---|---|
| 1 | `1207,6 → 1207,9` | Komentar baru di field `password`/`secretKey` pada `model PddiktiSetting` | **Feeder (saya)** |
| 2 | `1221,6 → 1224,57` | Model baru `FeederSyncLog` + `FeederSyncLock` | **Feeder (saya)** |
| 3 | `2446,3 → 2500,667` | 35 model `Lms*` (baris 2511–3166 di file saat ini) | **Bukan Feeder** — sudah ada di working tree sebelum saya mulai bekerja hari ini (lihat `FEEDER_HARDENING_REPORT.md`), asalnya belum dikonfirmasi |

### 5.2 Cara memisahkannya jadi commit terpisah (rekomendasi, belum dijalankan)

Saya sempat mencoba menghasilkan file `.patch` statis untuk tiap bagian, tapi **gagal diterapkan secara mandiri**
(hunk Prisma pakai nomor baris relatif terhadap hasil akhir gabungan, jadi file patch yang dipecah manual tidak
valid diterapkan satu per satu ke `HEAD` langsung) — saya buang hasil itu daripada menyerahkan alat yang ternyata
rusak. **Cara yang benar dan aman**: pakai mode interaktif Git sendiri, yang menghitung ulang offset dengan benar:

```bash
git add -p packages/database/prisma/schema.prisma
# Akan muncul 3 hunk satu per satu (urutan sesuai tabel 5.1 di atas):
#   Hunk 1 & 2 -> jawab 'y' (bagian Feeder) untuk commit Feeder
#   Hunk 3     -> jawab 'n' (bagian Lms, SETELAH dikonfirmasi pemiliknya -- lihat §4.3) untuk commit terpisah
git commit -m "feat: tambah FeederSyncLog/FeederSyncLock untuk hardening Feeder"
# lalu, SETELAH dikonfirmasi model Lms memang disengaja:
git add packages/database/prisma/schema.prisma   # sisa hunk 3 yang belum di-stage
git commit -m "chore: daftarkan model Lms* (tabel dikelola migration LMS terpisah)"
```

Selain `schema.prisma`, semua file lain yang saya ubah untuk Feeder **sudah terpisah secara alami** (tidak
bersinggungan dengan LMS sama sekali): `feeder-crypto.util.ts` (baru), `integration-settings.service.ts`,
`integration-settings.controller.ts`, `deploy/README.md`, dan ketiga laporan Markdown — tidak satu pun menyentuh
kode atau model LMS. Hanya `schema.prisma` yang bercampur, dan itu pun **mekanis rapi** (3 hunk jelas, tidak
interleaved per baris).

### 5.3 File migration terkait

**Tidak ada** — repo ini tidak memakai folder `prisma/migrations` (dikonfirmasi: folder itu tidak ada di
`packages/database/prisma/`), dan migration untuk tabel LMS berada di repo LMS terpisah yang tidak bisa diakses
dari sini (§4.1, §4.3).

---

## 6. Risiko yang Masih Tersisa

1. **`schema.prisma` masih campur** antara perubahan Feeder (sudah final, siap commit) dan model Lms (status
   kepemilikan sudah lebih jelas dari review ini — jelas dikelola LMS, bukan asing — tapi belum dikonfirmasi
   SIAPA yang menambahkannya ke working tree dan APAKAH sudah waktunya di-commit). Risikonya murni "commit tidak
   sengaja mencampur dua perubahan yang tidak berkaitan", bukan risiko data.
2. **Mekanisme sinkronisasi identitas LMS↔SIAKAD belum terkonfirmasi** (§4.3) — termasuk kemungkinan (belum
   terbukti, belum tersingkirkan) tabrakan penulisan nilai antara `LmsGradeSync` dan modul Feeder SIAKAD pada
   tabel `course_enrollments`.
3. **Arsitektur database LMS di produksi belum terkonfirmasi** (§4.4) — apakah instance Postgres yang sama dengan
   SIAKAD, atau terpisah, tidak bisa dipastikan dari repo ini.
4. Seluruh risiko yang sudah tercatat di `FEEDER_POST_HARDENING_REVIEW.md` §5 (ketergantungan rotasi `JWT_SECRET`,
   refresh token otomatis belum ada, `runFeederSync` belum dipasang ke 3 alur lama, 4 alur push lain belum
   idempoten) **masih berlaku, tidak berubah oleh review ini**.

---

## 7. Rekomendasi Final

1. **Konfirmasi ke pemilik/pengelola LMS** tiga pertanyaan di §4.3 sebelum mengasumsikan apa pun lebih jauh
   tentang integrasi LMS↔SIAKAD, dan konfirmasi apakah penambahan 35 model `Lms*` ke `schema.prisma` memang
   disengaja & siap di-commit.
2. **Pisahkan commit** `schema.prisma` memakai `git add -p` seperti contoh di §5.2 — ini aman dijalankan kapan
   saja karena murni operasi staging Git, tidak mengubah isi file.
3. **Dokumentasi `deploy/README.md` yang baru ditambahkan** (§2) sudah bisa langsung dipakai tim ops — tidak perlu
   tindakan tambahan untuk bagian ini.
4. **Tidak perlu tindakan apa pun** untuk tabel `lp3m_*` — sudah benar, sudah terdaftar, sudah dikelola dengan
   semestinya (§3.5).
5. Risiko operasional Feeder yang belum dikerjakan (§6 poin 4) tetap menunggu persetujuan eksplisit sebelum
   diimplementasikan, sesuai batasan yang berlaku sejak `FEEDER_HARDENING_REPORT.md`.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
