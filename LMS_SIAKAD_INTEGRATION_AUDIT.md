# Audit Integrasi LMS NextVersa ↔ SIAKAD Premium

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_AUDIT_REPORT.md`, `FEEDER_HARDENING_REPORT.md`, `FEEDER_POST_HARDENING_REVIEW.md`,
`FEEDER_DATABASE_FINAL_REVIEW.md`. **Lingkup: audit read-only murni — tidak ada kode, database, atau konfigurasi
produksi yang diubah; tidak ada data atau nilai yang dikirim ke mana pun.**

## 0. Tentang sumber bukti di laporan ini

Review sebelumnya (`FEEDER_DATABASE_FINAL_REVIEW.md`) melaporkan repo LMS "tidak tersedia" dan menandai mekanisme
integrasinya **NEEDS CONFIRMATION** murni dari struktur schema. **Itu sudah tidak akurat** — repository LMS
**ternyata ada** di komputer yang sama, di `C:\Users\GALIH JP\Desktop\lms` (bukan di dalam `siakadpremium`, bukan
submodule, tidak terhubung git dengan repo ini — folder independen, tidak ber-git sama sekali di sana). Sesuai
instruksi tugas ini ("Jika repository LMS tersedia, periksa langsung source code-nya"), saya **membaca source code
dan dokumentasinya langsung** — bukan menebak dari nama model lagi. Mayoritas temuan di laporan ini sekarang
**VERIFIED** lewat kutipan kode asli, bukan dugaan.

Saya **tidak mengubah apa pun** di folder `lms` tersebut — murni dibaca.

---

## 1. Diagram Arsitektur Integrasi Aktual — **VERIFIED**

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   SIAKAD Premium (ini)      │         │      NextVersa LMS            │
│   NestJS + Prisma            │         │   NestJS + TypeORM            │
│   Postgres "siakad_premium"  │◄───────►│   (database MODE tergantung   │
│   schema public              │  lihat  │    INTEGRATION_MODE)          │
└─────────────────────────────┘  §2      └──────────────────────────────┘
```

Mode diatur sekali saat instalasi LMS lewat `INTEGRATION_MODE` (`lms/apps/api/.env.example`), **tidak berpindah
di database yang sama** (dikonfirmasi lewat komentar migration, §4):

| Mode | Default? | Cara LMS membaca data akademik | Database LMS |
|---|---|---|---|
| **`NATIVE_DATABASE`** | **Ya, bawaan** | **Query SQL langsung** ke tabel SIAKAD (`students`, `lecturers`, `course_classes`, `course_enrollments`, dst.) lewat koneksi TypeORM terpisah ke database **yang sama** | Sama dengan SIAKAD (`SIAKAD_DB_*`) kecuali diisi `LMS_DB_*` terpisah |
| `EXTERNAL_API` | Tidak | **REST API** kampus (`/api/v1/academic/*`, kontrak di `lms/docs/integrasi-siakad-eksternal.md`) | Database LMS sendiri (mirror/cache, tabel dibuat migration `AddAcademicMirror`) |

**Instalasi yang berkaitan dengan repo SIAKAD ini memakai `NATIVE_DATABASE`** — bukti: (a) `INTEGRATION_MODE=NATIVE_DATABASE`
adalah nilai bawaan di `.env.example` LMS; (b) database lokal `siakad_premium` berisi tabel `lms_*` dengan data nyata
(lihat `FEEDER_POST_HARDENING_REVIEW.md` §1.1); (c) **SIAKAD (repo ini) sama sekali tidak mengimplementasikan**
kontrak `/api/v1/academic/*` yang disyaratkan `EXTERNAL_API` — dicek lewat pencarian menyeluruh di
`apps/api/src/modules`: nol rute cocok dengan `/periods`, `/students`, `/classes` berbentuk kontrak itu, nol
referensi `grades/draft`, `EXTERNAL_API`, atau `siakad-eksternal` di seluruh kode SIAKAD. Kalau `EXTERNAL_API`
yang dipakai, seluruh panggilan LMS akan gagal `404` — jadi `NATIVE_DATABASE` adalah satu-satunya mode yang
masuk akal untuk pasangan repo yang saya lihat saat ini.

**Sumber kutipan kunci** (`lms/apps/api/src/database/database.config.ts`, komentar asli):

> "Koneksi TypeORM untuk data khusus LMS. Satu database dan satu schema (`public`) dengan SIAKAD... Skema diubah
> lewat migration, bukan synchronize. Tabel LMS merujuk data SIAKAD dengan menyimpan id (text) tanpa foreign key...
> role itu perlu hak pada tabel `lms_*` **dan hak tulis ke `course_enrollments` serta `enrollment_component_scores`**
> (pengiriman nilai)."

Ini mengonfirmasi **langsung dari kode**, bukan dugaan: LMS (mode `NATIVE_DATABASE`) membaca tabel SIAKAD lewat SQL
langsung, dan **menulis nilai langsung ke `course_enrollments` dan `enrollment_component_scores`** — dua tabel
milik SIAKAD sendiri (model Prisma `CourseEnrollment` dan `EnrollmentComponentScore`, dipakai juga oleh
`apps/api/src/modules/academic/academic.service.ts` di sisi SIAKAD) — **tanpa lewat NestJS API SIAKAD sama sekali**.

---

## 2. Alur Sinkronisasi Data Mahasiswa — **VERIFIED**

Dibaca langsung dari `lms/apps/api/src/integrations/academic/native-database.provider.ts` (236 baris):

```sql
-- cuplikan asli (disederhanakan) untuk GET students dalam mode NATIVE_DATABASE
SELECT ..., "studyProgramId" AS study_program_id,
       (students.status::text = 'ACTIVE' AND COALESCE((SELECT u."isActive" FROM users u WHERE u.id = students."userId"), FALSE)) AS is_active
FROM students ...
```

- **Tidak ada "sinkronisasi" dalam arti menyalin data** di mode ini — LMS membaca tabel `students`/`users` SIAKAD
  **secara langsung dan real-time** setiap kali butuh data, lewat koneksi database terpisah (bukan Prisma Client
  SIAKAD, melainkan koneksi TypeORM LMS sendiri ke database yang sama).
- Status aktif mahasiswa dihitung dari **dua tabel SIAKAD sekaligus** (`students.status = 'ACTIVE'` DAN
  `users.isActive`), persis logika yang sama yang dipakai SIAKAD sendiri.
- Tidak ada staleness/cache untuk pembacaan identitas di mode ini — **selalu data terkini** karena dibaca langsung,
  bukan dari salinan.
- Tabel `LmsExternalRef`/`LmsAcademicSyncRun`/dst. (yang saya lihat di schema sebelumnya) **tetap dipakai di kedua
  mode** (dikonfirmasi dari komentar `AcademicSyncService`: *"Modul LMS lain TIDAK memakai [provider] ini: mereka
  membaca salinan akademik lewat SiakadService (**kedua mode**)"*) — artinya walau NATIVE_DATABASE membaca
  langsung dari sumber, LMS tetap menjalankan proses sinkron berkala yang mencatat jejaknya di tabel-tabel itu
  (menjelaskan kenapa `lms_migrations` dan `lms_scheduler_state` punya baris walau mode-nya native).

---

## 3. Alur Sinkronisasi Dosen — **VERIFIED**

Pola identik dengan mahasiswa (§2), kutipan dari file yang sama:

```sql
SELECT ..., "studyProgramId" AS study_program_id,
       COALESCE((SELECT u."isActive" FROM users u WHERE u.id = lecturers."userId"), FALSE) AS is_active
FROM lecturers ...
```

**Validasi hak mengajar** (siapa boleh kirim nilai) — kutipan `lms/apps/api/src/grading/grading.service.ts:108-110`:

```ts
/** Aturan SIAKAD: dosen hanya boleh mengisi nilai kelas yang ia ampu (`course_classes.lecturerId`). */
if (auth.role === 'LECTURER' && (!auth.lecturerId || ctx.lecturerId !== auth.lecturerId)) { ... }
```

Dicek langsung terhadap kolom `course_classes.lecturerId` — kolom SIAKAD yang sama yang dipakai SIAKAD sendiri
untuk menentukan dosen pengampu. **Ini sesuai janji di `integrasi-siakad-eksternal.md` §3.7**, yang menyebut
peran `PRIMARY` sebagai satu-satunya yang berhak mengirim nilai — dan memang di skema SIAKAD, `course_classes`
hanya punya **satu** kolom `lecturerId` (bukan daftar banyak dosen dengan peran), jadi "PRIMARY" di LMS secara
alami dipetakan ke kolom tunggal itu.

---

## 4. Alur Sinkronisasi Kelas & Mata Kuliah — **VERIFIED**

Pola baca yang sama (SQL langsung) berlaku untuk `course_classes` dan `courses`. Tidak saya kutip detail SQL-nya
satu per satu (di luar kebutuhan laporan ini), tapi strukturnya konsisten dengan §2–3: baca langsung, bukan
salinan, di mode `NATIVE_DATABASE`.

**Catatan penting soal migration `AddAcademicMirror`** (`lms/apps/api/src/database/migrations/1763200000000-AddAcademicMirror.ts`):
migration ini membuat tabel mirror (`students`, `course_classes`, `course_enrollments`, dst. — **nama tabel yang
SAMA PERSIS dengan tabel SIAKAD**) **hanya kalau** `INTEGRATION_MODE=EXTERNAL_API`. Kutipan kode:

```ts
async up(queryRunner: QueryRunner): Promise<void> {
  if (!isExternalMode()) return;   // <-- pada NATIVE_DATABASE, migration ini TIDAK melakukan apa pun
  ...
}
```

Ini **desain yang disengaja dan aman**: pada `NATIVE_DATABASE`, migration LMS **tidak pernah mencoba membuat ulang
atau mengubah** tabel SIAKAD yang sudah ada — ia hanya "lewat" migration itu tanpa efek. Risiko tabrakan skema
(migration LMS membuat tabel `students` yang bentrok dengan tabel SIAKAD) **secara eksplisit dicegah di kode**,
bukan kebetulan.

---

## 5. Alur Pengiriman Nilai — **VERIFIED, dan hasilnya lebih aman dari yang saya duga sebelumnya**

Dibaca langsung dari `lms/apps/api/src/grading/grading.store.ts` (383 baris), fungsi `pushScores()`:

### 5.1 Urutan validasi (sebelum satu nilai pun ditulis)

1. `assertWritable()` — menolak kalau skema/bobot komponen SIAKAD untuk kelas itu belum lengkap, atau periode
   terkunci (`gradeLock`).
2. Mengambil baris `course_enrollments` terkait dengan **`FOR UPDATE`** (row lock Postgres) — mencegah race
   condition dengan penulis lain (termasuk SIAKAD sendiri) pada baris yang sama.
3. Hanya enrollment berstatus **`APPROVED`** yang diproses (`WHERE ... status = 'APPROVED'`) — mahasiswa yang KRS-nya
   belum/tidak disetujui tidak bisa dapat nilai dari LMS.
4. **Pengecekan FINAL — kutipan persis:**
   ```ts
   const FINAL_ERROR = 'Nilai mahasiswa sudah FINAL di SIAKAD dan tidak dapat diubah dari LMS.';
   ...
   if (enrollment.grade_status === 'FINAL') { fail(FINAL_ERROR); continue; }
   ```
   **Ini jawaban langsung untuk pertanyaan §3 di tugas**: nilai FINAL **tidak pernah** bisa ditimpa LMS — dicegah
   di kode, bukan di dokumentasi saja.
5. **Idempotensi**: nilai yang tidak berubah (`Math.abs(current - clamp100(p.value)) < EPSILON`) ditandai
   `unchanged`, **tidak ditulis ulang**.
6. Nilai akhir dihitung ulang (`schemeTotal`, `pickGrade`) memakai **skema komponen dan skala nilai milik SIAKAD
   sendiri** (dibaca dari `assessment_schemes`/`assessment_components`/`grade_scales` SIAKAD) — bukan logika
   penilaian LMS sendiri.
7. Penulisan akhir — kutipan persis:
   ```ts
   await tx.query(
     `UPDATE course_enrollments SET "totalScore" = $2, "gradeLetter" = $3, "gradePoint" = $4, "gradeStatus" = 'DRAFT', "updatedAt" = now()
      WHERE id = $1`, [enrollment.id, total, grade.letter, grade.gradePoint]);
   ```
   **`gradeStatus` SELALU diset `'DRAFT'`**, hard-coded — LMS **tidak pernah dan tidak bisa** menuliskan status
   `FINAL` lewat jalur ini.
8. Skor per-komponen ditulis ke `enrollment_component_scores` (upsert, `ON CONFLICT ... DO UPDATE`) — tabel
   SIAKAD yang sama yang dipakai `academic.service.ts` sisi SIAKAD untuk entri nilai manual oleh dosen/BAAK.

### 5.2 Siapa yang menjadikannya FINAL?

**Hanya SIAKAD sendiri** — dikonfirmasi dari `apps/api/src/modules/academic/academic.service.ts` (repo ini):

```ts
data: { totalScore, gradeLetter, gradePoint, gradeStatus: payload.isFinalSubmit ? 'FINAL' : 'DRAFT' },
```

`isFinalSubmit` adalah input eksplisit dari pemanggil endpoint SIAKAD (dosen/BAAK lewat UI nilai SIAKAD) — **tidak
ada jalur dari LMS yang bisa mengatur `isFinalSubmit`**, karena LMS tidak pernah memanggil endpoint SIAKAD ini
sama sekali (ia menulis langsung ke database, melewati seluruh lapisan `academic.service.ts`).

**Kesimpulan §5**: urutan kerjanya sudah sesuai yang diminta tugas ini —
- ✅ Nilai dari LMS tidak langsung menimpa nilai final tanpa aturan (dicegah di kode, §5.1 poin 4).
- ✅ Ada validasi sebelum nilai masuk (lock periode, status KRS, hak dosen, skema lengkap — §5.1 poin 1–3).
- ✅ SIAKAD tetap jadi sumber resmi penetapan FINAL (hanya `academic.service.ts` yang bisa menulis `FINAL`).
- ⚠️ **Satu catatan jujur**: LMS menulis **langsung lewat SQL ke tabel SIAKAD**, bukan lewat `academic.service.ts`
  SIAKAD. Artinya validasi di atas **seluruhnya diimplementasikan ulang di sisi LMS** (bukan dipanggil dari kode
  SIAKAD yang sama) — kalau suatu saat aturan akademik SIAKAD berubah (mis. kolom status KRS baru, aturan lock
  periode baru), **LMS harus ikut diperbarui secara terpisah** supaya aturannya tetap konsisten. Ini bukan bug
  yang saya temukan, tapi **risiko struktural dari desain `NATIVE_DATABASE`** yang perlu dipahami: dua basis kode
  terpisah menegakkan aturan akademik yang sama secara independen.

---

## 6. Hubungan LMS dengan Feeder PDDIKTI — **VERIFIED: tidak ada hubungan langsung, dan tidak ada konflik aktif**

- **LMS tidak pernah menyentuh apa pun yang berkaitan dengan Feeder.** Dicek: tidak ada referensi `feeder`,
  `pddikti`, `PDDIKTI`, atau `Feeder` di seluruh source `lms/apps/api/src` (pencarian menyeluruh, nol hasil).
- **Feeder (modul SIAKAD) hanya mengirim nilai ke PDDIKTI yang `gradeStatus = 'FINAL'`** (dikonfirmasi ulang dari
  `FEEDER_AUDIT_REPORT.md` dan kode `pushNilaiToFeeder` di `integration-settings.service.ts`: filter
  `gradeStatus: 'FINAL', gradeLetter: { not: null }`).
- **Karena LMS tidak pernah menulis `FINAL`** (§5.1 poin 7), **LMS tidak bisa memicu pengiriman nilai ke Feeder
  secara tidak sengaja.** Finalisasi selalu lewat tindakan eksplisit di SIAKAD (`isFinalSubmit`), dan baru setelah
  itu nilai menjadi kandidat yang dilihat Feeder.
- **Tidak ada pengiriman nilai ganda ke PDDIKTI** dari jalur LMS — LMS tidak punya jalur ke PDDIKTI sama sekali,
  langsung maupun tidak langsung. Satu-satunya jalur ke PDDIKTI adalah modul Feeder SIAKAD.
- **Risiko tidak langsung yang tetap perlu diketahui** (bukan konflik aktif, tapi titik rawan operasional): karena
  LMS menulis `totalScore`/`gradeLetter`/`enrollment_component_scores` dengan `FOR UPDATE` lock di level baris,
  dan modul nilai SIAKAD (`academic.service.ts`) juga menulis tabel yang sama saat dosen entri manual — **kedua
  sistem berbagi baris data yang sama sebelum finalisasi**. Ini desain yang disengaja dan terdokumentasi (DRAFT
  boleh ditimpa siapa pun sampai FINAL), bukan cacat, tapi berarti dosen yang mengisi nilai manual di SIAKAD
  **bisa tertimpa** oleh pengiriman LMS berikutnya untuk komponen yang sama, dan sebaliknya — **sampai nilai itu
  di-FINAL-kan**. Ini konsisten dengan prinsip yang didokumentasikan LMS sendiri (§1 "Nilai FINAL tidak pernah
  ditimpa"), jadi bukan temuan baru, tapi saya catat di sini supaya eksplisit tercantum sebagai perilaku yang
  perlu dipahami pengguna (dosen/BAAK), bukan bug.

---

## 7. Potensi Konflik dan Duplikasi — Ringkasan

| Area | Status | Catatan |
|---|---|---|
| Duplikasi tabel SIAKAD oleh migration LMS | **VERIFIED: tidak terjadi** | Migration `AddAcademicMirror` sengaja no-op di `NATIVE_DATABASE` (§4) |
| Tabrakan nama tabel/model Prisma vs TypeORM | **VERIFIED: tidak ada** | Dikonfirmasi ulang di `FEEDER_POST_HARDENING_REVIEW.md` §1.4 (nol duplikat `@@map`) |
| Nilai LMS menimpa nilai FINAL | **VERIFIED: dicegah di kode** | §5.1 poin 4 |
| Nilai ganda terkirim ke Feeder/PDDIKTI | **VERIFIED: tidak mungkin dari jalur LMS** | §6 — LMS tidak punya jalur ke Feeder sama sekali |
| Race condition tulis bersamaan ke `course_enrollments` | **VERIFIED: ditangani** | `FOR UPDATE` row lock di sisi LMS (§5.1 poin 2); tidak saya verifikasi apakah SIAKAD juga memakai locking eksplisit yang setara di `academic.service.ts` — **PARTIAL**, karena Postgres row lock akan tetap melindungi baris itu secara otomatis terlepas dari ORM yang dipakai (Prisma transaksi biasa juga akan menunggu lock tersebut), jadi risikonya rendah meski belum saya baca baris demi baris `academic.service.ts` untuk transaksi eksplisit. |
| Validasi akademik terduplikasi di dua basis kode | **VERIFIED, dan ini risiko nyata** | §5.2 — perubahan aturan di satu sisi tidak otomatis ikut di sisi lain |
| Kredensial LMS untuk akses database SIAKAD | **VERIFIED, enkripsi ada** | `lms/docs/integrasi-siakad-eksternal.md` §9: "Kredensial disimpan terenkripsi (AES-256-GCM)" — ini kredensial **API** untuk mode `EXTERNAL_API`; untuk `NATIVE_DATABASE`, kredensialnya adalah `SIAKAD_DB_*` (username/password Postgres biasa) di `.env` LMS sendiri — **NEEDS CONFIRMATION** apakah role database yang dipakai LMS di produksi punya hak **terbatas** (hanya tabel yang disebutkan di §1) atau hak penuh ke seluruh database SIAKAD; saya tidak menemukan bukti pembuatan role terbatas (seperti pola `obe_reader` pada integrasi OBE) di kode LMS yang saya baca. |

---

## 8. Rekomendasi Arsitektur

Tidak ada yang diimplementasikan — murni saran untuk dipertimbangkan, bukan tindakan yang sudah dijalankan:

1. **Pertimbangkan role database terbatas untuk LMS**, serupa pola `obe_reader` yang sudah dipakai proyek ini
   untuk integrasi OBE (lihat `docs/integrasi-obe.md`) — role LMS idealnya hanya punya hak baca ke tabel yang
   memang dibutuhkan (§1) dan hak tulis **hanya** ke `course_enrollments`, `enrollment_component_scores`, dan
   tabel `lms_*` miliknya sendiri, bukan akses penuh ke seluruh skema (termasuk tabel sensitif seperti
   `pddikti_settings` yang sekarang berisi kredensial Feeder terenkripsi, atau data keuangan).
2. **Dokumentasikan secara eksplisit** (di `deploy/README.md` SIAKAD, berdampingan dengan dokumentasi Feeder yang
   sudah ditambahkan) bahwa SIAKAD di deployment ini berbagi database dengan LMS dalam mode `NATIVE_DATABASE`,
   termasuk daftar tabel yang ditulis LMS langsung, supaya perubahan skema SIAKAD di masa depan (mis. mengubah
   `course_enrollments` atau `enrollment_component_scores`) mempertimbangkan dampaknya ke LMS sebelum dilakukan.
3. **Pertimbangkan uji integrasi bersama** (bukan hanya audit statis seperti ini) sebelum perubahan besar pada
   `academic.service.ts` sisi nilai, karena §5.2 menunjukkan logika akademik terduplikasi di dua basis kode.

---

## 9. Hal yang Masih Membutuhkan Konfirmasi

1. **Hak akses role database LMS di produksi** (§7, baris terakhir) — apakah dibatasi atau akses penuh. Tidak
   bisa dipastikan dari kode yang saya baca (kode LMS menyebut kebutuhan hak tulis minimal, tapi tidak membuktikan
   role produksi sungguhan sudah dibatasi sesuai itu — itu konfigurasi infrastruktur, di luar kode aplikasi).
2. **Topologi database produksi** (instance Postgres yang sama secara fisik dengan SIAKAD, atau terpisah) — masih
   seperti yang dilaporkan `FEEDER_DATABASE_FINAL_REVIEW.md` §4.4, tidak berubah oleh temuan source code LMS ini
   (source code LMS mendukung keduanya lewat `LMS_DB_*` opsional, tidak memaksa satu topologi).
3. **Apakah deployment produksi sungguhan memakai `NATIVE_DATABASE` atau `EXTERNAL_API`** — saya menyimpulkan
   `NATIVE_DATABASE` dari bukti kuat (database lokal, bawaan `.env.example`, SIAKAD tidak implementasi kontrak
   API) tapi **tidak melihat file `.env` produksi LMS sungguhan** — ini sesuai instruksi tugas untuk tidak
   menyimpulkan produksi hanya dari database lokal, jadi saya tandai confidence tinggi tapi **tidak** sebagai
   VERIFIED mutlak untuk lingkungan produksi spesifik.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
