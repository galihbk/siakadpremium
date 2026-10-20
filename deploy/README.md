# Deploy otomatis ke banyak server kampus

Satu repo, satu pipeline, banyak server. Setiap `git push` membangun image sekali, lalu GitHub Actions
meng-update server kampus yang terdaftar di [`customers.json`](./customers.json).

```
git push main ──► build image (api, web, portal, pmb, p2m, p3m) ──► ghcr.io
                                   │
                                   └─► plan-customers ──► deploy-customers (paralel)
                                                              ├─ kampus-a  (SSH)
                                                              └─ kampus-b  (self-hosted runner)
```

## Aturan: kapan kampus di-update

Atur per kampus di `customers.json` lewat `autoDeploy` dan `track`:

| `track`   | Di-update saat…                              | Cocok untuk                              |
|-----------|-----------------------------------------------|------------------------------------------|
| `main`    | setiap push ke branch `main` (versi terbaru) | paket Pro / demo                         |
| `release` | hanya saat Anda membuat tag rilis `v*`       | paket Basic / kampus yang ingin stabil   |

`autoDeploy: false` = tidak pernah otomatis (hanya lewat jalankan manual). Kampus yang tidak ada di daftar tidak tersentuh.

Merilis versi untuk kampus `release`:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Jalankan manual (menu **Actions → pipeline → Run workflow**):
- `customers`: `auto`, atau nama kampus dipisah koma (`kampus-a,kampus-b`).
- `tag`: kosong = commit yang dipilih; isi `v1.0.0` untuk mengunci / mengembalikan ke versi itu.

## Menambah kampus baru

1. **Siapkan server** (sekali): Ubuntu + Docker Engine + Docker Compose v2, lalu buat folder aplikasi:
   ```bash
   sudo mkdir -p /srv/siakad && sudo chown $USER /srv/siakad
   ```
2. **Isi `.env` kampus itu** (sekali, di server, jangan masuk repo). Cara termudah: biarkan deploy pertama berjalan;
   ia akan menyalin template `.env` lalu **berhenti dengan pesan** minta Anda mengisinya. Edit, lalu jalankan ulang deploy:
   ```bash
   cd /srv/siakad
   nano .env   # alamat kampus, POSTGRES_PASSWORD, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, SMTP, dst.
   ```
   Skrip deploy **menolak** berjalan bila `.env` masih memakai rahasia bawaan (`change_me`, password contoh).
3. **Pilih cara masuk ke server:**
   - **SSH** (server bisa dijangkau dari internet): buat kunci khusus deploy, pasang kunci publiknya di
     `~/.ssh/authorized_keys` server, dan simpan kunci privatnya sebagai secret (langkah 4).
   - **Self-hosted runner** (server di balik NAT/jaringan kampus): pasang GitHub Actions runner di server itu dengan label,
     mis. `kampus-b`, lalu isi `"runner": "kampus-b"` di `customers.json`. Tidak perlu SSH.
4. **Buat GitHub Environment** bernama sama dengan `environment` di `customers.json`
   (*Settings → Environments → New environment*) dan isi secret (hanya untuk mode SSH):

   | Secret            | Isi                                                   |
   |-------------------|-------------------------------------------------------|
   | `SSH_HOST`        | alamat server                                         |
   | `SSH_USER`        | pengguna deploy (anggota grup `docker`)               |
   | `SSH_KEY`         | kunci privat deploy                                   |
   | `SSH_PORT`        | opsional, bawaan 22                                   |
   | `SSH_KNOWN_HOSTS` | opsional (disarankan): hasil `ssh-keyscan` server     |

   Environment juga bisa diberi *required reviewers* bila ingin ada persetujuan sebelum kampus tertentu di-update.
5. **Tambahkan baris** di `customers.json` (contoh di [`customers.example.json`](./customers.example.json)) lalu push.

## Instance baru / demo kampus dengan data kosong

Untuk demo khusus satu kampus (mis. Kudus) jangan menyalin repo dan jangan memakai database demo yang sudah berisi data:
buat **instance baru** dari kode yang sama dengan database baru yang kosong.

1. **`.env` instance itu** (di server, bukan di repo) cukup berisi alamat kampus, rahasia baru, dan blok *Instance baru* di
   `.env.prod.example`:
   ```
   INSTANCE_NAME=kudus                   # hanya bila berbagi mesin dengan instance lain
   SIAKAD_WEB_PORT=3200 ... (port unik)  # idem
   BOOTSTRAP_ADMIN_EMAIL=admin@kampus-kudus.ac.id
   BOOTSTRAP_ADMIN_PASSWORD=<kata sandi awal>
   BOOTSTRAP_CAMPUS_NAME=Nama Kampus Kudus
   BOOTSTRAP_CAMPUS_SHORT=KDS
   ```
2. Saat API pertama kali menyala dan belum ada Super Admin, ia membuat **satu akun Super Admin** dan **profil institusi kosong**
   (hanya nama kampus). Tidak ada fakultas, prodi, mahasiswa, dosen, atau data ITN. Setelah login, lengkapi di
   *Super Admin → Profil Institusi*, Fakultas, Program Studi, dst. Ganti kata sandi awal, lalu hapus `BOOTSTRAP_*` dari `.env`.
3. Daftarkan di `customers.json` seperti kampus lain (`"track": "main"` agar demo selalu mengikuti versi terbaru).
4. **Domain & Cloudflare Tunnel.** Cloudflare Universal SSL hanya mencakup subdomain **satu tingkat** (`*.contoh.com`), jadi
   `portal.kudus.contoh.com` tidak akan ber-SSL. Pakai nama **strip** (tetap satu tingkat) dan daftarkan satu *public hostname*
   per layanan di tunnel instance itu:

   | Layanan | Alamat                       | Diarahkan ke (port instance) |
   |---------|------------------------------|------------------------------|
   | Website | `kudus.contoh.com`           | `SIAKAD_WEB_PORT`            |
   | Portal  | `portal-kudus.contoh.com`    | `SIAKAD_PORTAL_PORT`         |
   | PMB     | `pmb-kudus.contoh.com`       | `SIAKAD_PMB_PORT`            |
   | P2M     | `p2m-kudus.contoh.com`       | `SIAKAD_P2M_PORT`            |
   | LP3M    | `p3m-kudus.contoh.com`       | `SIAKAD_P3M_PORT`            |

   Lalu isi di `.env` instance itu (dibaca aplikasi saat berjalan, tidak perlu build ulang):
   ```
   PUBLIC_WEB_URL=https://kudus.contoh.com
   PUBLIC_PORTAL_URL=https://portal-kudus.contoh.com
   PUBLIC_PMB_URL=https://pmb-kudus.contoh.com
   PUBLIC_P2M_URL=https://p2m-kudus.contoh.com
   PUBLIC_P3M_URL=https://p3m-kudus.contoh.com
   NEXT_PUBLIC_APP_URL=https://pmb-kudus.contoh.com
   ```
   Tautan antar-layanan (menu Layanan, tombol Login, "Kembali ke Website Utama", dokumen cetak PMB) memakai alamat ini. Bila
   `PUBLIC_*` dikosongkan, aplikasi menurunkannya dari domain yang sedang dibuka dan mengenali dua pola: `portal.contoh.com`
   (titik) serta `portal-kudus.contoh.com` (strip) -- tetapi dari alamat website utama pola strip tidak bisa ditebak, jadi
   tetap isi `PUBLIC_*` untuk instance berpola strip.

## Yang dilakukan skrip di tiap server (`remote-deploy.sh`)

1. Menolak jalan bila `.env` belum ada / masih berisi rahasia bawaan.
2. **Backup database** ke `backups-deploy/` (10 terakhir disimpan).
3. Menarik image versi yang dituju.
4. Sinkron skema database **tanpa** `--accept-data-loss`. Bila perubahan skema berisiko menghapus data, update
   **ditolak** dan versi lama tetap berjalan.
5. Mengganti container, lalu cek `/api/v1/health`.
6. Bila tidak sehat: **rollback otomatis** ke versi sebelumnya (`.deployed-tag`).

## Catatan penting

- Semua kampus memakai **image yang sama**; yang berbeda hanya `.env`, database, dan versi yang terpasang.
  Alamat yang tertanam saat build akan sama untuk semua kampus, jadi jangan menambah `NEXT_PUBLIC_*` yang berisi domain
  tertentu — turunkan dari host saat berjalan (seperti `p2m`/`p3m`/`portal`).
- Sebelum kampus pertama dengan data nyata, ganti `prisma db push` dengan **`prisma migrate`** (riwayat migrasi), agar update
  skema bisa dijalankan berurutan dan dapat diaudit.
- Server `deploy` (self-hosted, `/srv/projects/siakadpremium`) yang sudah ada adalah server utama Anda dan tidak diubah
  perilakunya; kampus pelanggan memakai job `deploy-customers` yang terpisah.
- Satu kampus gagal tidak menghentikan kampus lain (`fail-fast: false`), dan paling banyak 3 kampus diproses bersamaan.
