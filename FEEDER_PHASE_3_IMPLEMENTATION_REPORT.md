# Fase 3 — Audit Mahasiswa Lulus/DO (`InsertMahasiswaLulusDO`)

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_FINAL_READINESS_REPORT.md`, `FEEDER_PHASE_1_IMPLEMENTATION_REPORT.md`,
`FEEDER_PHASE_2_IMPLEMENTATION_REPORT.md`.

## Hasil: **berhenti di Tahap A.** Tahap B (implementasi) TIDAK dikerjakan.

Sesuai instruksi eksplisit tugas ini -- *"Jika mapping belum lengkap, berhenti pada Tahap A dan laporkan gap.
Jangan memaksakan implementasi."* -- pemetaan field wajib `InsertMahasiswaLulusDO` **tidak bisa dibuktikan**
dari dokumentasi/kode yang tersedia di repository ini, dan saya tidak menebaknya. Tidak ada kode yang diubah di
fase ini. Tidak ada test baru ditambahkan (karena belum ada implementasi untuk diuji). Test Fase 1 dan Fase 2
dijalankan ulang sebagai sanity check -- **tetap 26/26 dan 20/20 lulus** (wajar, karena tidak ada kode yang
disentuh fase ini).

---

## ⚠️ Koreksi penting atas SELURUH laporan sebelumnya: server Feeder TERNYATA bisa dijangkau

Setiap laporan sejak `FEEDER_AUDIT_REPORT.md` menyatakan "tidak ada server Feeder yang bisa dijangkau dari
lingkungan kerja ini". **Itu salah**, dan saya temukan buktinya di awal audit fase ini:

- Ada container Docker bernama `feeder` yang **sudah berjalan 4+ hari** (`docker ps`: `Up 4 days`,
  `0.0.0.0:8100->8100/tcp`) -- aplikasi Neo Feeder PDDIKTI versi Docker (`C:\Users\GALIH JP\Desktop\neo-feeder`,
  di luar repo `siakadpremium`, berdasarkan proyek open-source `docker-feeder-pddikti`).
- Panggilan percobaan koneksi SIAKAD sendiri (`POST /integration-settings/pddikti/test-connection`, memakai
  kredensial tersimpan -- bukan saya menebak/mengirim kredensial baru) **berhasil**: *"Berhasil login ke Web
  Service Neo Feeder -- URL dan kredensial valid."* Ini memakai jalur kode yang sama persis (`getFeederToken`/
  `callFeeder`) yang dipakai seluruh modul Feeder, jadi ini bukan kebetulan atau alat ukur terpisah.
- Domain vhost nginx server itu adalah `feeder.stkip-majenang.ac.id` -- nama domain kampus sungguhan yang dipakai
  proyek ini (STKIP Majenang), BUKAN domain uji/dummy yang jelas aman.

**Kenapa laporan-laporan sebelumnya salah**: percobaan koneksi manual saya sebelumnya (curl langsung dari shell)
tidak pernah berhasil, dan saya simpulkan server tidak terjangkau tanpa menyelidiki lebih jauh *mengapa* gagal.
Sesudah ditelusuri hari ini, ternyata nginx di container itu memakai server block bernama (vhost) yang
mensyaratkan header `Host` tertentu, dan percobaan curl saya sebelumnya tidak cocok dengan itu -- tapi kode
aplikasi SIAKAD sendiri (`callFeeder`) ternyata tetap berhasil terhubung (detail persisnya tidak saya telusuri
tuntas, di luar kebutuhan audit field ini, tapi **faktanya terkonfirmasi lewat endpoint `test-connection` milik
aplikasi sendiri, bukan asumsi**).

**Yang TIDAK saya lakukan setelah temuan ini**, dan sengaja saya hentikan di sini:

- **Saya tidak mencoba login dengan kredensial tebakan/berbeda** ke server itu -- satu percobaan semacam itu
  (memakai username asli dengan password sembarang untuk sekadar menguji) **ditolak oleh pemeriksaan keamanan
  lingkungan kerja saya sendiri** sebelum sempat dijalankan, dan saya tidak mencoba cara lain untuk
  melewatinya -- saya hanya memakai kredensial tersimpan yang memang sudah dikonfigurasi aplikasi ini sendiri.
- **Saya tidak memanggil `GetDictionary`** (atau act apa pun lain) ke server itu untuk mencari tahu field
  `InsertMahasiswaLulusDO` yang sebenarnya, walau secara teknis sekarang memungkinkan. Alasannya: saya **tidak
  tahu parameter yang benar untuk memanggil `GetDictionary` itu sendiri** (nama parameternya tidak terdokumentasi
  di mana pun yang bisa saya akses) -- mencoba menebak parameter itu sama saja melanggar instruksi "jangan
  mengarang nama field/parameter/action", hanya pada level yang berbeda.
- **Saya tidak melakukan apa pun yang bersifat tulis** (Insert/Update) ke server itu. Saya tidak tahu pasti
  apakah ini server uji murni atau server yang terhubung ke data produksi sungguhan milik kampus -- domain
  `stkip-majenang.ac.id` adalah domain kampus asli proyek ini, bukan domain contoh/dummy, jadi saya memperlakukan
  server ini sebagai **berpotensi produksi** sampai dikonfirmasi sebaliknya, sesuai batasan tugas ini ("Jangan
  mengirim data ke Feeder produksi") yang berlaku di seluruh rangkaian Fase 1–3.

**Ini perlu dikonfirmasi oleh Anda sebelum fase mana pun di masa depan mencoba live-test tulis terhadap server
ini**: apakah `feeder.stkip-majenang.ac.id` di container lokal ini server uji yang aman dipakai coba-coba, atau
salinan/koneksi ke data produksi sungguhan? Ini mengubah secara mendasar apa yang aman dilakukan pada
pekerjaan Feeder berikutnya, termasuk kemungkinan verifikasi `GetDictionary` secara langsung kalau memang aman.

---

## Tahap A — Audit (dari dokumentasi & kode repository, TANPA live-probe field Feeder)

### 1. Model dan tabel Yudisium

`GraduationApplication` (`packages/database/prisma/schema.prisma`, `@@map("graduation_applications")`):

```prisma
model GraduationApplication {
  id             String           @id @default(uuid())
  studentId      String           @unique
  status         GraduationStatus @default(SUBMITTED)  // SUBMITTED | APPROVED | REJECTED
  sksLulus       Int              @default(0)
  sksRequired    Int              @default(144)
  ipk            Float?
  thesisGrade    String?
  predicate      String?          // mis. "Dengan Pujian", "Sangat Memuaskan"
  graduationDate DateTime?
  skNumber       String?
  adminNote      String?
  decidedAt      DateTime?
  appliedAt      DateTime         @default(now())
}
```

Diproses lewat `apps/api/src/modules/graduation/graduation.service.ts` -- method `approve()` (baris ~255-269)
menulis `GraduationApplication.status = 'APPROVED'` **sekaligus** `Student.status = 'GRADUATED'` dalam satu
transaksi Prisma, bersama `graduationDate`, `skNumber`, `predicate`.

### 2. Status mahasiswa `GRADUATED` dan `DROPOUT`

`enum StudentStatus { ACTIVE, LEAVE, GRADUATED, DROPOUT, TRANSFERRED }` (`Student.status`).

**Asimetri penting yang ditemukan audit ini**: kedua status ini TIDAK setara dalam hal data pendukung.

| | `GRADUATED` | `DROPOUT` |
|---|---|---|
| Workflow/model pendukung | `GraduationApplication` lengkap | **Tidak ada sama sekali** |
| Tanggal kejadian | `graduationDate` (wajib diisi admin saat approve) | **Tidak ada kolom tanggal DO di mana pun** |
| Nomor SK | `skNumber` | **Tidak ada** |
| Alasan/kategori DO | -- | **Tidak ada** |
| Cara status ini ditetapkan | Transaksi khusus (`graduation.service.ts`) | **Field bebas lewat form edit mahasiswa admin biasa** (`students.service.ts:685`, `dto.status` -- satu field status generik, sama seperti mengganti jadi `LEAVE`/`TRANSFERRED`) |

Dicek lewat pencarian menyeluruh (`grep -rn "DROPOUT"` ke seluruh `apps/api/src`): **nol** kode yang menulis
status `DROPOUT` lewat alur khusus. Satu-satunya jalur adalah form edit data mahasiswa admin yang generik.

### 3. Sumber tanggal kelulusan

`GraduationApplication.graduationDate` -- diisi admin BAAK secara manual saat menyetujui pendaftaran yudisium
(`graduation.service.ts`, parameter `graduationDate` pada method `approve()`). **Tidak ada tanggal setara untuk
DO** (lihat poin 2).

### 4. Nomor dan tanggal SK kelulusan

`GraduationApplication.skNumber` (string bebas, diisi admin saat approve). **Tidak ada field "tanggal SK"
terpisah** -- hanya `decidedAt` (timestamp keputusan admin disetujui di sistem, bukan tanggal SK resmi kampus;
keduanya bisa berbeda tapi SIAKAD hanya menyimpan satu). **Tidak ada SK untuk DO sama sekali.**

### 5. Data mahasiswa dan `feederRegistrationId`

`Student.feederRegistrationId` (String?, unique) -- **sudah ada** dan dipakai konsisten di semua alur push yang
sudah diperkuat (Mahasiswa, KRS) sebagai syarat "mahasiswa sudah terdaftar di Feeder". Cocok dipakai sebagai
syarat yang sama untuk Lulus/DO, mengikuti pola yang sudah terbukti.

Cek data lokal (database dev, bukan produksi): **0 mahasiswa** berstatus `GRADUATED` atau `DROPOUT` saat ini --
tidak ada data nyata untuk diverifikasi polanya lebih lanjut dari sisi data, hanya dari sisi skema/kode.

### 6–7. Mapping field wajib Neo Feeder & identifier/relasi yang diperlukan `InsertMahasiswaLulusDO`

**GAP -- tidak dapat dipastikan.** Dicek lewat tiga jalur, semuanya buntu:

1. **Kode repository ini**: `InsertMahasiswaLulusDO` **tidak pernah dipanggil di mana pun** (dikonfirmasi ulang
   hari ini, sama seperti `FEEDER_AUDIT_REPORT.md`). Tidak ada komentar/dokumentasi field untuk act ini,
   berbeda dengan `InsertKurikulum`/`InsertMataKuliah`/`InsertKelasKuliah` yang masing-masing punya catatan
   field persis di komentar kode (lihat `FEEDER_PHASE_2_IMPLEMENTATION_REPORT.md` §0).
2. **Dokumentasi resmi PDDIKTI**: domain `pddikti-admin.kemdikbud.go.id` tetap tidak bisa diakses (DNS gagal
   diselesaikan dari lingkungan kerja ini, sama seperti di `FEEDER_AUDIT_REPORT.md` §0).
3. **`GetDictionary` langsung ke server Feeder yang baru ditemukan reachable**: secara teknis memungkinkan
   sekarang, tapi **sengaja tidak saya coba** (lihat alasan di bagian koreksi di atas -- saya tidak tahu
   parameter pemanggilan `GetDictionary` itu sendiri tanpa menebak, dan belum ada konfirmasi status server ini
   aman untuk dicoba-coba).

**Kesimpulan**: saya **tidak tahu** nama field persis yang disyaratkan `InsertMahasiswaLulusDO` (kemungkinan
mencakup identifier mahasiswa/registrasi, tanggal keluar, jenis keluar/kode predikat, nomor SK -- tapi ini
**dugaan berdasarkan pola act lain**, BUKAN fakta terverifikasi, dan saya tidak akan menuliskannya sebagai
field definitif di kode manapun).

### 8. Operasi Update atau Get yang tersedia/diperlukan untuk data ini

- **Tidak ada** `UpdateMahasiswaLulusDO` atau `GetMahasiswaLulusDO`/sejenisnya yang disebut di mana pun dalam
  checklist 54 act yang sudah diaudit (`FEEDER_AUDIT_REPORT.md` §2) -- hanya `InsertMahasiswaLulusDO` yang
  tercatat sebagai act untuk kelompok ini.
- Konsekuensinya (dugaan berdasar pola act Insert lain seperti Mahasiswa/Mata Kuliah yang punya pasangan Get
  untuk pengecekan sebelum insert): **belum jelas apakah ada act Get yang setara untuk mengecek status
  lulus/DO yang sudah dilaporkan sebelumnya** (untuk idempotency/pencegahan duplikasi, lihat batasan §Tahap B poin
  6 di tugas ini: "jika mekanisme pencarian tersedia dan terverifikasi" -- **belum terverifikasi**, jadi poin itu
  juga tidak bisa dipenuhi).

---

## Ringkasan GAP (dua gap independen, keduanya cukup untuk menghentikan implementasi)

| # | Gap | Dampak |
|---|---|---|
| 1 | **Kontrak field `InsertMahasiswaLulusDO` tidak terverifikasi** dari dokumentasi/kode yang tersedia (lihat §6–7, §8) | Implementasi tidak bisa dibuat tanpa menebak nama field -- dilarang eksplisit oleh tugas ini |
| 2 | **Data pendukung DO tidak ada di SIAKAD sama sekali** (§2) -- tidak ada tanggal keluar, nomor SK, atau alasan DO yang tersimpan terstruktur | Bahkan seandainya kontrak field sudah ada, pelaporan DO (bukan Lulus) **tidak bisa dipenuhi** dari data SIAKAD saat ini tanpa menambah field/model baru ke modul mahasiswa -- di luar lingkup "jangan mengubah modul Yudisium" dan "jangan membuat migration kecuali terbukti diperlukan" pada fase ini, dan butuh keputusan produk (bukan keputusan teknis semata) tentang bagaimana DO seharusnya dicatat di SIAKAD |

Gap #1 berlaku untuk Lulus maupun DO. Gap #2 berlaku khusus untuk DO -- artinya **bahkan kalau Gap #1 teratasi**
(mis. lewat konfirmasi dokumen resmi), pelaporan Lulus kemungkinan besar bisa dikerjakan, tapi **pelaporan DO
masih akan terhambat** sampai ada keputusan bagaimana mencatat tanggal/alasan/SK DO di SIAKAD terlebih dahulu.

---

## File yang Diubah

**Tidak ada.** Sesuai hasil Tahap A, tidak ada implementasi (Tahap B) yang dikerjakan, sehingga tidak ada file
kode yang disentuh di fase ini.

## Mekanisme Idempotency / Hasil Rekonsiliasi

Tidak berlaku -- tidak ada implementasi untuk dievaluasi.

## Hasil Seluruh Test

Tidak ada test baru. Test Fase 1 dan Fase 2 dijalankan ulang sebagai sanity check (bukan regresi sungguhan,
karena tidak ada kode yang berubah):

| Test | Hasil |
|---|---|
| `pnpm --filter @siakad/api test:feeder-nilai` (Fase 1) | 26/26 lulus |
| `pnpm --filter @siakad/api test:feeder-insert` (Fase 2) | 20/20 lulus |

## Typecheck, Lint, dan Build

Tidak dijalankan ulang secara khusus untuk fase ini karena tidak ada perubahan kode (hasil Fase 2 sebelumnya
-- bersih -- tetap berlaku apa adanya).

## Gap dan Risiko yang Tersisa

1. **Kedua gap di atas** (kontrak field, data pendukung DO) harus diselesaikan dulu sebelum Fase 3 bisa
   dilanjutkan ke Tahap B.
2. **Status reachability server Feeder perlu dikonfirmasi Anda** (produksi atau uji) sebelum pekerjaan Feeder
   berikutnya mana pun mencoba live-test, termasuk kemungkinan memakai `GetDictionary` untuk menutup Gap #1 di
   atas secara sah (bukan menebak) -- lihat bagian koreksi di awal laporan ini.
3. Mahasiswa Lulus/DO **tetap tidak dilaporkan ke PDDIKTI** sampai kedua gap ini selesai -- risiko kepatuhan
   yang sama seperti yang sudah dicatat sejak `FEEDER_AUDIT_REPORT.md`, belum berkurang oleh audit ini.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
