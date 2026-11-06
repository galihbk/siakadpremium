# Audit Integrasi API Neo Feeder — SIAKAD Premium

Tanggal: 2026-11-05
Lingkup: `apps/api/src/modules/integration-settings/` (service ~5.5rb baris, controller, DTO), skema `PddiktiSetting` di `packages/database/prisma/schema.prisma`.

## 0. Batasan audit ini (baca dulu)

- **Dokumentasi resmi tidak bisa diakses dari lingkungan ini.** Domain `pddikti-admin.kemdikbud.go.id` (yang menghosting "User Guide Web Service v2.2") gagal di-resolve DNS. Rujukan dokumentasi di laporan ini berasal dari cuplikan hasil pencarian web (judul dokumen, nomor bagian), **bukan dari isi lengkap PDF**. Beberapa hal — terutama field request/response persis, dan apakah ada versi dokumentasi yang lebih baru dari 2019 — tidak bisa saya pastikan dari sini.
- **Tidak ada server Neo Feeder yang bisa dijangkau untuk testing live.** `pddikti_settings.baseUrl` di database lokal menunjuk ke `http://localhost:8100/ws/live2.php`, yang tidak merespons dari lingkungan kerja saya sekarang. Karena itu **seluruh baris di tabel inventaris berstatus Hasil Testing = NOT TESTED**, tanpa kecuali. Saya tidak mengklaim PASS untuk apa pun yang belum benar-benar saya panggil dan lihat responsnya.
- Audit ini murni membaca kode yang sudah ada (service, controller, DTO, skema Prisma) dan hasil query ke database lokal (jumlah baris, kolom `feederId`/`feederSyncedAt`, dsb.) yang sudah dikumpulkan sebelumnya dalam percakapan ini. Tidak ada kode, database, atau konfigurasi yang diubah.

## 1. Ringkasan kesiapan

SIAKAD Premium **tidak mengimplementasikan 54 fungsi Neo Feeder sebagai wrapper generik 1:1**. Yang ada adalah ~16 alur sinkronisasi tingkat-tinggi (pull + sync + push) yang dibangun di atas sekitar **34 pemanggilan `act` Feeder** berbeda, mencakup Prodi, Dosen, Mahasiswa, Riwayat Pendidikan, Kurikulum, Mata Kuliah, Kelas Kuliah, KRS/Peserta Kelas, Nilai, Skala Nilai, Tahun Akademik, dan referensi (Wilayah, Semester, Jenis Pendaftaran). Mahasiswa di-pull lewat `GetListRiwayatPendidikanMahasiswa` lalu diperkaya `GetBiodataMahasiswa`, bukan lewat `GetListMahasiswa` (nama itu tidak dipakai di kode — lihat catatan di bagian 3).

**Tidak diimplementasikan sama sekali**: seluruh kelompok Aktivitas Mahasiswa (skripsi/kegiatan lapangan sebagai aktivitas PDDikti), Anggota Aktivitas, Bimbingan Mahasiswa, Dosen Penguji, Aktivitas Kuliah Mahasiswa (cuti/aktif per semester), Aktivitas Ajar Dosen, Mahasiswa Lulus/DO, Transkrip, Export, dan sebagian besar fungsi Delete. Ini konsisten dengan temuan sebelumnya di percakapan ini: skripsi dan kegiatan lapangan lokal direpresentasikan sebagai `CourseEnrollment`/`ThesisSupervision` tanpa jalur ke Feeder sebagai Aktivitas Mahasiswa.

Database lokal (snapshot sebelumnya di sesi ini) menunjukkan sinkronisasi **sudah berjalan nyata**, bukan sekadar kode yang belum pernah dipakai: 1.698/1.708 mahasiswa, 545/549 mata kuliah, 2.353/2.354 kelas punya `feederId`; 58.842 KRS dan 52.743 nilai sudah bertanda terkirim/tertaut. Tapi ini data historis dari server Feeder yang pernah dipakai sebelumnya, bukan bukti bahwa panggilan API saat ini — di server `localhost:8100` yang sekarang dikonfigurasi — masih berfungsi.

## 2. Inventaris 54 endpoint

Implementasi: **IMPLEMENTED** (dipanggil di kode, alur lengkap) / **PARTIAL** (dipanggil tapi dengan keterbatasan yang didokumentasikan di komentar kode sendiri, atau dipakai untuk tujuan lain dari namanya) / **NOT IMPLEMENTED** (tidak ada pemanggilan `act` ini sama sekali).
Testing: seluruhnya **NOT TESTED** (lihat bagian 0).
Kebutuhan: dinilai terhadap kewajiban pelaporan PDDikti (data wajib lapor tiap semester) dan terhadap modul SIAKAD yang sudah ada.

| No | Endpoint | Implementasi | Testing | Kebutuhan | Catatan |
|---|---|---|---|---|---|
| 1 | GetToken | IMPLEMENTED | NOT TESTED | REQUIRED | `getFeederToken()`, dipakai di semua alur sebagai langkah pertama. |
| 2 | GetDictionary | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Hanya disebut di komentar kode sebagai acuan field Insert; tidak pernah dipanggil runtime. |
| 3 | GetPeriode | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tahun akademik ditarik lewat `GetSemester`, bukan `GetPeriode` — lihat baris 53. |
| 4 | GetAllPT | IMPLEMENTED | NOT TESTED | RECOMMENDED | Dipakai di alur pencarian PT (mis. untuk PMB/riwayat pendidikan asal). |
| 5 | GetProfilPT | IMPLEMENTED | NOT TESTED | OPTIONAL | Dipanggil sekali di `pullProdiFromFeeder`-related flow (baris ~3597) untuk info PT sendiri. |
| 6 | GetCountPerguruanTinggi | NOT IMPLEMENTED | NOT TESTED | NOT NEEDED | Tidak dipakai; fungsi hitung saja, tidak kritikal. |
| 7 | GetAllProdi | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Beda dari `GetProdi` (yang dipakai); kemungkinan nama lama/alias. |
| 8 | GetProdi | IMPLEMENTED | NOT TESTED | REQUIRED | `pullProdiFromFeeder`/`syncProdiFromFeeder`. Catatan jujur di kode sendiri: respons tidak berisi fakultas/akreditasi, field itu tetap dari data lokal. |
| 9 | GetCountProdi | NOT IMPLEMENTED | NOT TESTED | NOT NEEDED | Tidak dipakai. |
| 10 | GetListMahasiswa | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Daftar mahasiswa ditarik lewat `GetListRiwayatPendidikanMahasiswa`, bukan fungsi ini. Lihat bagian 3 soal kemungkinan nama ini tidak ada di API resmi. |
| 11 | GetBiodataMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Dipanggil berulang (5 titik) untuk memperkaya data per-ID dan per-batch. |
| 12 | InsertBiodataMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | `pushMahasiswaBaruToFeeder`. |
| 13 | UpdateBiodataMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Dipanggil di alur push/update mahasiswa. |
| 14 | DeleteBiodataMahasiswa | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak ada jalur hapus mahasiswa ke Feeder dari SIAKAD — masuk akal karena menghapus data resmi mahasiswa berisiko tinggi dan jarang dilakukan. |
| 15 | InsertRiwayatPendidikanMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Bagian dari `pushMahasiswaBaruToFeeder` (registrasi semester/riwayat pendidikan). |
| 16 | DeleteRiwayatPendidikanMahasiswa | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak ada jalur hapus. |
| 17 | UpdateRiwayatPendidikanMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | 3 titik pemanggilan, termasuk alur update status/semester. |
| 18 | GetListRiwayatPendidikanMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Sumber utama daftar mahasiswa (lihat No. 10), dipakai 8× di kode. |
| 19 | InsertMahasiswaLulusDO | NOT IMPLEMENTED | NOT TESTED | REQUIRED | **Gap signifikan.** Tidak ada jalur pelaporan kelulusan/DO ke Feeder meski SIAKAD punya modul Yudisium (`GraduationApplication`) dan status `GRADUATED`/`DROPOUT` di `Student`. Lihat bagian 6. |
| 20 | UpdateKurikulum | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Hanya Insert kurikulum yang ada; tidak ada jalur update kurikulum yang sudah di-push. |
| 21 | InsertKurikulum | IMPLEMENTED | NOT TESTED | REQUIRED | `pushKurikulumBaruToFeeder`. |
| 22 | DeleteKurikulum | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak ada jalur hapus. |
| 23 | GetListMataKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | `pullMataKuliahFromFeeder`, diperkaya `GetMatkulKurikulum`. |
| 24 | InsertMataKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | `pushMataKuliahBaruToFeeder`. |
| 25 | UpdateMataKuliah | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Tidak ada jalur update mata kuliah yang sudah ter-link; perubahan SKS/nama setelah push tidak tersinkron ulang. |
| 26 | DeleteMataKuliah | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak ada jalur hapus. |
| 27 | InsertKelasKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | `pushKelasKuliahBaruToFeeder`. |
| 28 | GetListKelasKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | `pullKelasKuliahFromFeeder`. |
| 29 | GetDetailKelasKuliah | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | List sudah dipakai; detail per-kelas tidak diperlukan terpisah untuk alur yang ada. |
| 30 | InsertPesertaKelasKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | Bagian dari `pushKrsToFeeder` (KRS = peserta kelas). |
| 31 | UpdateNilaiPerkuliahanKelas | IMPLEMENTED | NOT TESTED | REQUIRED | `pushNilaiToFeeder`. |
| 32 | DeletePesertaKelasKuliah | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | **Gap**: mahasiswa yang membatalkan KRS (drop mata kuliah) setelah terkirim ke Feeder tidak punya jalur penarikan. Berisiko data KRS di PDDikti "menggantung". |
| 33 | GetDetailNilaiPerkuliahanKelas | IMPLEMENTED | NOT TESTED | REQUIRED | `pullKrsFromFeeder`/pencocokan nilai, 4 titik pemanggilan. |
| 34 | InsertAktivitasMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | **Gap besar.** Ini mekanisme resmi PDDikti untuk skripsi/TA/magang/KKN sebagai partisipasi non-kelas. SIAKAD sudah punya data lengkapnya (`ThesisSupervision`, modul Field Activity) tapi tidak ada jalur ke Feeder. Sudah diidentifikasi sebelumnya dalam audit terpisah di sesi ini sebagai "langkah 2" yang belum dikerjakan. |
| 35 | UpdateAktivitasMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | Mengikuti No. 34. |
| 36 | GetListAktivitasMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | Mengikuti No. 34. |
| 37 | InsertAnggotaAktivitasMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | Untuk aktivitas kelompok (mis. KKN/magang berkelompok) — SIAKAD sudah punya `FieldGroup`/anggota kelompok secara lokal. |
| 38 | DeleteAnggotaAktivitasMahasiswa | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Mengikuti No. 37. |
| 39 | InsertBimbingMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | Pembimbingan skripsi (`ThesisSupervision`, supervisor1/2) sudah ada datanya secara lokal, tidak dilaporkan ke Feeder. |
| 40 | DeleteBimbingMahasiswa | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Mengikuti No. 39 (ganti pembimbing). |
| 41 | GetListBimbingMahasiswa | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Mengikuti No. 39. |
| 42 | InsertUjiMahasiswa | NOT IMPLEMENTED | NOT TESTED | REQUIRED | Dosen penguji sidang skripsi/TA — tidak ada representasi lokal maupun jalur Feeder. Perlu dicek dulu apakah modul skripsi SIAKAD menyimpan data penguji sama sekali. |
| 43 | InsertPerkuliahanMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Dipakai 2×, kemungkinan untuk status her-registrasi/cuti per semester (nama fungsi ini di dokumentasi resmi berarti "status mahasiswa per semester", bukan nilai kelas — perlu verifikasi dokumentasi karena berpotensi tertukar konsep dengan No. 30–33). |
| 44 | DeletePerkuliahanMahasiswa | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak ada jalur hapus. |
| 45 | UpdatePerkuliahanMahasiswa | IMPLEMENTED | NOT TESTED | REQUIRED | Dipakai 2×, pasangan dari No. 43. |
| 46 | InsertDosenPengajarKelasKuliah | IMPLEMENTED | NOT TESTED | REQUIRED | Melaporkan dosen pengampu kelas ke Feeder. |
| 47 | GetDosenPengajarKelasKuliah | IMPLEMENTED | NOT TESTED | RECOMMENDED | Verifikasi dosen pengajar yang sudah tercatat di Feeder. |
| 48 | GetPembiayaan | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Referensi skema pembiayaan mahasiswa — tidak kritikal untuk alur akademik inti. |
| 49 | GetKategoriKegiatan | NOT IMPLEMENTED | NOT TESTED | REQUIRED | **Prasyarat** untuk No. 34–38: Aktivitas Mahasiswa butuh kategori kegiatan resmi dari Feeder (skripsi/magang/KKN/dll. punya kode baku). Tanpa ini, Insert Aktivitas Mahasiswa tidak bisa dipetakan dengan benar. |
| 50 | GetJenisPendaftaran | IMPLEMENTED | NOT TESTED | RECOMMENDED | Dipakai di alur referensi (baris 3419), kemungkinan untuk jalur masuk mahasiswa baru. |
| 51 | ExportDataMahasiswa | NOT IMPLEMENTED | NOT TESTED | OPTIONAL | Tidak dipakai; fungsi ekspor massal, bisa digantikan kombinasi Get* yang sudah ada. |
| 52 | GetListDosen | IMPLEMENTED | NOT TESTED | REQUIRED | `pullDosenFromFeeder`. |
| 53 | DetailBiodataDosen | IMPLEMENTED | NOT TESTED | REQUIRED | Dipanggil per-dosen untuk melengkapi biodata (3 titik). |
| 54 | GetTranskripMahasiswa | NOT IMPLEMENTED | NOT TESTED | RECOMMENDED | Tidak dipakai; SIAKAD sudah generate transkrip dari data nilai lokal (`CourseEnrollment`), jadi ini lebih untuk verifikasi silang dengan PDDikti daripada kebutuhan operasional harian. |

**Catatan tambahan di luar daftar**: kode juga memanggil `GetWilayah` (2×), `GetSemester` (3×, dipakai untuk tahun akademik — bukan `GetPeriode`), `GetMatkulKurikulum` (2×), `GetListKurikulum` (3×), `GetListPenugasanDosen` (3×), `GetListSkalaNilaiProdi` (2×), `GetPesertaKelasKuliah` (2×), dan `GetListNilaiPerkuliahanKelas` (4×). Nama-nama ini **tidak ada** di checklist 54 endpoint yang kamu berikan — kemungkinan checklist itu memakai penamaan yang sedikit berbeda dari API yang sebenarnya diimplementasikan di repo, atau ada fungsi Feeder lain di luar daftar yang dipakai. Ini perlu dicocokkan ke `GetDictionary` sungguhan (lihat bagian 3) sebelum dipercaya sepenuhnya.

## 3. Masalah yang ditemukan dalam audit kode (bukan hasil testing)

1. **Tidak ada satu pun baris kode yang memanggil `GetDictionary`.** Ini fungsi yang menurut dokumentasi memberi daftar field resmi tiap `act`. Komentar di kode sendiri (baris ~2277) menyebut "field & act mengikuti GetDictionary('InsertKurikulum')" — artinya field-nya ditentukan dengan membaca dokumentasi/GetDictionary secara manual saat development, bukan divalidasi otomatis saat runtime. Risikonya: kalau Feeder mengubah skema field suatu `act`, SIAKAD tidak akan tahu sampai Insert/Update gagal di produksi.
2. **Tidak ada mekanisme retry atau backoff.** `callFeeder()` (baris 1438) melakukan satu kali `fetch` dengan timeout, lalu melempar error kalau respons bukan JSON valid. Tidak ada percobaan ulang untuk kegagalan jaringan sementara.
3. **Tidak ada tabel riwayat sinkronisasi (sync history/log) di skema Prisma.** Jejak sinkronisasi hanya tersimpan sebagai kolom `feederSyncedAt`/`feederSyncError`/`feederGradeSyncedAt`/`feederGradeSyncError` langsung di tabel data (`Student`, `CourseEnrollment`, dst.), bukan sebagai log terpisah yang bisa diaudit per-kejadian (kapan, oleh siapa, apa isi payload-nya, apa respons errornya persis).
4. **Tidak ada penguncian idempoten eksplisit** (misal transaksi database + flag "sedang diproses") pada alur push — kalau dua request push dijalankan bersamaan (dua tab admin dibuka), berpotensi mengirim data yang sama dua kali ke Feeder sebelum `feederId` tersimpan. Saya tidak menemukan unique constraint database yang mencegah ini di level race-condition, hanya pengecekan `feederId IS NULL` di query sebelum push.
5. **Akses endpoint**: controller mewajibkan `SUPER_ADMIN` untuk sebagian besar rute, dengan pengecualian beberapa rute `GET` untuk `ADMIN_BAAK`/`STAFF` (baris 51, 58). Ini wajar untuk fitur sesensitif ini.
6. **Credential tersimpan sebagai teks biasa** di `PddiktiSetting.password`/`secretKey` (tidak terlihat enkripsi di skema Prisma). Saya tidak memverifikasi apakah ada enkripsi di level aplikasi (service) karena di luar lingkup grep yang saya lakukan — perlu dicek terpisah sebelum laporan ini dianggap final soal keamanan.

## 4. Kebutuhan vs. kesiapan — ringkasan per kelompok fungsional

| Kelompok | Status implementasi | Dampak bila tidak dikerjakan |
|---|---|---|
| Autentikasi & referensi dasar (PT, Prodi, Wilayah, Semester) | Siap, sudah berjalan | — |
| Mahasiswa & riwayat pendidikan | Siap, mayoritas berjalan (lihat gap Lulus/DO) | Mahasiswa lulus/DO tidak terlaporkan resmi — **berisiko kepatuhan pelaporan PDDikti**, bukan cuma fitur hilang. |
| Dosen | Siap, berjalan | — |
| Kurikulum & Mata Kuliah | Siap untuk insert; update/delete tidak ada | Perubahan kurikulum setelah terlanjur di-push tidak tersinkron; manual workaround diperlukan. |
| Kelas Kuliah, KRS, Nilai | Siap, mayoritas berjalan (lihat gap delete peserta) | Pembatalan KRS tidak tertarik kembali di Feeder. |
| Aktivitas Mahasiswa (skripsi/TA/magang/KKN), Bimbingan, Penguji | **Tidak diimplementasikan sama sekali** | Ini kelompok terbesar yang kosong. Skripsi dan kegiatan lapangan di SIAKAD saat ini sepenuhnya lokal — sudah dikonfirmasi di audit sebelumnya dalam sesi ini. Kalau kampus wajib lapor PDDikti untuk TA/magang sebagai Aktivitas Mahasiswa (ini memang ketentuan PDDikti, bukan opsional, untuk kegiatan yang mengandung SKS/konversi nilai), ini **gap kepatuhan**, bukan sekadar fitur tambahan. |
| Aktivitas Ajar Dosen | Siap (Insert+Get) | — |
| Transkrip & Export | Tidak diimplementasikan | Rendah dampak — SIAKAD sudah generate transkrip lokal. |

## 5. Roadmap yang disarankan

**P0 — sudah tercapai**, tidak perlu kerja tambahan untuk kelompok ini: token, PT/Prodi, Dosen, Mahasiswa+Riwayat Pendidikan (kecuali Lulus/DO).

**P1 — celah pada fungsi akademik yang sudah berjalan sebagian:**
- `InsertMahasiswaLulusDO` — pelaporan kelulusan/DO resmi. Prioritas tinggi karena menyangkut kewajiban pelaporan, dan SIAKAD sudah punya modul Yudisium yang datanya siap dipetakan.
- `DeletePesertaKelasKuliah` — penarikan KRS yang dibatalkan.
- `UpdateMataKuliah`, `UpdateKurikulum` — sinkronisasi perubahan setelah push awal.

**P2 — Aktivitas Akademik (kelompok paling kosong):**
- `GetKategoriKegiatan` dulu (referensi wajib sebelum bisa insert aktivitas dengan kode kategori yang benar), lalu `InsertAktivitasMahasiswa`/`UpdateAktivitasMahasiswa`/`GetListAktivitasMahasiswa`, lalu `InsertAnggotaAktivitasMahasiswa` untuk kegiatan kelompok, lalu `InsertBimbingMahasiswa`/`GetListBimbingMahasiswa` untuk pembimbing, lalu `InsertUjiMahasiswa` untuk penguji.
- Ini sudah sempat dibahas di sesi ini sebagai "langkah 2" Feeder dan ditunda karena server Feeder yang dipakai sekarang bersifat lokal/uji, bukan produksi — jadi kerja ini sebaiknya tetap ditunda sampai ada server Feeder sungguhan untuk diuji, sesuai keputusan sebelumnya.

**Tidak direkomendasikan untuk dikerjakan** kecuali ada kebutuhan spesifik: `ExportDataMahasiswa`, `GetTranskripMahasiswa`, `GetCountPerguruanTinggi`, `GetCountProdi`, `DeleteBiodataMahasiswa`, `DeleteRiwayatPendidikanMahasiswa`, `DeleteKurikulum`, `DeleteMataKuliah`, `DeletePerkuliahanMahasiswa`, `GetDetailKelasKuliah`, `GetPembiayaan`.

## 6. Test case yang tidak bisa diselesaikan di audit ini

Semua butuh server Neo Feeder yang bisa dijangkau (test/sandbox atau produksi dengan kredensial valid) — tidak ada satu pun yang bisa dijalankan dari lingkungan kerja saya:

1. `GetToken` dengan kredensial tersimpan di `pddikti_settings` — memverifikasi baseUrl/username/password masih valid.
2. Seluruh 16 fungsi `Get*`/`pull*` yang IMPLEMENTED — memverifikasi struktur respons JSON masih cocok dengan asumsi parsing di kode (field seperti `id_prodi`, `kode_program_studi`, dst.).
3. Validasi payload tiap `Insert*`/`Update*` terhadap `GetDictionary` sungguhan — tidak bisa dilakukan karena `GetDictionary` sendiri tidak pernah dipanggil di kode maupun di audit ini.
4. Uji error handling untuk kasus token kedaluwarsa, rate limit, dan field yang ditolak Feeder (error_code ≠ 0) — perlu server sungguhan dan skenario gagal yang disengaja.
5. Verifikasi dokumentasi resmi v2.2 (atau versi lebih baru bila ada) untuk memastikan 24 nama fungsi yang dipakai kode (`GetWilayah`, `GetSemester`, `GetMatkulKurikulum`, `GetListKurikulum`, `GetListPenugasanDosen`, `GetListSkalaNilaiProdi`, `GetPesertaKelasKuliah`, `GetListNilaiPerkuliahanKelas`, dst.) memang nama resmi dan bukan hasil asumsi saat development — PDF resminya tidak bisa saya akses dari sini.

## 7. Yang saya sarankan sebagai langkah berikutnya

Tidak ada kode yang saya ubah di audit ini, sesuai instruksi. Kalau mau lanjut:
- Paling murah dan paling aman: minta siapa pun yang punya akses jaringan ke `pddikti-admin.kemdikbud.go.id` mengunduh PDF User Guide v2.2 dan membagikannya sebagai file lokal, supaya bagian 3 dan 6 di laporan ini bisa diverifikasi dengan dokumentasi sungguhan, bukan cuplikan pencarian.
- Testing live baru bisa dimulai setelah ada server Feeder (test atau produksi) yang bisa dijangkau dari lingkungan kerja — ini sejalan dengan keputusan sebelumnya di sesi ini untuk menunda pekerjaan Aktivitas Mahasiswa sampai ada server Feeder test yang jelas.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
