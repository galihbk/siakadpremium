# Audit Environment Neo Feeder Lokal (`feeder` / `dbpddikti`)

Tanggal: 2026-11-05
Tindak lanjut dari `FEEDER_PHASE_3_IMPLEMENTATION_REPORT.md` (bagian koreksi: server Feeder ternyata bisa
dijangkau). **Murni read-only**: tidak ada operasi tulis ke Feeder, tidak ada kredensial baru dicoba, tidak ada
konfigurasi/container/database/file proyek yang diubah. Tidak ada username, password, token, atau kredensial
lain yang ditampilkan di laporan ini -- semua nilai env diperiksa hanya sebagai **nama variabel**, bukan isinya.

## Identitas Environment

| Hal | Nilai |
|---|---|
| Nama container aplikasi | `feeder` (image `pizaini/feeder-pddikti:latest`, proyek open-source "Neo Feeder PDDIKTI versi Docker") |
| Nama container database | `dbpddikti` (image `postgres:10`) |
| Domain yang dikenali aplikasi | `feeder.stkip-majenang.ac.id` -- domain kampus **sungguhan** proyek ini (STKIP Majenang), bukan domain contoh |
| Port yang dipublikasikan ke host | `8100` (API + web, lewat nginx), `3003` (backend, dibatasi hanya diakses dari dalam network sejak commit `4523b76`) |
| Status proses | Keduanya `Up 4 days` saat audit ini dimulai, dengan jejak aktivitas terbaru hari ini (lihat §3) |

## Arsitektur Container dan Database

```
Host Windows (komputer kerja ini)
 └─ Docker network "docker-feeder-pddikti_app-network" (bridge, subnet 192.167.150.0/24)
     ├─ feeder     (pizaini/feeder-pddikti:latest) -- expose 8100 (host), 3003 (internal saja)
     │               env: PGHOST=db-pddikti, PGPORT=${DB_PG_PORT}  (nama host container, bukan alamat eksternal)
     │               volume: HANYA nginx.conf (bind mount file konfigurasi, bukan data aplikasi)
     │               juga terhubung ke network eksternal "siakad-feeder-bridge" (ada, tapi tidak ditemukan
     │               container lain yang tercatat aktif memakainya saat audit ini)
     └─ dbpddikti  (postgres:10) -- port 8100's companion DB, HANYA dibuka ke 127.0.0.1 di host
                    volume: BIND MOUNT ke folder sungguhan di disk host:
                    "C:\Users\GALIH JP\Desktop\neo-feeder\docker-feeder-pddikti\pgsql\data"
```

**Tidak ada koneksi keluar ke server/database lain** yang terlihat dari konfigurasi compose ini -- `PGHOST`
mengarah ke nama container Docker (`db-pddikti`), bukan ke IP/hostname eksternal mana pun. Dari sisi *konfigurasi
compose*, seluruh stack berjalan sendiri di mesin ini.

## Konfigurasi Koneksi yang Sudah Diverifikasi

- **Nginx**: dua server block pada port 8100 -- satu `default_server` yang menolak akses langsung lewat IP
  (`return 403`), satu lagi untuk `server_name feeder.stkip-majenang.ac.id` yang meneruskan ke backend
  `127.0.0.1:3003`. Ini konfigurasi **produksi-gaya** (pembatasan akses by-domain, bukan konfigurasi dev yang
  biasanya longgar) -- dikonfirmasi oleh riwayat commit repo `neo-feeder` itu sendiri: *"restrict feeder access
  to domain feeder.stkip-majenang.ac.id and block direct IP"* (commit `c65be18`).
- **Database**: `docker-compose.yaml` mendefinisikan `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` dari
  variabel `${DB_PG_*}` yang dibaca dari file `.env` lokal (nilainya **tidak saya tampilkan**; saya hanya
  mengonfirmasi keempat nama variabel itu ADA dan terisi). Port database dibatasi `127.0.0.1` saja -- tidak
  dipublikasikan ke jaringan luar sama sekali.
- **Kredensial aplikasi (akun PDDIKTI)**: terkonfirmasi **valid dan aktif** lewat endpoint `test-connection`
  milik SIAKAD sendiri pada audit sebelumnya (`FEEDER_PHASE_3_IMPLEMENTATION_REPORT.md`) -- saya tidak mengulang
  percobaan koneksi apa pun di audit ini, dan tidak mencoba kredensial lain apa pun, sesuai batasan tugas ini.

## Indikasi Hubungan dengan Produksi

Dari pemeriksaan non-destruktif (metadata Docker, riwayat git, isi folder), ditemukan **beberapa indikasi kuat**
bahwa ini bukan sekadar sandbox kosong untuk coba-coba, walau secara teknis berjalan "lokal":

1. **Ukuran data nyata, bukan kosong**: folder data Postgres (`pgsql/data`) berukuran **≈995 MB**. Database
   Feeder kosong/baru biasanya jauh lebih kecil (puluhan MB). Ukuran sebesar ini konsisten dengan database yang
   sudah berisi data akademik dalam jumlah besar, bukan instalasi baru yang belum dipakai.
2. **Usia data jauh lebih tua dari container-nya**: file `PG_VERSION` di direktori data tertanggal **21
   September 2021**, sementara container `dbpddikti` sendiri baru dibuat/dinyalakan ulang 4 hari sebelum audit
   ini. Artinya **direktori data ini sudah ada sejak 2021 dan dibawa terus** (disalin/dipindah) ke lingkungan
   kerja saat ini, bukan dibuat baru untuk keperluan uji coba singkat.
3. **Riwayat git repo `neo-feeder` milik akun GitHub pengguna sendiri** (`github.com/galihbk/neo-feeder` --
   `galihbk` adalah identitas Git yang sama dengan yang dipakai di seluruh pekerjaan proyek `siakadpremium` ini).
   Riwayat commit-nya berisi pekerjaan deploy produksi yang jelas, bukan eksperimen:
   - *"ci: add vps deploy workflow"*, *"ci: hardcode target deploy path to /var/www/neo-feeder"* -- menunjukkan
     ada pipeline CI/CD yang men-deploy image/konfigurasi ini ke **VPS sungguhan**.
   - *"restrict feeder access to domain feeder.stkip-majenang.ac.id..."* -- pembatasan akses sampai ke tingkat
     domain kampus asli, kebutuhan khas sistem yang benar-benar dipakai (bukan sandbox internal).
4. **Domain yang dikenali adalah domain kampus sungguhan** (`feeder.stkip-majenang.ac.id`), bukan
   `test.local`/`localhost.test`/nama placeholder lain yang lazim dipakai untuk lingkungan uji yang jelas aman.
5. **Software Neo Feeder itu sendiri, secara desain**, adalah aplikasi yang dipasang di internal kampus dan
   menyinkronkan datanya ke server pusat PDDIKTI Kemdikbud -- ini bukan asumsi saya, ini memang fungsi utama
   software ini (disebut di README repo-nya sendiri: aplikasi ini ADALAH Feeder PDDIKTI resmi, hanya dibungkus
   Docker). **Saya tidak memeriksa (dan tidak akan memeriksa tanpa izin eksplisit) apakah proses sinkronisasi
   keluar ke PDDIKTI Pusat itu aktif/terjadwal di instalasi ini** -- itu berada di dalam biner aplikasi yang
   stripped/tidak bisa saya baca tanpa reverse-engineering (di luar lingkup dan izin audit ini). **Saya tidak
   bisa memastikan maupun menyingkirkan kemungkinan itu.**

**Yang TIDAK ditemukan** (dan karenanya tidak bisa dijadikan bukti ke arah manapun): tidak ada bukti langsung
berupa log koneksi keluar ke internet/PDDIKTI Pusat yang saya periksa (pemeriksaan semacam itu butuh melihat
traffic jaringan container secara aktif, yang tidak saya lakukan karena berisiko dan di luar lingkup "periksa
konfigurasi" yang diminta tugas ini).

## Risiko Jika Dilakukan Live Testing (Insert/Update)

1. **Risiko tertinggi**: kalau instalasi lokal ini memang mode produksi aktif (sesuai indikasi §4), data uji
   coba (mis. mahasiswa/nilai dummy) yang di-*Insert* akan **tercampur dengan data akademik resmi kampus**, dan
   berpotensi **ikut tersinkron ke PDDIKTI Pusat** sebagai data resmi negara -- tidak bisa ditarik kembali
   dengan mudah begitu sampai di PDDIKTI.
2. **Risiko menengah**: walau ternyata ini salinan/cadangan lokal (bukan yang benar-benar tersambung ke
   PDDIKTI Pusat saat ini), Insert/Update tetap akan **mengubah 995 MB data yang sudah ada** dengan cara yang
   sulit dibatalkan tanpa cadangan terpisah (saya tidak memverifikasi apakah ada mekanisme backup/restore untuk
   database Postgres ini di luar bind mount itu sendiri).
3. **Tidak ada cara aman untuk "mencoba sedikit saja"** -- begitu satu `Insert...` dikirim dan diterima
   (`error_code: 0`), tidak ada act `Delete...` yang terverifikasi tersedia untuk kebanyakan entitas (lihat
   `FEEDER_AUDIT_REPORT.md`), jadi kesalahan sulit dibatalkan dari sisi API.

## Kesimpulan: **UNKNOWN -- dengan indikasi kuat ke arah PRODUCTION, bukan TESTING murni**

Saya **tidak bisa** menyatakan ini dengan pasti **PRODUCTION** (karena tidak memeriksa apakah sinkronisasi ke
PDDIKTI Pusat benar-benar aktif saat ini -- itu di luar lingkup audit read-only yang diizinkan), tapi saya juga
**tidak bisa** menyatakan ini **TESTING/DEVELOPMENT** yang aman dipakai coba-coba, karena bukti yang ada (ukuran
data, usia data sejak 2021, riwayat deploy VPS produksi di repo git milik pengguna sendiri, pembatasan akses
setingkat domain kampus asli) semuanya mengarah ke **data dan konfigurasi bergaya produksi**, bukan sandbox.

**Live testing (Insert/Update/Delete apa pun) TIDAK BOLEH dilakukan terhadap environment ini sampai ada
konfirmasi eksplisit dari Anda** mengenai salah satu dari dua hal berikut:
- **(a)** Ini memang salinan/cadangan lokal yang AMAN diubah/dirusak sepenuhnya (dan Anda tahu persis itu tidak
  tersambung ke PDDIKTI Pusat sama sekali), ATAU
- **(b)** Ada lingkungan Feeder LAIN yang jelas-jelas untuk uji coba (mis. instalasi terpisah dengan data dummy
  yang Anda buat khusus untuk pengembangan ini), yang sebaiknya dipakai sebagai gantinya.

## Rekomendasi Tindakan Berikutnya

1. **Konfirmasi dari Anda dulu** (poin di atas) sebelum fase Feeder mana pun mencoba operasi tulis sungguhan,
   termasuk `GetDictionary` untuk menutup gap field `InsertMahasiswaLulusDO` di `FEEDER_PHASE_3_IMPLEMENTATION_REPORT.md`
   -- `GetDictionary` sendiri murni baca, tapi saya tetap menunggu konfirmasi status environment ini dulu sesuai
   batasan eksplisit tugas ini ("jangan menjalankan `GetDictionary` atau act lain sebelum status environment
   dipastikan").
2. Kalau jawabannya (a) -- aman dirusak -- sebaiknya tetap buat **cadangan folder `pgsql/data`** dulu (salin
   foldernya) sebelum eksperimen apa pun, murni sebagai jaring pengaman, terlepas dari jawaban Anda.
3. Kalau jawabannya (b) -- ada lingkungan lain -- beri tahu detail koneksinya (alamat, bukan kredensial) supaya
   pekerjaan Feeder berikutnya diarahkan ke situ, bukan ke `localhost:8100` yang sekarang dikonfigurasi di
   `pddikti_settings`.
4. Sampai salah satu di atas dikonfirmasi, seluruh pekerjaan Feeder lanjutan (termasuk Fase 3 Tahap B dan
   kelompok Aktivitas Mahasiswa yang sudah ditunda sejak awal) **tetap berstatus ditunda**, bukan karena kendala
   teknis, tapi karena belum ada kepastian keamanan lingkungan untuk mengujinya.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
