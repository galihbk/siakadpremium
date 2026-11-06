# Audit Kesiapan Final — Integrasi Neo Feeder PDDIKTI, SIAKAD Premium

Tanggal: 2026-11-05
Konsolidasi dari `FEEDER_AUDIT_REPORT.md`, `FEEDER_HARDENING_REPORT.md`, `FEEDER_POST_HARDENING_REVIEW.md`,
`FEEDER_DATABASE_FINAL_REVIEW.md`. **Lingkup: hanya modul integrasi Feeder** — audit LMS (`LMS_SIAKAD_INTEGRATION_AUDIT.md`)
diabaikan di sini sesuai instruksi. **Murni read-only**: tidak ada kode, database, migration, atau konfigurasi
yang diubah di audit ini; tidak ada data yang dikirim ke server Feeder mana pun. Semua temuan disertai file dan
baris kode sebagai bukti, dicek ulang langsung dari kode saat ini (bukan mengandalkan ingatan dari laporan
sebelumnya).

File rujukan utama: `apps/api/src/modules/integration-settings/integration-settings.service.ts` (~5.600 baris
setelah hardening), `integration-settings.controller.ts`, `feeder-crypto.util.ts`.

## 1. Executive Summary

Integrasi Feeder **berfungsi dan sudah pernah berjalan nyata** (riwayat lama: puluhan ribu KRS dan nilai
tersinkron), dan **infrastruktur keandalan sudah dibangun** (retry, enkripsi kredensial, klaim idempoten, riwayat
sinkronisasi) — tapi **sebagian besar infrastruktur itu baru terpasang di 3 dari 7 alur push**, dan **dua mekanisme
kunci (refresh token otomatis, `runFeederSync` dengan rekonsiliasi) sama sekali belum dipakai di mana pun** meski
sudah ditulis dan diuji terpisah. Ini bukan regresi — ini keadaan yang jujur dilaporkan sejak
`FEEDER_HARDENING_REPORT.md`, dan **dikonfirmasi ulang hari ini masih demikian, tidak berubah**.

**Tidak ada live test terhadap server Feeder sungguhan yang pernah dilakukan dalam seluruh rangkaian audit ini**
(tidak ada server yang bisa dijangkau dari lingkungan kerja). Status "berfungsi" di atas bersumber dari data
historis di database (nilai `feederSyncedAt`/`feederId` terisi dari sinkronisasi masa lalu), bukan dari pengujian
langsung hari ini.

**Kesiapan untuk dipakai produksi apa adanya sekarang**: layak untuk kelompok inti (Prodi, Dosen, Mahasiswa, KRS,
Nilai) dengan risiko race-condition yang sudah ditangani untuk 3 operasi paling sering dipakai. **Belum layak**
untuk pelaporan Aktivitas Mahasiswa (skripsi/magang/KKN) dan Mahasiswa Lulus/DO — ini bukan soal keandalan tapi
soal **fungsi itu sendiri tidak ada sama sekali**.

---

## 2. Arsitektur Integrasi Saat Ini

```
Admin (Portal SIAKAD) ──HTTP──► IntegrationSettingsController ──► IntegrationSettingsService
                                  (SUPER_ADMIN; GET tertentu juga ADMIN_BAAK/STAFF)      │
                                                                                          ▼
                                                                          callFeeder() ──POST──► live2.php (Neo Feeder)
                                                                          (retry+backoff untuk
                                                                           kegagalan jaringan;
                                                                           TIDAK retry error_code≠0)
```

- Satu service besar (`IntegrationSettingsService`), satu controller, tidak ada queue/worker terpisah — semua
  pull/push berjalan sinkron dalam siklus hidup satu request HTTP (kecuali job background nilai, lihat §3).
- Kredensial (`PddiktiSetting.password`/`secretKey`) **terenkripsi AES-256-GCM**, kunci diturunkan dari
  `JWT_SECRET` (bukan variabel baru) — `feeder-crypto.util.ts`, dipakai lewat `getActivePddiktiSetting()`
  (`integration-settings.service.ts:216-263`, dikonfirmasi ulang hari ini).
- Tidak ada job queue (Bull/Redis) untuk Feeder — hanya satu job background in-memory (`nilaiSyncJob`, status
  disimpan di memori proses, **hilang kalau API restart** — `integration-settings.service.ts:262-271`, sudah
  dicatat sejak `FEEDER_AUDIT_REPORT.md`, tidak berubah).

---

## 3. Inventaris Seluruh Operasi Feeder yang Diimplementasikan

Kolom "Validasi sebelum kirim" hanya mencantumkan pemeriksaan **sebelum** data dikirim ke Feeder (bukan
penanganan respons). Baris disusun per alur (pull atau push), bukan per-`act` individual (daftar 54 `act`
lengkap dengan status implementasi per-`act` sudah ada di `FEEDER_AUDIT_REPORT.md` §2, tidak diulang di sini).

| Alur | Modul SIAKAD terkait | Operasi | `act` Feeder | Field dikirim (ringkas) | Sumber data lokal | Mapping ID | Validasi sebelum kirim |
|---|---|---|---|---|---|---|---|
| `pullProdiFromFeeder`/`syncProdiFromFeeder` | Program Studi | Get | `GetProdi` | — (baca saja) | `StudyProgram` | `diktiCode` ↔ `id_prodi` (via `kode_program_studi`) | — |
| `pullDosenFromFeeder`/`syncDosenFromFeeder` | Dosen | Get | `GetListDosen`, `DetailBiodataDosen` | — (baca saja) | `Lecturer` | `Lecturer.feederId` | — |
| `pushMahasiswaBaruToFeeder` | Mahasiswa | Insert | `GetProfilPT`, `GetProdi`, `GetListRiwayatPendidikanMahasiswa`, `GetBiodataMahasiswa`, `InsertBiodataMahasiswa`, `InsertRiwayatPendidikanMahasiswa` | Biodata lengkap (nama, NIK, alamat, wilayah, dll.) + jenis daftar | `Student` `status: 'ACTIVE', feederRegistrationId: null` (`:3973-3978`) | `Student.feederId`/`feederRegistrationId` | Cek dulu ke Feeder by NIM/NIK sebelum insert (hindari duplikat); `idProdiFeeder` wajib ketemu; wilayah wajib cocok; **klaim idempoten** (`claimFeederSync('Student', id, 'INSERT')`, `:3980`) |
| `pullMahasiswaFromFeeder`/`syncMahasiswaFromFeeder` | Mahasiswa | Get | `GetListRiwayatPendidikanMahasiswa`, `GetProdi` | — (baca saja) | `Student` | `Student.feederId`/`feederRegistrationId` | — |
| `pushKurikulumBaruToFeeder` | Kurikulum | Insert | `InsertKurikulum` | kode, nama kurikulum | `Curriculum` `feederId: null` | `Curriculum.feederId` | Cek `feederId IS NULL` saja; **tidak ada klaim idempoten** |
| `pushMataKuliahBaruToFeeder` | Mata Kuliah | Insert | `InsertMataKuliah` | kode, nama, SKS | `Course` `feederId: null` | `Course.feederId` | Cek `feederId IS NULL` saja; **tidak ada klaim idempoten** |
| `pushKelasKuliahBaruToFeeder` | Kelas Kuliah + Dosen Pengajar | Insert | `InsertKelasKuliah`, `InsertDosenPengajarKelasKuliah` | id kelas, jadwal, dosen pengampu | `CourseClass` `feederId: null` | `CourseClass.feederId` | Cek `feederId IS NULL` saja; **tidak ada klaim idempoten** |
| `pushKrsToFeeder` | KRS | Insert | `GetDetailNilaiPerkuliahanKelas` (cek dulu), `InsertPesertaKelasKuliah` | id kelas + id registrasi mahasiswa | `CourseEnrollment` `status: 'APPROVED', feederSyncedAt: null, courseClass.feederId not null, student.feederRegistrationId not null` (`:5324-5332`) | `CourseEnrollment.feederSyncedAt` (penanda, bukan ID Feeder terpisah) | Cek ganda ke Feeder dulu (GetDetail) sebelum insert, tangani error `119` ("sudah ada") sebagai sukses-tautkan; **klaim idempoten** (`claimFeederSync('CourseEnrollment', id, 'INSERT_KRS')`, `:5346`) |
| `pushNilaiToFeeder` | Nilai | Update | `UpdateNilaiPerkuliahanKelas` | nilai huruf/angka/indeks (string, bukan angka — lihat catatan di kode) | `CourseEnrollment` `gradeStatus: 'FINAL', gradeLetter not null, feederSyncedAt not null, feederGradeSyncedAt: null` | `CourseEnrollment.feederGradeSyncedAt` | Filter `gradeStatus: 'FINAL'` di query — **nilai DRAFT tidak pernah masuk kandidat kirim** (lihat §6); **klaim idempoten** (`claimFeederSync('CourseEnrollment', id, 'UPDATE_NILAI')`, `:5475`) |
| `pullKrsFromFeeder`/`syncKrsFromFeeder` | KRS | Get | `GetDetailNilaiPerkuliahanKelas` | — (baca saja) | `CourseEnrollment` | via `courseClass.feederId` + `student.feederRegistrationId` | — |
| `pullSkalaNilaiFromFeeder`/`syncSkalaNilaiFromFeeder` | Skala Nilai | Get | `GetListSkalaNilaiProdi` | — (baca saja) | `GradeScale`(?) — tidak diverifikasi ulang detailnya di audit ini | — | — |
| `pullTahunAkademikFromFeeder`/`syncTahunAkademikFromFeeder` | Tahun Akademik | Get | `GetSemester` | — (baca saja) | `AcademicYear` | — | — |

**Catatan jujur**: hanya **3 dari 7 alur push** (Mahasiswa, KRS, Nilai) yang punya klaim idempoten
(`FeederSyncLock`). **Kurikulum, Mata Kuliah, Kelas Kuliah** (3 alur Insert lain) masih murni mengandalkan
pengecekan `feederId IS NULL` di query — rentan terhadap duplikasi kalau dua proses push berjalan bersamaan,
persis seperti kondisi sebelum hardening dimulai. Ini sudah dilaporkan di `FEEDER_HARDENING_REPORT.md` §5 poin 4
dan **masih berlaku sama persis hari ini**, dikonfirmasi lewat pencarian `claimFeederSync` di seluruh file
(§3 tabel di atas, hanya 3 pasangan ditemukan, baris `3977/4186`, `5346/5398`, `5475/5516`).

---

## 4. Status Keamanan dan Reliability

| Komponen | Status | Bukti |
|---|---|---|
| **GetToken** | VERIFIED, ada | `getFeederToken()` (`:1752`) |
| **Token caching** | VERIFIED, ada | Cache in-memory per (baseUrl+username), TTL 5 menit (`:1748-1749`) |
| **Refresh token otomatis di tengah alur** | **NOT IMPLEMENTED (kode mati)** | `refreshFeederToken()` (`:1770`) dan `looksLikeExpiredFeederToken()` (`:1736`) **ada definisinya tapi NOL titik pemanggilan** di seluruh file (dicek ulang hari ini: `grep -c "refreshFeederToken(" → 1` — hanya definisinya sendiri). Tidak ada satu pun dari 26 alur pull/push yang memanggilnya. Ini infrastruktur yang dibangun tapi **tidak pernah dipakai runtime**. |
| **Retry & backoff** | VERIFIED, ada, teruji (mock) | `callFeeder()` (`:1676`), `isRetryableFeederError()` (`:1654`) — retry hanya untuk kegagalan jaringan/HTTP 5xx, **tidak pernah** untuk `error_code≠0` (sesuai permintaan asli: jangan retry kesalahan validasi) |
| **Idempotency — push Mahasiswa/KRS/Nilai** | VERIFIED, ada, teruji (concurrency nyata via `Promise.all`) | `FeederSyncLock`, dipakai di 3 titik (§3) |
| **Idempotency — push Kurikulum/Mata Kuliah/Kelas Kuliah** | **NOT IMPLEMENTED** | Tidak ada pemanggilan `claimFeederSync` di ketiga fungsi ini (dicek ulang hari ini) |
| **`runFeederSync()` (riwayat + rekonsiliasi otomatis)** | **DIBANGUN TAPI TIDAK PERNAH DIPAKAI** | `:320` — definisi ada, **NOL pemanggilan** di seluruh file (`grep -n "runFeederSync" → hanya baris 320 itu sendiri`). Ini **persis pertanyaan yang diminta audit ini**, dan jawabannya tegas: helper ini tersedia tapi tidak terintegrasi ke alur mana pun. Riwayat sukses/gagal untuk 3 alur push yang sudah punya `FeederSyncLog` ditulis **manual** (bukan lewat `runFeederSync`), lihat §6. |
| **Rekonsiliasi "Feeder sukses, simpan lokal gagal"** | **Hanya ada di `runFeederSync` yang tidak dipakai** | Karena `runFeederSync` tidak dipanggil, skenario ini **tidak tertangani** di 3 alur push yang sudah ada — kalau terjadi, jejaknya ambigu (terlihat seperti "belum pernah dicoba", bukan "mungkin sudah terkirim ke Feeder") |
| **Penanganan token kedaluwarsa** | **PARTIAL** | Cache TTL pendek (5 menit) mengurangi kemungkinan token basi dipakai *antar-alur*, tapi **tidak ada deteksi/pemulihan di tengah satu alur yang sedang berjalan** (lihat baris "Refresh token" di atas) |
| **Enkripsi kredensial** | VERIFIED, teruji terhadap data nyata | AES-256-GCM, kunci dari `JWT_SECRET`; diverifikasi bertahan setelah restart proses API sungguhan (`FEEDER_POST_HARDENING_REVIEW.md` §3) |
| **Risiko rotasi `JWT_SECRET`** | VERIFIED sebagai risiko nyata, sudah didokumentasikan | Kredensial Feeder tidak bisa didekripsi lagi kalau `JWT_SECRET` diganti tanpa prosedur migrasi; dokumentasi sudah ditambahkan ke `deploy/README.md` (`FEEDER_DATABASE_FINAL_REVIEW.md` §2) — **dokumentasi**, bukan mitigasi otomatis; belum ada skrip migrasi kunci |

---

## 5. Kelengkapan Pelaporan (per kelompok operasi)

| Operasi | Dibutuhkan? | Status | Catatan |
|---|---|---|---|
| Mahasiswa Lulus/DO (`InsertMahasiswaLulusDO`) | **Ya, wajib lapor** | **NOT IMPLEMENTED** | SIAKAD sudah punya modul Yudisium (`GraduationApplication`) dan status `GRADUATED`/`DROPOUT`, tapi tidak ada jalur ke Feeder. Gap paling signifikan secara kepatuhan (lihat `FEEDER_AUDIT_REPORT.md` §2 no.19, tidak berubah). |
| Penghapusan peserta kelas (`DeletePesertaKelasKuliah`) | Direkomendasikan | **NOT IMPLEMENTED** | Mahasiswa yang membatalkan KRS setelah terkirim ke Feeder tidak punya jalur penarikan. |
| Update Kurikulum (`UpdateKurikulum`) | Direkomendasikan | **NOT IMPLEMENTED** | Hanya Insert; perubahan kurikulum setelah di-push tidak tersinkron ulang. |
| Update Mata Kuliah (`UpdateMataKuliah`) | Direkomendasikan | **NOT IMPLEMENTED** | Sama seperti Kurikulum. |
| Aktivitas Mahasiswa (skripsi/TA/magang/KKN) | **Ya, wajib untuk kegiatan ber-SKS** | **NOT IMPLEMENTED sama sekali** | Prasyaratnya sendiri (`GetKategoriKegiatan`) juga belum dipanggil. SIAKAD sudah punya data lengkapnya (`ThesisSupervision`, modul Field Activity) secara lokal, nol jalur ke Feeder. |
| Anggota Aktivitas | Mengikuti di atas | **NOT IMPLEMENTED** | — |
| Bimbingan (`InsertBimbingMahasiswa`) | **Ya, untuk skripsi/TA** | **NOT IMPLEMENTED** | Data pembimbing (`ThesisSupervision.supervisor1/2`) sudah ada lokal, belum dilaporkan. |
| Dosen Penguji (`InsertUjiMahasiswa`) | Perlu konfirmasi | **NEEDS CONFIRMATION dokumentasi resmi** | Perlu dicek dulu apakah modul skripsi SIAKAD bahkan menyimpan data penguji sidang sama sekali — di luar lingkup audit ini untuk diverifikasi. |
| Aktivitas Kuliah Mahasiswa (status per semester) | Perlu konfirmasi | **PARTIAL** | `InsertPerkuliahanMahasiswa`/`UpdatePerkuliahanMahasiswa` SUDAH dipakai (lihat `FEEDER_AUDIT_REPORT.md` baris 43/45), tapi maknanya belum diverifikasi terhadap dokumentasi resmi (bisa jadi tertukar konsep dengan KRS biasa) — **NEEDS CONFIRMATION dokumentasi resmi**. |
| Aktivitas Ajar Dosen | Sudah cukup | **IMPLEMENTED** | `InsertDosenPengajarKelasKuliah`/`GetDosenPengajarKelasKuliah` dipakai di `pushKelasKuliahBaruToFeeder`. |
| Referensi & Skala Nilai | Sudah cukup | **IMPLEMENTED** | `GetListSkalaNilaiProdi`, `GetWilayah`, `GetSemester`, `GetJenisPendaftaran` semua dipakai. |

---

## 6. Temuan Inkonsistensi Data (snapshot database lokal saat ini, bukan produksi)

Angka di bawah dari database dev lokal (`siakad_premium`), dibaca ulang hari ini, **bukan representasi data
produksi kampus mana pun**:

| Pemeriksaan | Hasil | Arti |
|---|---|---|
| Mahasiswa tanpa `feederId` | 10 dari 1.708 (≈0,6%) | Kecil, kemungkinan mahasiswa baru/belum di-push |
| Dosen tanpa `feederId` | 5 dari 54 (≈9%) | Lebih tinggi proporsinya dari mahasiswa, belum jelas penyebabnya — di luar lingkup audit ini untuk diselidiki |
| Mata kuliah tanpa `feederId` | 4 dari 549 | Kecil |
| Kelas tanpa `feederId` | 1 dari 2.354 | Dapat diabaikan |
| **Nilai FINAL siap kirim tapi belum terkirim** (`gradeStatus='FINAL'`, `feederSyncedAt` ada, `feederGradeSyncedAt` kosong) | **1.794** | Backlog nyata — bukan risiko data salah, murni belum di-push. Push manual via UI akan memprosesnya. |
| **Anomali: nilai berstatus bukan FINAL tapi `feederGradeSyncedAt` terisi** | **0** | **Tidak ditemukan** — artinya tidak pernah ada kebocoran nilai DRAFT yang terkirim ke Feeder sampai saat ini di database ini. Risiko "nilai belum FINAL terkirim ke Feeder" yang diminta diperiksa di tugas ini: **tidak terbukti terjadi**, dan secara desain query (`pushNilaiToFeeder` memfilter `gradeStatus: 'FINAL'` sebelum membentuk daftar kandidat) **tidak mungkin terjadi lewat jalur normal** kecuali `gradeStatus` diubah manual langsung di database di luar aplikasi. |
| Baris `FeederSyncLog`/`FeederSyncLock` saat ini | 0 / 0 | Wajar — belum ada push sungguhan dijalankan terhadap database ini sejak hardening dipasang; tabel kosong bukan tanda kerusakan. |

**Mekanisme deteksi data tidak cocok (Feeder vs lokal)**: ada 3 fungsi `compare*` (`compareRiwayatPendidikan`
`:908`, `compareAkm` `:1227`, `compareMahasiswaWithFeeder` `:4257`) yang membandingkan data lokal terhadap Feeder
**atas permintaan admin** (tombol di UI) — **bukan proses otomatis berkala**. Tidak ada mekanisme yang mendeteksi
drift secara proaktif; admin harus membuka halaman dan memicu perbandingan secara manual.

**Potensi duplikasi**: untuk Mahasiswa/KRS, pola kode sudah secara eksplisit mengecek ke Feeder dulu sebelum
insert (hindari duplikat by NIM/NIK untuk mahasiswa, by GetDetail untuk KRS) — ini mekanisme pencegahan duplikasi
di level **konten**, terpisah dari klaim idempoten di level **concurrency** (§4). Untuk Kurikulum/Mata
Kuliah/Kelas Kuliah, **tidak ada pengecekan isi serupa** — hanya `feederId IS NULL`, jadi kalau Feeder sendiri
punya data yang cocok secara konten tapi `feederId` lokalnya kosong (mis. akibat race condition sebelum
hardening ini), push ulang berpotensi membuat duplikat di Feeder. Ini belum diuji langsung (butuh server Feeder).

---

## 7. Monitoring dan Operasional

| Kemampuan yang diminta diperiksa | Tersedia? | Bukti |
|---|---|---|
| Melihat status sinkronisasi | **PARTIAL** | `getPddiktiConnectionStatus()` ada (status koneksi), tapi status per-entitas (berapa % tersinkron) tersebar di berbagai endpoint `*/pending` berbeda-beda, tidak dalam satu dashboard |
| Melihat riwayat setiap pengiriman | **PARTIAL** | `GET pddikti/sync-log/stats` ada di API (`controller.ts:476`), **tapi tidak ada di frontend** — dicek `FeederPushPanel.tsx`: nol referensi ke endpoint ini. Admin **tidak bisa melihatnya lewat UI** sampai ada yang menyambungkan. |
| Mengetahui data yang gagal | VERIFIED, ada | `failReasons` dikembalikan tiap fungsi push (dikelompokkan per alasan), ditampilkan di pesan hasil push |
| Melihat alasan kegagalan | VERIFIED, ada | Sama seperti di atas; juga tersimpan di kolom `feederSyncError`/`feederGradeSyncError` per-baris |
| Mengulang pengiriman dengan aman | VERIFIED untuk 3 alur (Mahasiswa/KRS/Nilai), **tidak terjamin untuk 3 alur lain** | Endpoint push yang sama bisa dipanggil ulang; untuk 3 alur dengan klaim idempoten, aman dari duplikasi concurrent; untuk Kurikulum/Mata Kuliah/Kelas Kuliah, aman dari duplikasi **berurutan** (karena filter `feederId IS NULL`) tapi **tidak** dari duplikasi **bersamaan** (§4) |
| Jumlah berhasil/gagal/dilewati/belum diproses | VERIFIED, ada per-respons push (`processed`, `created`, `linked`, `failed`, `skipped`, `failReasons`), **tapi tidak ada akumulasi historis di UI** (tiap respons hanya mencerminkan satu kali jalan, bukan status kumulatif) |
| Melepas klaim macet (operasional baru) | VERIFIED, ada di API, **tidak ada di frontend** | `POST pddikti/sync-log/release-stale-locks` (`controller.ts:486`) — sama seperti stats, hanya bisa dipanggil langsung via API, belum ada tombolnya di UI |

**Kesimpulan §7**: kemampuan *backend*-nya lengkap untuk observability dasar, tapi **dua fitur hardening terbaru
(sync-log stats, release stale locks) belum tersambung ke antarmuka admin** — fungsional lewat API/Postman, tidak
lewat UI SIAKAD. Ini bukan bug, murni pekerjaan lanjutan yang belum dikerjakan.

---

## 8. Hasil Pengujian

**Tidak ada test otomatis yang tersimpan di repository ini saat ini** — dicek: `find ... -iname "*feeder*test*" -o
-iname "*feeder*.spec.ts"` → **nol hasil**. Seluruh pengujian yang pernah dilakukan sepanjang rangkaian audit ini
(41 assertion untuk hardening, 25 assertion untuk logbook di sesi sebelumnya, dst.) dijalankan sebagai **skrip
sementara** terhadap **database PostgreSQL sementara** (dibuat dari template, dihapus setelah selesai) — **tidak
pernah menjadi bagian permanen dari codebase**, dan tidak bisa dijalankan ulang sekarang tanpa menulis ulang
skrip itu. Ini bukan test suite CI yang bisa diandalkan untuk regresi masa depan.

| Jenis | Status | Catatan |
|---|---|---|
| Unit test (tersimpan di repo) | **TIDAK ADA** | — |
| Integration test (tersimpan di repo) | **TIDAK ADA** | — |
| Mock test (pernah dijalankan, sesi ini) | **Sudah dilakukan, tidak permanen** | `FEEDER_HARDENING_REPORT.md` §4: 41 assertion, mock `fetch`, database sementara |
| Pengujian concurrency | **Sudah dilakukan, tidak permanen** | `Promise.all` nyata untuk klaim idempoten (3 klaim bersamaan → 1 menang) — hasil terdokumentasi, kode uji sudah dihapus |
| Pengujian terhadap Feeder sungguhan | **NEEDS LIVE TEST — belum pernah dilakukan sama sekali** | Tidak ada server Feeder yang bisa dijangkau dari lingkungan kerja mana pun sepanjang seluruh rangkaian audit ini (dikonfirmasi berulang kali, termasuk hari ini: `pddikti_settings.baseUrl` menunjuk `localhost:8100`, tidak merespons) |

**Rekomendasi langsung**: pengujian paling bernilai yang belum dilakukan adalah menjadikan skrip uji hardening
(yang sudah terbukti bekerja dengan 41 assertion lulus) menjadi test file permanen (`*.spec.ts`) di repo, supaya
regresi di masa depan terdeteksi otomatis. Ini **tidak saya lakukan di audit ini** (di luar lingkup "hanya audit").

---

## 9. Daftar Gap Berdasarkan Prioritas

**P0 — fundamental, langsung berdampak kepatuhan pelaporan:**
- `InsertMahasiswaLulusDO` tidak ada sama sekali (§5).
- 4 dari 7 alur push (Kurikulum, Mata Kuliah, Kelas Kuliah — idempotency; Nilai — rekonsiliasi lewat
  `runFeederSync`) punya gap keandalan yang sudah diketahui tapi belum ditutup (§3, §4).

**P1 — akademik, berdampak pada data yang sudah berjalan:**
- `runFeederSync()` tidak dipakai di 3 alur push yang sudah ada (§4) — menutup gap ini berarti menyambungkan
  helper yang sudah ada dan teruji, bukan menulis baru.
- `DeletePesertaKelasKuliah` tidak ada (§5).
- `UpdateKurikulum`/`UpdateMataKuliah` tidak ada (§5).
- Idempotency untuk Kurikulum/Mata Kuliah/Kelas Kuliah/Dosen Pengajar (§3, §4) — pola sudah ada contohnya di 3
  alur lain, risiko implementasi rendah.
- Sambungkan `sync-log/stats` dan `release-stale-locks` ke UI admin (§7) — backend sudah siap, murni kerja
  frontend.

**P2 — aktivitas akademik, kelompok paling kosong:**
- `GetKategoriKegiatan` → `InsertAktivitasMahasiswa` → `InsertAnggotaAktivitasMahasiswa` → `InsertBimbingMahasiswa`
  → `InsertUjiMahasiswa` (urutan prasyarat, §5) — **sudah diputuskan ditunda** sampai ada server Feeder test yang
  jelas (keputusan dari sesi sebelumnya, masih berlaku).
- Refresh token otomatis di tengah alur panjang (§4) — butuh keputusan arsitektur dulu (cara mengubah pola
  `const token` di 26 titik pemanggilan), bukan sekadar menyambungkan kode yang sudah ada seperti `runFeederSync`.

---

## 10. Rekomendasi Urutan Implementasi

Murni urutan yang disarankan — **tidak ada yang dijalankan di audit ini**:

1. **Sambungkan `runFeederSync()` ke `pushNilaiToFeeder` dulu** (bukan ketiga alur sekaligus) — risiko paling
   rendah (operasi Update, bukan Insert, jadi rekonsiliasi lebih sederhana), dan langsung menutup gap P1 paling
   murah.
2. **Tambahkan klaim idempoten ke Kurikulum/Mata Kuliah/Kelas Kuliah** — pola sudah ada contohnya persis di kode
   yang sama (§3), bisa disalin dengan penyesuaian nama entitas.
3. **Implementasikan `InsertMahasiswaLulusDO`** — data sumbernya (modul Yudisium) sudah ada, kerja utamanya
   memetakan field dan menambah fungsi push baru mengikuti pola yang sudah terbukti di `pushMahasiswaBaruToFeeder`.
4. **Sambungkan `sync-log/stats` dan `release-stale-locks` ke UI** — murni kerja frontend, tidak menyentuh logika
   backend yang sudah teruji.
5. **Baru setelah itu**, dan baru kalau ada server Feeder test yang bisa diakses: kerjakan kelompok Aktivitas
   Mahasiswa (P2) dan keputusan arsitektur refresh token (P2) — keduanya butuh verifikasi terhadap server
   sungguhan sebelum dianggap selesai, bukan sekadar menulis kode.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
