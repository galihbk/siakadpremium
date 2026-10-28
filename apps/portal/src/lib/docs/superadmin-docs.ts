import type { DocSection } from './types';

export const DOCS_VERSION = 'Oktober 2026';

/**
 * Dokumentasi SIAKAD untuk Super Admin.
 * Ditulis sebagai data agar mudah dirawat bersama kode; ubah di sini lalu deploy.
 */
export const SUPERADMIN_DOCS: DocSection[] = [
  // =====================================================================
  // MULAI
  // =====================================================================
  {
    id: 'pengantar',
    group: 'Mulai',
    title: 'Pengantar',
    summary: 'Apa itu SIAKAD, siapa penggunanya, dan bagaimana dokumentasi ini disusun.',
    blocks: [
      {
        t: 'p',
        text: 'SIAKAD adalah sistem informasi akademik terpadu untuk perguruan tinggi: dari penerimaan mahasiswa baru (PMB), perkuliahan, penilaian, tugas akhir, yudisium, keuangan, kepegawaian, penelitian, hingga penjaminan mutu, lengkap dengan integrasi ke PDDIKTI (Neo Feeder).',
      },
      {
        t: 'p',
        text: 'Dokumentasi ini ditujukan bagi Super Admin, yaitu pemegang akses tertinggi yang mengelola master data, pengguna, pengaturan sistem, serta operasional server. Bagian per-peran menjelaskan apa yang dikerjakan setiap pengguna lain sehingga Super Admin dapat membantu dan memeriksa pekerjaan mereka.',
      },
      {
        t: 'table',
        head: ['Bagian', 'Isi'],
        rows: [
          ['Mulai', 'Pengantar, arsitektur sistem, peran dan hak akses.'],
          ['Panduan Super Admin', 'Setiap menu pada akun Super Admin dan urutan penyiapan awal.'],
          ['Panduan per Peran', 'Cara kerja BAAK, Prodi, Dosen, Mahasiswa, Keuangan, PMB, SDM, LP3M, dan P2M.'],
          ['Proses Bisnis', 'Siklus semester, tugas akhir, yudisium, ujian, dan sinkronisasi Feeder.'],
          ['Situs Publik', 'Situs utama, PMB, P2M, dan LP3M beserta sumber datanya.'],
          ['Operasional', 'Backup, email, tanda tangan dokumen, deployment, keamanan, dan pemecahan masalah.'],
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        title: 'Panduan untuk setiap peran',
        text: 'Selain dokumentasi ini, setiap peran (Mahasiswa, Dosen, BAAK, Prodi, Keuangan, PMB, SDM, LP3M, P2M) memiliki halaman Panduan Penggunaan sendiri di menu Bantuan pada sidebar masing-masing. Berkasnya ada di apps/portal/src/lib/docs/*-docs.ts. Super Admin dapat membuka area peran lain untuk melihat tampilannya.',
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Selalu mutakhir',
        text: 'Dokumentasi ini disimpan di kode aplikasi dan ikut diperbarui saat ada fitur baru. Jika menemukan hal yang berbeda dengan perilaku sistem, perbaiki berkas dokumentasi bersama perubahan kodenya.',
      },
    ],
  },
  {
    id: 'prioritas',
    group: 'Mulai',
    title: 'Prioritas Pekerjaan Anda',
    summary: 'Apa yang harus dikerjakan lebih dulu, kapan, dan di menu mana.',
    blocks: [
      { t: 'p', text: 'Super Admin menyiapkan fondasi yang dipakai semua role. Langkah di bawah berurutan: bila satu terlewat, role di belakangnya akan terhambat. Sesudah penyiapan awal, tugas Anda berubah menjadi pemantauan.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Ganti kata sandi akun awal dan hapus BOOTSTRAP_* dari .env', 'Segera setelah login pertama', 'Profil, .env server'],
          ['P1 - Kerjakan lebih dulu', 'Isi Profil Institusi (nama, alamat, logo, kop surat, tautan media sosial)', 'Hari pertama', 'Profil Institusi'],
          ['P1 - Kerjakan lebih dulu', 'Tambahkan Fakultas dan Program Studi', 'Hari pertama', 'Fakultas, Program Studi'],
          ['P1 - Kerjakan lebih dulu', 'Atur Format NIM sebelum mahasiswa atau registrasi PMB pertama', 'Sebelum ada mahasiswa', 'Format NIM'],
          ['P1 - Kerjakan lebih dulu', 'Buat akun BAAK, Prodi, Keuangan, PMB, SDM, LP3M, dan P2M; kaitkan akun Prodi ke program studinya', 'Hari pertama', 'User'],
          ['P2 - Penting', 'Tambahkan rekening bank kampus dan pilih mode Konfirmasi Manual', 'Sebelum tagihan atau PMB dibuka', 'Pengaturan Bank'],
          ['P2 - Penting', 'Tetapkan Aturan Tanda Tangan untuk KHS, KRS, dan surat', 'Sebelum dokumen pertama dicetak', 'Aturan Tanda Tangan'],
          ['P2 - Penting', 'Isi SMTP (MAIL_*) di .env agar email verifikasi dan lupa kata sandi terkirim', 'Sebelum PMB dibuka', '.env server'],
          ['P2 - Penting', 'Atur koneksi Neo Feeder bila institusi memakai PDDIKTI', 'Sebelum sinkronisasi pertama', 'Pengaturan DIKTI'],
          ['P2 - Penting', 'Buat backup database pertama', 'Setelah penyiapan selesai', 'Pengaturan Sistem'],
          ['P3 - Rutin', 'Periksa Monitoring Server dan Updates setelah setiap deploy', 'Setiap deploy dan mingguan', 'Monitoring Server, Updates'],
          ['P3 - Rutin', 'Buat backup berkala dan uji pemulihannya', 'Terjadwal', 'Pengaturan Sistem'],
          ['P4 - Bila diperlukan', 'Kelola pegawai, ubah data induk bila BAAK tidak dapat', 'Bila diperlukan', 'Pegawai, Mahasiswa, Dosen'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Cara membaca prioritas',
        text: 'P1 adalah pekerjaan yang bila terlewat akan menghambat orang lain atau membuat fitur terkunci. P2 penting dan sebaiknya selesai sebelum fase berikutnya dimulai. P3 dikerjakan berulang sepanjang semester. P4 dikerjakan hanya saat ada kebutuhan. Kerjakan dari P1 ke bawah, di dalam tiap prioritas ikuti urutan baris.',
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Mode pembayaran',
        text: 'Konfirmasi Manual adalah satu-satunya mode yang aktif saat ini; Integrasi API bank berstatus segera hadir. Mahasiswa dan calon mahasiswa wajib memilih salah satu rekening kampus saat membayar, sehingga minimal satu rekening harus aktif.',
      },
      { t: 'h3', text: 'Urutan kerja antar peran dalam satu semester' },
      {
        t: 'table',
        head: ['Langkah', 'Role', 'Harus selesai sebelum'],
        rows: [
          ['1. Tahun Akademik, jendela KRS dan nilai', 'BAAK', 'KRS dibuka'],
          ['2. Komponen Penilaian dan Skala Nilai', 'BAAK', 'Dosen menyusun Kontrak Kuliah'],
          ['3. Kurikulum dan kelas (dosen pengampu, jadwal, ruang)', 'BAAK, Prodi', 'Mahasiswa mengisi KRS'],
          ['4. Rekening bank dan aturan biaya', 'Keuangan', 'Tagihan terbit dan PMB dibuka'],
          ['5. KRS diisi mahasiswa lalu disetujui dosen PA', 'Mahasiswa, Dosen', 'Perkuliahan berjalan'],
          ['6. Bobot penilaian di Kontrak Kuliah dan RPS', 'Dosen, P2M', 'Input nilai pertama'],
          ['7. Absensi tiap pertemuan, ujian UTS/UAS', 'Dosen, BAAK', 'Input nilai akhir'],
          ['8. Input nilai dan terbitkan', 'Dosen', 'Jendela nilai ditutup'],
          ['9. Koreksi nilai, yudisium, sinkronisasi Feeder', 'BAAK', 'Semester ditutup'],
        ],
      },
    ],
  },
  {
    id: 'arsitektur',
    group: 'Mulai',
    title: 'Arsitektur Sistem',
    summary: 'Aplikasi apa saja yang berjalan, di port dan subdomain mana, serta bagaimana saling terhubung.',
    blocks: [
      {
        t: 'p',
        text: 'Sistem berupa monorepo (pnpm workspaces). Setiap aplikasi dibangun dan dideploy sebagai container tersendiri sehingga dapat dirawat dan diskalakan terpisah.',
      },
      {
        t: 'table',
        head: ['Aplikasi', 'Fungsi', 'Port dev', 'Port host produksi', 'Subdomain'],
        rows: [
          ['api', 'REST API NestJS: seluruh logika bisnis dan akses database', '3001', '3101', 'api. (opsional)'],
          ['web', 'Situs publik kampus: beranda, profil, fakultas, program studi, berita, kontak', '3000', '3100', 'domain utama'],
          ['portal', 'Portal login dan seluruh dashboard (mahasiswa, dosen, admin, dll.)', '3002', '3102', 'portal.'],
          ['pmb', 'Portal Penerimaan Mahasiswa Baru (pendaftar)', '3004', '3103', 'pmb.'],
          ['p2m', 'Situs publik Penjaminan Mutu', '3005', '3104', 'p2m.'],
          ['p3m', 'Situs publik LP3M (penelitian & pengabdian)', '3006', '3105', 'p3m.'],
        ],
      },
      {
        t: 'h3',
        text: 'Komponen pendukung',
      },
      {
        t: 'ul',
        items: [
          'PostgreSQL 16 sebagai basis data utama; skema dikelola Prisma (packages/database) dengan perintah db push.',
          'Redis 7 untuk cache dan antrean ringan.',
          'Penyimpanan berkas: disk lokal (folder uploads) atau Cloudflare R2, dipilih lewat konfigurasi server.',
          'Neo Feeder (PDDIKTI): diakses API untuk sinkronisasi dua arah.',
          'Cloudflare Tunnel / Caddy sebagai pintu masuk: mengarahkan tiap subdomain ke port host aplikasi.',
        ],
      },
      {
        t: 'h3',
        text: 'Bagaimana aplikasi saling bicara',
      },
      {
        t: 'ul',
        items: [
          'Browser selalu memanggil jalur relatif /api/v1 pada domain aplikasi itu sendiri; Next.js meneruskannya (rewrite) ke API di jaringan Docker (INTERNAL_API_URL). Tidak ada alamat localhost yang bocor ke browser.',
          'Halaman situs publik di-render di server (SSR) dan mengambil data dari API; data di-cache sampai 60 detik.',
          'Gambar unggahan publik disajikan API di /uploads/public dan diteruskan lewat rewrite yang sama di web dan portal.',
          'Dokumentasi interaktif API (Swagger) tersedia di alamat API pada jalur /api/docs.',
        ],
      },
    ],
  },
  {
    id: 'peran',
    group: 'Mulai',
    title: 'Peran & Hak Akses',
    summary: 'Tiga belas peran akses, area masing-masing, dan bagaimana pembatasan dijaga.',
    blocks: [
      {
        t: 'p',
        text: 'Setiap akun memiliki satu peran. Peran menentukan area portal yang dapat dibuka dan endpoint API yang boleh dipanggil. Pembatasan dijaga di dua lapis: pengalihan di portal, dan yang terpenting pemeriksaan token di API. Seluruh endpoint API wajib login kecuali daftar publik yang sengaja dibuka (situs publik, login, dan pendaftar PMB); kelompok endpoint sensitif juga dibatasi per peran (lihat bagian Keamanan & Audit).',
      },
      {
        t: 'table',
        head: ['Kode peran', 'Nama', 'Area portal', 'Tanggung jawab utama'],
        rows: [
          ['SUPER_ADMIN', 'Super Admin', '/admin/superadmin', 'Master data, pengguna, pengaturan sistem, integrasi, backup, dokumentasi.'],
          ['ADMIN_BAAK', 'Admin BAAK', '/admin', 'Data induk, kurikulum, penjadwalan, KRS, nilai, tugas akhir, yudisium, surat, berita, Feeder.'],
          ['ADMIN_PRODI', 'Admin Program Studi', '/admin/prodi', 'Memantau data prodinya sendiri; menulis berita prodi.'],
          ['ADMIN_PMB', 'Panitia PMB', '/admin/pmb', 'Gelombang, jalur, verifikasi berkas, kelulusan seleksi, registrasi ulang.'],
          ['ADMIN_KEUANGAN', 'Keuangan', '/finance', 'Tagihan, pembayaran, honor, gaji, kas, anggaran.'],
          ['SDM', 'SDM & Kepegawaian', '/admin/sdm', 'Data pegawai, status kepegawaian dosen, shift, rekap absensi.'],
          ['ADMIN_LP3M / LP3M', 'LP3M', '/admin/p3m', 'Laporan penelitian & pengabdian, HAKI, dokumen, borang; berita.'],
          ['ADMIN_P2M / P2M', 'P2M', '/admin/p2m', 'Standar mutu, audit internal, validasi RPS, tindak lanjut, dokumen mutu; berita.'],
          ['LECTURER', 'Dosen', '/lecturer', 'Mengajar, absensi, nilai, RPS, bimbingan PA dan skripsi, pengawasan ujian.'],
          ['STUDENT', 'Mahasiswa', '/student', 'KRS, jadwal, presensi, KHS, ujian, skripsi, yudisium, surat, tagihan.'],
          ['STAFF', 'Staf', 'sesuai penugasan', 'Peran pendukung; diperlakukan setara BAAK untuk label dokumen.'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Peran yang mengunci diri',
        text: 'Akun PMB, LP3M, P2M, Prodi, dan SDM hanya boleh membuka area miliknya; mencoba membuka area lain dialihkan kembali. Dosen dan Mahasiswa dikunci ke /lecturer dan /student.',
      },
      {
        t: 'h3',
        text: 'Pembatasan data penting',
      },
      {
        t: 'ul',
        items: [
          'Admin Prodi: program studi diturunkan dari akun yang login di server (studyProgramId milik user), bukan dari parameter di browser. Mengubah URL tidak membuka prodi lain.',
          'Mahasiswa dan Dosen: identitas selalu dari token (req.user.sub); tidak ada parameter ID mahasiswa yang dipercaya dari klien.',
          'Status kepegawaian dosen hanya dapat diubah SDM dan Super Admin; Dosen dan BAAK hanya melihat.',
          'Berita: Prodi, PMB, P2M, dan LP3M hanya mengelola berita tulisannya sendiri dan tidak dapat menandai berita unggulan.',
          'Backup dan pengaturan integrasi hanya untuk Super Admin.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Akun demo',
        text: 'Beberapa akun demo (mis. prodi@itn.ac.id, p2m@itn.ac.id) dipasangkan ke data sungguhan tetapi bukan baris pada tabel User, sehingga jejak penulis/pengunggah tidak terhubung ke akun. Gunakan akun nyata untuk produksi.',
      },
    ],
  },

  // =====================================================================
  // PANDUAN SUPER ADMIN
  // =====================================================================
  {
    id: 'penyiapan-awal',
    group: 'Panduan Super Admin',
    title: 'Penyiapan Awal',
    summary: 'Urutan yang disarankan saat sistem baru dipasang atau saat tahun akademik baru dimulai.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Profil Institusi: isi nama, singkatan, alamat, kontak, logo, rektor dan wakil rektor, akreditasi. Data ini dipakai kop surat dan situs publik.',
          'Fakultas: tambahkan fakultas, isi gedung, tahun berdiri, akreditasi, deskripsi, serta Visi dan Misi.',
          'Program Studi: tambahkan prodi di bawah fakultas (jenjang, gelar, akreditasi, kode PDDIKTI, Visi dan Misi).',
          'Dosen dan jabatan struktural: tetapkan Dekan dan Kaprodi lewat jabatan struktural dosen; nama mereka otomatis tampil di dokumen dan situs publik.',
          'Format NIM: atur pola NIM sebelum mahasiswa pertama dibuat.',
          'Pengaturan DIKTI dan Pengaturan Bank: isi koneksi Neo Feeder dan payment gateway.',
          'Aturan Tanda Tangan: tetapkan siapa menandatangani tiap jenis dokumen.',
          'Pengaturan Sistem: buat backup pertama. Pastikan juga MAIL_* sudah terisi di .env server (lihat Email Notifikasi).',
          'Buat akun pengguna untuk BAAK, Prodi, Keuangan, PMB, SDM, LP3M, dan P2M (menu User).',
          'Kalender Akademik dan Tahun Akademik: BAAK menetapkan tahun/semester aktif dan jendela waktu KRS serta nilai.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Jalankan sinkronisasi Feeder untuk Tahun Akademik, Dosen, dan Mahasiswa terlebih dahulu bila institusi sudah memiliki data di PDDIKTI; urutan lengkap ada di bagian Sinkronisasi Feeder.',
      },
    ],
  },
  {
    id: 'sa-dashboard',
    group: 'Panduan Super Admin',
    title: 'Dashboard & Pemantauan',
    summary: 'Dashboard, Monitoring Server, dan Analitik Kunjungan Web.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Dashboard', 'Ringkasan jumlah mahasiswa, dosen, prodi, dan indikator utama langsung dari basis data.'],
          ['Monitoring Server', 'Status server secara real-time: info host, CPU, RAM, storage, serta konektivitas dan latensi database.'],
          ['Analitik Kunjungan Web', 'Kunjungan ke situs publik (halaman, perujuk, tren) yang dicatat saat beranda dibuka.'],
          ['Updates (menu Bantuan)', 'Catatan pembaruan sistem dan menu baru. Lencana jumlah pembaruan belum dibaca muncul pada menu ini; periksa setelah setiap deploy untuk tahu apa yang berubah dan tindakan yang diperlukan.'],
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Jika portal menampilkan error proxy atau ECONNREFUSED, berarti API tidak berjalan (halaman Monitoring pun ikut gagal dimuat). Hampir semua halaman bergantung pada API.',
      },
    ],
  },
  {
    id: 'sa-master',
    group: 'Panduan Super Admin',
    title: 'Master Data',
    summary: 'Profil Institusi, Fakultas, Program Studi, dan Kalender Akademik.',
    blocks: [
      { t: 'h3', text: 'Profil Institusi' },
      {
        t: 'p',
        text: 'Data identitas kampus (nama, singkatan, tagline, alamat, kontak, media sosial, legalitas, pimpinan, format nomor surat, kop surat). Sumbernya satu: pengaturan landing page. Perubahan langsung terlihat di situs publik dan dokumen.',
      },
      { t: 'h3', text: 'Fakultas' },
      {
        t: 'ul',
        items: [
          'Kode fakultas wajib unik dan menjadi alamat halaman publik (/fakultas/KODE).',
          'Dekan tidak diketik manual: ditetapkan lewat jabatan struktural DEKAN pada data dosen.',
          'Kolom Visi dan Misi tampil di halaman fakultas. Tulis satu poin misi per baris; sistem menampilkannya sebagai daftar bernomor. Mengosongkan kolom akan menghapus visi/misi dan bagiannya hilang dari situs publik.',
          'Fakultas hanya dapat dihapus bila tidak lagi memiliki program studi.',
        ],
      },
      { t: 'h3', text: 'Program Studi' },
      {
        t: 'ul',
        items: [
          'Pilih fakultas induk, jenjang (D3/D4/S1/S2/S3/Profesi), gelar, peringkat dan lembaga akreditasi, nomor SK, serta kode PDDIKTI.',
          'Kaprodi ditetapkan lewat jabatan struktural KAPRODI pada data dosen.',
          'Jumlah mahasiswa dan dosen di situs publik dihitung dari data sungguhan, bukan dari kolom isian.',
          'Hanya prodi berstatus Aktif yang tampil di situs publik. Visi dan Misi prodi tampil di /program-studi/KODE.',
        ],
      },
      { t: 'h3', text: 'Kalender Akademik' },
      {
        t: 'p',
        text: 'Agenda akademik (judul, kategori, tanggal mulai dan selesai, target, status, catatan). Agenda yang belum lewat dan tidak berstatus Selesai tampil otomatis pada bagian Agenda di beranda situs publik.',
      },
    ],
  },
  {
    id: 'sa-pengguna',
    group: 'Panduan Super Admin',
    title: 'Pengguna',
    summary: 'Mahasiswa, Dosen, Pegawai, dan manajemen akun User.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Mahasiswa', 'Data lengkap mahasiswa (biodata, status, prodi, dosen PA). Tempat lahir dipilih dari daftar kabupaten/kota yang dapat dicari.'],
          ['Dosen', 'Data dosen, gelar, jabatan fungsional dan struktural (Dekan, Kaprodi). Status kepegawaian ditampilkan hanya-baca.'],
          ['Pegawai', 'Data karyawan dan tenaga pendukung lintas kategori.'],
          ['User', 'Akun login: nama, email, peran, program studi (untuk Admin Prodi), aktif/nonaktif, atur ulang kata sandi.'],
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Admin Prodi harus punya program studi',
        text: 'Akun ADMIN_PRODI wajib dikaitkan dengan satu program studi. Tanpa itu, dashboard prodi tidak dapat menurunkan data yang boleh dilihatnya.',
      },
    ],
  },
  {
    id: 'sa-pengaturan',
    group: 'Panduan Super Admin',
    title: 'Pengaturan Sistem',
    summary: 'Format NIM, Bank, DIKTI, Aturan Tanda Tangan, dan halaman Pengaturan Sistem.',
    blocks: [
      { t: 'h3', text: 'Format NIM' },
      {
        t: 'p',
        text: 'Menentukan pola pembentukan NIM mahasiswa baru (mis. kombinasi kode PT, tahun, kode prodi, nomor urut). Atur sebelum registrasi ulang PMB pertama karena NIM yang sudah terbit tidak berubah.',
      },
      { t: 'h3', text: 'Pengaturan Bank' },
      { t: 'p', text: 'Pilih mode pembayaran. Konfirmasi Manual: mahasiswa dan calon mahasiswa transfer ke rekening kampus lalu mengunggah bukti, dan Keuangan memverifikasinya. Integrasi API bank belum tersedia (segera hadir). Kelola daftar rekening kampus di sini; rekening yang aktif menjadi pilihan wajib saat membayar dan sama dengan yang tampil di Rekening Bank & Kas milik Keuangan.' },
      { t: 'h3', text: 'Pengaturan DIKTI' },
      {
        t: 'p',
        text: 'Alamat, akun, dan kata sandi Neo Feeder serta uji koneksi. Semua sinkronisasi Feeder membaca pengaturan ini. Token Feeder disimpan dan dikelola di server API, bukan di browser.',
      },
      { t: 'h3', text: 'Aturan Tanda Tangan' },
      {
        t: 'p',
        text: 'Menentukan penandatangan untuk tiap jenis dokumen resmi (KHS, KRS, surat-surat). Lihat bagian Aturan Tanda Tangan untuk cakupan penerapannya saat ini.',
      },
      { t: 'h3', text: 'Pengaturan Sistem' },
      {
        t: 'ul',
        items: [
          'Backup Database: buat dan unduh backup (lihat bagian Backup & Pemulihan).',
        ],
      },
    ],
  },

  // =====================================================================
  // PANDUAN PER PERAN
  // =====================================================================
  {
    id: 'peran-baak',
    group: 'Panduan per Peran',
    title: 'Admin BAAK',
    summary: 'Pusat operasional akademik: data induk, penjadwalan, KRS, nilai, tugas akhir, dan layanan.',
    blocks: [
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi dan kegunaan'],
        rows: [
          ['Data Induk', 'Data Mahasiswa dan Data Dosen: CRUD, filter, ekspor Excel/PDF. Status kepegawaian dosen hanya dilihat.'],
          ['Kurikulum', 'Kurikulum & Mata Kuliah (termasuk kategori Tugas Akhir/Lapangan) dan Master Kurikulum.'],
          ['Penjadwalan', 'Tahun Akademik (semester aktif, jendela KRS dan nilai), Gedung, Ruang, Jadwal Kelas, Jadwal Ujian UTS/UAS.'],
          ['Perkuliahan', 'KRS, Tugas Akhir/Skripsi, Kegiatan Lapangan, Yudisium & Kelulusan, Presensi, Nilai, Skala Nilai, Komponen Penilaian (daftar komponen; bobot diisi dosen di Kontrak Kuliah).'],
          ['Layanan Mahasiswa', 'Layanan Surat: terbitkan surat setelah disetujui dosen PA, nomor surat otomatis.'],
          ['Publikasi', 'Berita & Pengumuman dengan editor teks kaya dan unggah gambar.'],
          ['Pelaporan & Integrasi', 'Pelaporan PDDIKTI dan Sinkronisasi Feeder.'],
        ],
      },
      { t: 'h3', text: 'Jadwal Ujian UTS/UAS' },
      {
        t: 'ul',
        items: [
          'Pilih kelas, isi tanggal, jam, ruang, dan pengawas.',
          'Bentrok ruang atau pengawas pada waktu yang sama diblok.',
          'Mahasiswa yang memiliki dua ujian bersamaan hanya diberi peringatan.',
          'Mahasiswa dan dosen melihat jadwal serta tugas pengawasan masing-masing.',
        ],
      },
      { t: 'h3', text: 'Berita & Pengumuman' },
      {
        t: 'ul',
        items: [
          'Ringkasan dibatasi 200 karakter. Gambar diunggah langsung (maks. 5 MB), bukan lewat URL.',
          'Opsi "berita unggulan" menjadi berita utama di halaman /berita; hanya BAAK dan Super Admin yang dapat memakainya.',
          'Berita tampil di situs publik dengan keterangan "Diunggah oleh" berisi unit/role, bukan nama akun.',
        ],
      },
    ],
  },
  {
    id: 'peran-prodi',
    group: 'Panduan per Peran',
    title: 'Admin Program Studi',
    summary: 'Pemantauan data prodi sendiri dan penulisan berita prodi.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Dashboard Prodi', 'Identitas prodi, Kaprodi, serta statistik mahasiswa aktif, dosen, mata kuliah, dan kelas berjalan.'],
          ['Data Mahasiswa', 'Mahasiswa prodi dengan angkatan, status, dosen PA, SKS lulus, IPK; filter dan urutan di server.'],
          ['Data Dosen', 'Dosen homebase, jabatan, status kepegawaian, bimbingan PA, dan beban mengajar semester aktif.'],
          ['Mata Kuliah', 'Katalog mata kuliah terkunci ke prodinya sendiri.'],
          ['Jadwal & Kelas', 'Kelas per semester: dosen, jadwal, ruang, keterisian kuota.'],
          ['Tugas Akhir/Skripsi, Yudisium', 'Pemantauan tahapan tugas akhir dan pendaftar yudisium prodi.'],
          ['Berita & Pengumuman', 'Menulis berita; hanya berita sendiri yang terlihat. Pengunggah publik tampil sebagai "Prodi <nama prodi>".'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Seluruh data prodi diambil dari program studi yang melekat pada akun. Admin Prodi tidak dapat melihat prodi lain meskipun parameter pada URL diubah.',
      },
    ],
  },
  {
    id: 'peran-dosen',
    group: 'Panduan per Peran',
    title: 'Dosen',
    summary: 'Pengajaran, penilaian, bimbingan, dan pengawasan ujian.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Jadwal Mengajar', 'Kelas yang diampu per tahun akademik dan aksi cepat Absen dari dashboard.'],
          ['Absensi Perkuliahan', 'Catat kehadiran mahasiswa per pertemuan; rekap otomatis.'],
          ['Jadwal Ujian & Pengawasan', 'Jadwal UTS/UAS kelas yang diampu dan tugas mengawas.'],
          ['Kontrak Kuliah', 'Bobot penilaian (Tugas/UTS/UAS/Kehadiran) per kelas.'],
          ['RPS', 'Rencana Pembelajaran Semester terstruktur (CPL/CPMK, bahan kajian, matriks 16 minggu), diajukan ke P2M untuk divalidasi.'],
          ['Input Nilai Semester', 'Entri nilai per kelas; terkunci di luar jendela waktu yang ditetapkan BAAK.'],
          ['Mahasiswa Bimbingan PA', 'Riwayat KRS, konsultasi, dan persetujuan KRS mahasiswa bimbingan.'],
          ['Bimbingan Skripsi', 'Menanggapi catatan bimbingan, memberi ACC proposal dan skripsi, melihat jadwal sidang.'],
          ['Persetujuan Surat', 'Menyetujui atau menolak permohonan surat mahasiswa bimbingan.'],
          ['Laporan Penelitian & PkM', 'Mencatat luaran penelitian/pengabdian untuk rekap LP3M.'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Status kepegawaian pada profil dosen bersifat hanya-baca; yang berwenang mengubahnya adalah SDM.',
      },
    ],
  },
  {
    id: 'peran-mahasiswa',
    group: 'Panduan per Peran',
    title: 'Mahasiswa',
    summary: 'Layanan akademik mandiri bagi mahasiswa.',
    blocks: [
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama', 'Dashboard (IPK, SKS, status KRS, tagihan) dan Profil (biodata, tempat lahir dipilih dari daftar kabupaten/kota).'],
          ['Perkuliahan', 'KRS online (batas SKS dan jendela waktu), Jadwal Kuliah, Presensi & Kehadiran (penanda syarat minimal 75%).'],
          ['Ujian & Hasil Studi', 'Jadwal UTS/UAS dan kartu ujian; KHS dengan IPS, IPK, tren IPS, dan distribusi nilai dari data nyata.'],
          ['Tugas Akhir & Kelulusan', 'Skripsi bertahap dan pendaftaran yudisium dengan checklist otomatis.'],
          ['Layanan', 'Layanan Surat: ajukan surat dan lacak statusnya.'],
          ['Keuangan', 'Tagihan dan pembayaran, termasuk unggah bukti transfer.'],
        ],
      },
    ],
  },
  {
    id: 'peran-keuangan',
    group: 'Panduan per Peran',
    title: 'Keuangan',
    summary: 'Penerimaan, honor dan gaji, serta kas dan anggaran.',
    blocks: [
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Penerimaan & Tagihan', 'Penerimaan SPP/UKT, daftar tagihan mahasiswa, verifikasi pembayaran (tab Mahasiswa dan PMB), riwayat pembayaran, aturan biaya perkuliahan.'],
          ['Honor & Pengajaran', 'Rekap mengajar, pengaturan gaji, tarif honor per jenjang, tarif transport, rekap honor.'],
          ['Kas & Anggaran', 'Rekening bank dan kas, realisasi anggaran kampus.'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Syarat yudisium memeriksa apakah mahasiswa masih memiliki tagihan belum lunas; pelunasan di modul ini berpengaruh langsung ke kelulusan.',
      },
    ],
  },
  {
    id: 'peran-pmb',
    group: 'Panduan per Peran',
    title: 'Panitia PMB',
    summary: 'Seluruh proses penerimaan mahasiswa baru.',
    blocks: [
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Pengaturan PMB', 'Gelombang Pendaftaran dan Jalur/Jenis/Kelas.'],
          ['Proses Seleksi', 'Data Calon Mahasiswa, Verifikasi Berkas, Kelulusan & Registrasi (registrasi ulang menghasilkan NIM).'],
          ['Keuangan & Kemitraan', 'Pembayaran & Keuangan serta Data Affiliate.'],
          ['Laporan', 'Rekapitulasi PMB.'],
          ['Informasi', 'Berita & Pengumuman (hanya tulisan sendiri).'],
        ],
      },
      {
        t: 'p',
        text: 'Pendaftar mengakses portal pmb. (daftar, verifikasi email, login, dashboard seleksi). Email verifikasi dan reset kata sandi dikirim lewat SMTP; pastikan konfigurasi email sudah lengkap.',
      },
    ],
  },
  {
    id: 'peran-sdm',
    group: 'Panduan per Peran',
    title: 'SDM & Kepegawaian',
    summary: 'Data pegawai, status dosen, shift, dan rekap absensi.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Data Pegawai', 'Dosen, karyawan, dan tenaga pendukung beserta kategori dan status ikatan kerja; ekspor CSV.'],
          ['Status Dosen', 'Satu-satunya tempat menetapkan status kepegawaian dosen (Dosen Tetap, Tidak Tetap, DPK, dan lainnya).'],
          ['Pengaturan Shift', 'Jam kerja dan toleransi keterlambatan.'],
          ['Rekap Absensi', 'Rekap kehadiran pagi/sore per bulan atau tahun, dengan impor Excel dan ekspor CSV.'],
        ],
      },
    ],
  },
  {
    id: 'peran-lp3m',
    group: 'Panduan per Peran',
    title: 'LP3M',
    summary: 'Penelitian, pengabdian, HAKI, dokumen, dan borang.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Laporan Penelitian / Pengabdian', 'Verifikasi laporan kegiatan. Status: Menunggu Verifikasi, Terverifikasi, Perlu Perbaikan.'],
          ['Sentra HAKI & Paten', 'Pencatatan hak cipta, paten, desain industri.'],
          ['Bank Dokumen Panduan', 'Dokumen dengan tingkat akses Publik, Dosen & Reviewer, atau Khusus Tim LP3M.'],
          ['Rekap Borang Akreditasi', 'Rekap pendukung borang.'],
          ['Berita & Pengumuman', 'Berita unit LP3M (hanya tulisan sendiri).'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Yang tampil di situs p3m.',
        text: 'Hanya kegiatan berstatus Terverifikasi, HAKI berstatus Tersertifikasi, dan dokumen berakses Publik. NIDN, anggaran per kegiatan, dan catatan reviewer tidak ditampilkan.',
      },
    ],
  },
  {
    id: 'peran-p2m',
    group: 'Panduan per Peran',
    title: 'P2M (Penjaminan Mutu)',
    summary: 'Standar mutu, audit internal, validasi RPS, dan tindak lanjut.',
    blocks: [
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Standar Mutu', 'Standar SPMI per kategori dengan indikator dan target; status Aktif/Nonaktif.'],
          ['Audit Mutu Internal', 'Penjadwalan dan hasil audit per prodi (Sesuai, Temuan Minor, Temuan Mayor).'],
          ['Validasi RPS', 'Mengesahkan RPS yang diajukan dosen.'],
          ['Tindak Lanjut Audit', 'Memantau tindak lanjut temuan sampai selesai.'],
          ['Dokumen Mutu', 'Pedoman, regulasi, template borang, instrumen AMI.'],
          ['Berita & Pengumuman', 'Berita unit P2M (hanya tulisan sendiri).'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Yang tampil di situs p2m.',
        text: 'Standar mutu Aktif, dokumen berakses Publik, ringkasan hasil audit secara agregat, dan jadwal audit mendatang. Temuan per program studi tidak ditampilkan.',
      },
    ],
  },

  // =====================================================================
  // PROSES BISNIS
  // =====================================================================
  {
    id: 'siklus-semester',
    group: 'Proses Bisnis',
    title: 'Siklus Semester',
    summary: 'Urutan kerja dari penyiapan tahun akademik hingga nilai terbit.',
    blocks: [
      {
        t: 'ol',
        items: [
          'BAAK menetapkan Tahun Akademik/semester aktif beserta jendela tanggal KRS dan penginputan nilai.',
          'BAAK/Prodi menyiapkan kelas kuliah (mata kuliah, dosen pengampu, jadwal, ruang) dan Jadwal Ujian.',
          'Mahasiswa mengisi KRS pada jendela yang dibuka; dosen PA menyetujui.',
          'Dosen menyusun Kontrak Kuliah dan RPS (P2M mengesahkan RPS).',
          'Perkuliahan berjalan: dosen mengisi absensi; mahasiswa memantau presensi (syarat minimal 75% untuk ujian).',
          'UTS dan UAS dilaksanakan sesuai jadwal ujian dan pengawas.',
          'Dosen menginput nilai di dalam jendela waktu; di luar jendela, input terkunci otomatis.',
          'BAAK memantau/mengoreksi nilai; mahasiswa melihat KHS dan IPK.',
          'Kelas, KRS, nilai, dan AKM dikirim ke Feeder (lihat Sinkronisasi Feeder).',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Jendela waktu',
        text: 'KRS terbuka bila tahun akademik aktif dan tanggal sekarang berada dalam rentang krsStartDate–krsEndDate. Jika rentang tidak diisi, KRS dianggap terbuka.',
      },
    ],
  },
  {
    id: 'skripsi',
    group: 'Proses Bisnis',
    title: 'Tugas Akhir / Skripsi',
    summary: 'Alur bertahap dari proposal sampai nilai akhir.',
    blocks: [
      {
        t: 'p',
        text: 'Setiap tahap divalidasi server sehingga tidak ada langkah yang dapat dilompati (mis. tidak bisa daftar sidang sebelum di-ACC, nilai hanya bisa diinput setelah jadwal ditetapkan).',
      },
      {
        t: 'table',
        head: ['Tahap', 'Arti', 'Pelaku berikutnya'],
        rows: [
          ['PROPOSAL_SUBMITTED', 'Proposal diajukan, menunggu plotting pembimbing', 'BAAK menetapkan pembimbing atau menolak'],
          ['PROPOSAL_REJECTED', 'Proposal ditolak BAAK', 'Mahasiswa mengajukan ulang'],
          ['PROPOSAL_GUIDANCE', 'Pembimbing ditetapkan; bimbingan proposal', 'Mahasiswa & pembimbing'],
          ['PROPOSAL_APPROVED', 'Proposal di-ACC semua pembimbing', 'Mahasiswa daftar seminar proposal'],
          ['SEMPRO_REGISTERED', 'Sudah daftar sempro, menunggu jadwal', 'BAAK menjadwalkan dan memilih penguji'],
          ['SEMPRO_SCHEDULED', 'Jadwal dan penguji sempro ditetapkan', 'Pelaksanaan sempro'],
          ['SKRIPSI_GUIDANCE', 'Sempro selesai; bimbingan skripsi', 'Mahasiswa & pembimbing'],
          ['SKRIPSI_APPROVED', 'Skripsi di-ACC pembimbing', 'Mahasiswa daftar ujian skripsi'],
          ['UJIAN_REGISTERED', 'Sudah daftar ujian, menunggu jadwal', 'BAAK menjadwalkan dan memilih penguji'],
          ['UJIAN_SCHEDULED', 'Jadwal dan penguji ujian ditetapkan', 'BAAK menginput nilai setelah ujian'],
          ['COMPLETED', 'Nilai akhir sudah diinput', '-'],
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'ACC pembimbing berlaku bila semua pembimbing yang ditetapkan sudah menyetujui. Prodi hanya memantau tahapan mahasiswa prodinya.',
      },
    ],
  },
  {
    id: 'yudisium',
    group: 'Proses Bisnis',
    title: 'Yudisium & Kelulusan',
    summary: 'Syarat, verifikasi, dan dampaknya pada status mahasiswa.',
    blocks: [
      {
        t: 'p',
        text: 'Mahasiswa mendaftar yudisium dari portalnya. Sistem mengecek lima syarat secara otomatis sebelum pendaftaran diterima:',
      },
      {
        t: 'ul',
        items: [
          'Berstatus mahasiswa aktif.',
          'SKS lulus minimal sesuai kurikulum (bawaan 144 SKS bila tidak ditentukan lain).',
          'IPK minimal 2,00. SKS lulus dan IPK dihitung dari nilai terbaik tiap mata kuliah, jadi mengulang tidak merugikan.',
          'Tugas akhir/skripsi selesai.',
          'Tidak ada tagihan yang belum lunas.',
        ],
      },
      {
        t: 'table',
        head: ['IPK', 'Predikat'],
        rows: [
          ['3,51 – 4,00', 'Dengan Pujian (Cum Laude)'],
          ['3,01 – 3,50', 'Sangat Memuaskan'],
          ['2,76 – 3,00', 'Memuaskan'],
          ['2,00 – 2,75', 'Cukup'],
        ],
      },
      {
        t: 'p',
        text: 'BAAK memverifikasi pendaftar, menetapkan tanggal lulus dan nomor SK, lalu menyetujui. Saat disetujui, status mahasiswa otomatis menjadi Lulus (GRADUATED). Penolakan memungkinkan mahasiswa mengajukan kembali.',
      },
    ],
  },
  {
    id: 'feeder',
    group: 'Proses Bisnis',
    title: 'Sinkronisasi Feeder (PDDIKTI)',
    summary: 'Tarik, bandingkan, dan kirim data ke Neo Feeder dengan urutan yang benar.',
    blocks: [
      {
        t: 'p',
        text: 'Menu: Admin BAAK → Pelaporan & Integrasi → Sinkronisasi Feeder. Pengaturan koneksi ada di Super Admin → Pengaturan DIKTI.',
      },
      {
        t: 'h3',
        text: 'Urutan yang disarankan',
      },
      {
        t: 'ol',
        items: [
          'Tahun Akademik & Periode Semester',
          'Dosen',
          'Mahasiswa',
          'Riwayat Pendidikan Mahasiswa',
          'Kurikulum & Mata Kuliah',
          'Kelas Perkuliahan & Dosen Pengampu',
          'KRS & Rencana Studi Mahasiswa',
          'Nilai Perkuliahan Semester',
          'Aktivitas Kuliah Mahasiswa (AKM)',
        ],
      },
      {
        t: 'h3',
        text: 'Tab pada tiap entitas',
      },
      {
        t: 'table',
        head: ['Tab', 'Fungsi'],
        rows: [
          ['Tarik (Pull)', 'Mengambil data dari Feeder ke lokal. Data dicocokkan lewat ID Feeder yang stabil, lalu NIM/NIDN bila perlu. Email dari Feeder dipakai bila ada; email buatan sistem tidak dikirim balik ke Feeder.'],
          ['Kirim (Push)', 'Mengirim data lokal ke Feeder; dapat memilih baris dengan kotak centang. Tersedia untuk Mahasiswa, Riwayat Pendidikan, AKM, Kelas Perkuliahan (beserta dosen pengajar), KRS (peserta kelas), dan Nilai. Push Kelas/KRS/Nilai hanya dapat dijalankan Super Admin dan diproses per batch (50 kelas / 200 KRS / 200 nilai).'],
          ['Update ke Feeder', 'Satu tabel dengan kolom Perbandingan yang menampilkan selisih (mis. NIK berbeda) dan mengurutkan yang berbeda di atas. Bandingkan dahulu, lalu perbarui yang perlu.'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Semua tabel besar memakai pagination, pencarian, dan urutan di sisi server.',
          'Kolom status menandai data yang sudah tersinkron.',
          'Nilai dan KRS diproses per semester karena penarikan tanpa filter semester sangat lambat (sekitar 15 detik per 500 baris).',
          'Proses panjang berjalan sebagai job latar belakang agar tidak terkena timeout Cloudflare.',
        ],
      },
      {
        t: 'h3',
        text: 'Syarat dan perilaku Push Kelas, KRS, dan Nilai',
      },
      {
        t: 'ul',
        items: [
          'Urutan wajib: Mata Kuliah → Kelas → KRS → Nilai. Mahasiswa harus sudah punya registrasi (riwayat pendidikan) di Feeder.',
          'Feeder hanya menerima perubahan untuk semester yang periodenya aktif; selain itu ditolak dengan pesan "Periode data di luar periode aktif".',
          'Kelas: nama kelas maksimal 5 karakter; mata kuliah harus tergabung dalam kurikulum prodi di Feeder. Dosen pengajar ikut dikirim bila dosen punya ID Feeder dan penugasannya di tahun itu ada di Feeder; bila tidak, kelas tetap terdaftar dan alasannya dicatat per baris.',
          'KRS: hanya yang berstatus Disetujui. Peserta yang sudah ada di Feeder hanya ditautkan (tidak dobel).',
          'Nilai: hanya nilai berstatus Terbit untuk peserta yang sudah terdaftar di kelas Feeder.',
          'Setiap baris yang gagal mencatat alasannya dan dapat dicoba lagi pada proses berikutnya.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Hati-hati',
        text: 'Push dan Update mengubah data resmi di PDDIKTI. Lakukan Bandingkan terlebih dahulu dan periksa selisihnya sebelum mengirim.',
      },
    ],
  },

  // =====================================================================
  // SITUS PUBLIK
  // =====================================================================
  {
    id: 'situs-utama',
    group: 'Situs Publik',
    title: 'Situs Utama (web)',
    summary: 'Halaman publik kampus dan dari mana setiap bagian mengambil datanya.',
    blocks: [
      {
        t: 'table',
        head: ['Halaman / bagian', 'Sumber data', 'Dikelola oleh'],
        rows: [
          ['Hero, sambutan rektor, kontak, footer', 'Pengaturan landing page / Profil Institusi', 'Super Admin'],
          ['Beranda → Agenda', 'Kalender Akademik (acara yang belum lewat, bukan Selesai)', 'Super Admin'],
          ['Beranda → Berita; /berita; /berita/[slug]', 'Berita terbit; pengunggah tampil sebagai role/unit', 'BAAK, Prodi, PMB, P2M, LP3M'],
          ['Beranda → Fakultas; /fakultas; /fakultas/[kode]', 'Fakultas dan program studi aktif, dekan, visi dan misi', 'Super Admin'],
          ['/program-studi/[kode]', 'Prodi, kaprodi, visi dan misi, kurikulum dan mata kuliah aktif', 'Super Admin, BAAK'],
          ['Menu Layanan', 'Tautan Portal Akademik, P2M, dan LP3M (dihitung dari domain saat ini)', 'Konfigurasi'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Menu Fakultas pada navbar berupa dropdown berisi semua fakultas dari database beserta jumlah prodinya.',
          'Grup Layanan memuat portal-portal layanan; PMB tetap berdiri sendiri sebagai menu dan tombol Daftar PMB.',
          'Bila data belum ada, setiap bagian menampilkan keterangan "belum ada" dan bukan data contoh.',
          'Bagian Program Studi di beranda dan beberapa teks marketing lain masih berisi contoh statis di kode.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        title: 'Cache 60 detik',
        text: 'Halaman publik diambil ulang paling lambat tiap 60 detik. Setelah mengubah data, tunggu sampai satu menit sebelum menyimpulkan perubahan tidak tampil.',
      },
    ],
  },
  {
    id: 'situs-subdomain',
    group: 'Situs Publik',
    title: 'Situs PMB, P2M, dan LP3M',
    summary: 'Tiga situs terpisah pada subdomain masing-masing.',
    blocks: [
      {
        t: 'table',
        head: ['Subdomain', 'Isi', 'Sumber data'],
        rows: [
          ['pmb.', 'Pendaftaran akun, verifikasi email, login, dasbor seleksi pendaftar, dan live chat dengan panitia', 'Modul PMB; link lama /pmb, /daftar, /register di domain utama dialihkan permanen (308) ke sini'],
          ['p2m.', 'Siklus PPEPP, standar mutu aktif per kategori, ringkasan dan jadwal audit, pustaka dokumen publik', 'GET /p2m/public/landing'],
          ['p3m.', 'Statistik, sebaran bidang fokus, penelitian dan pengabdian terverifikasi (filter jenis/tahun), HAKI tersertifikasi, dokumen publik', 'GET /lp3m/public/landing'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Tombol login pada p2m. dan p3m. mengarah ke portal pada domain yang sama (portal.<domain>/login).',
          'Tombol Unduh pada dokumen menambah hitungan unduhan di database.',
          'Dokumen dengan akses selain Publik, standar nonaktif, laporan yang belum terverifikasi, dan temuan audit per prodi tidak pernah dikirim ke situs publik.',
        ],
      },
    ],
  },

  // =====================================================================
  // OPERASIONAL
  // =====================================================================
  {
    id: 'backup',
    group: 'Operasional',
    title: 'Backup & Pemulihan',
    summary: 'Membuat, mengunduh, dan memulihkan backup database.',
    blocks: [
      {
        t: 'p',
        text: 'Menu: Super Admin → Pengaturan Sistem → Backup Database. Backup dibuat dengan pg_dump format custom (-Fc) sehingga sudah terkompresi.',
      },
      {
        t: 'ul',
        items: [
          'Backup Sekarang: membuat berkas manual (siakad-manual-AAAAMMDD-JJMMDD.dump).',
          'Otomatis: sekali sehari setelah pukul 02.00 (jam server); berkas siakad-auto-… Hanya 14 backup otomatis terakhir disimpan.',
          'Daftar menampilkan jenis, waktu, dan ukuran; tiap baris dapat diunduh atau dihapus.',
          'Lokasi berkas: folder BACKUP_DIR (di Docker: volume api_backups pada /app/backups).',
        ],
      },
      {
        t: 'table',
        head: ['Variabel', 'Fungsi', 'Bawaan'],
        rows: [
          ['BACKUP_DIR', 'Folder penyimpanan backup', './backups (Docker: /app/backups)'],
          ['BACKUP_AUTO', 'Isi false untuk mematikan backup otomatis', 'aktif'],
          ['BACKUP_AUTO_HOUR', 'Jam mulai backup otomatis', '2'],
          ['BACKUP_RETENTION', 'Jumlah backup otomatis yang disimpan', '14'],
          ['BACKUP_DOCKER_CONTAINER', 'Khusus dev: jalankan pg_dump lewat container postgres tertentu', '-'],
          ['PG_DUMP_BIN', 'Lokasi pg_dump bila tidak ada di PATH', 'pg_dump'],
        ],
      },
      { t: 'h3', text: 'Memulihkan backup' },
      {
        t: 'p',
        text: 'Pemulihan sengaja tidak tersedia di portal karena dapat menimpa seluruh data. Lakukan dari server:',
      },
      {
        t: 'code',
        lang: 'bash',
        text: '# hentikan API lebih dulu, lalu:\npg_restore --clean --if-exists --no-owner -U siakad -d siakad_premium /path/siakad-manual-20261016-120000.dump',
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Salinan di luar server',
        text: 'Backup yang hanya tersimpan di server yang sama tidak melindungi dari kerusakan server. Unduh berkala atau salin volume api_backups ke penyimpanan lain.',
      },
    ],
  },
  {
    id: 'email',
    group: 'Operasional',
    title: 'Email Notifikasi (SMTP)',
    summary: 'Konfigurasi pengiriman email verifikasi dan reset kata sandi.',
    blocks: [
      {
        t: 'p',
        text: 'Konfigurasi SMTP hanya dibaca dari berkas .env di server; tidak ada pengaturan email di portal. Isi variabel berikut lalu jalankan ulang container API.',
      },
      {
        t: 'code',
        lang: 'env',
        text: 'MAIL_HOST=smtp.contoh.ac.id\nMAIL_PORT=587\nMAIL_USERNAME=noreply@contoh.ac.id\nMAIL_PASSWORD=********\nMAIL_FROM_ADDRESS=noreply@contoh.ac.id\nMAIL_FROM_NAME="Nama Institusi"',
      },
      {
        t: 'ul',
        items: [
          'Tidak ada lagi kredensial cadangan di kode: tanpa MAIL_HOST, MAIL_USERNAME, dan MAIL_PASSWORD, email tidak terkirim.',
          'Email yang dikirim: verifikasi akun PMB dan reset kata sandi pendaftar.',
          'Setelah mengubah .env, jalankan ulang container API.',
        ],
      },
    ],
  },
  {
    id: 'tanda-tangan',
    group: 'Operasional',
    title: 'Aturan Tanda Tangan',
    summary: 'Cara kerja dan cakupan penerapan saat ini.',
    blocks: [
      {
        t: 'p',
        text: 'Setiap jenis dokumen (KHS, KRS, SIP, SKAK, SKBB, SKBP, SKP, SRB, dst.) dapat diberi satu atau dua penandatangan: Dosen PA, Ketua Program Studi, Dekan, atau pimpinan institusi. Nama dan jabatan diturunkan dari data mahasiswa/prodi/fakultas saat dokumen dicetak; bila data belum diisi, dokumen menampilkan jabatan tanpa nama.',
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Cakupan penerapan',
        text: 'Aturan dipakai pada pratinjau surat mahasiswa (penandatangan 1 dan 2) dan pada blok tanda tangan KHS yang ikut tercetak. KRS belum memiliki tampilan cetak sehingga aturannya belum dipakai. Mengelola aturan (tambah/ubah/hapus) hanya untuk Super Admin.',
      },
    ],
  },
  {
    id: 'integrasi-obe',
    group: 'Operasional',
    title: 'Integrasi OBE',
    summary: 'Menghubungkan SIAKAD dengan OBE dan menampilkan capaian CPL di portal mahasiswa.',
    blocks: [
      { t: 'p', text: 'OBE (Outcome-Based Education) dijual terpisah dan dapat berdiri sendiri. Bila kampus memakai SIAKAD NEXTVERSA dan OBE, OBE membaca data akademik langsung dari database SIAKAD melalui view baca-saja, tanpa tarik data manual, dan SIAKAD tidak berubah alurnya. Halaman Integrasi OBE di menu Pengaturan Sistem menunjukkan statusnya.' },
      {
        t: 'table',
        head: ['Status', 'Arti'],
        rows: [
          ['Belum terintegrasi', 'Kampus belum memakai OBE. SIAKAD berjalan seperti biasa.'],
          ['Siap diintegrasikan', 'Data untuk OBE sudah disediakan; menunggu OBE dipasang dan terhubung.'],
          ['Terintegrasi', 'Akun database OBE aktif dan OBE terlihat membaca atau menyala.'],
        ],
      },
      { t: 'h3', text: 'Yang disiapkan SIAKAD' },
      {
        t: 'ul',
        items: [
          'Skema obe_api di database SIAKAD berisi view baca-saja (mahasiswa, dosen, mata kuliah, kurikulum, periode, kelas, KRS, komponen nilai, nilai, dan akun). Dipasang otomatis setiap API menyala.',
          'Akun database obe_reader yang hanya boleh membaca view itu, tanpa hak login sampai OBE dipasang. Mengaktifkannya: ALTER ROLE obe_reader LOGIN PASSWORD (kata sandi kuat).',
          'Database kosong bernama obe di server yang sama untuk OBE (nama dapat diubah lewat OBE_DATABASE_NAME).',
          'Bila logo kampus ingin tampil di OBE, isi SIAKAD_PUBLIC_URL (alamat publik SIAKAD) agar alamat logo menjadi lengkap.',
        ],
      },
      { t: 'h3', text: 'Capaian OBE di portal mahasiswa' },
      { t: 'p', text: 'Isi OBE_API_URL (alamat API OBE) dan OBE_PORTAL_API_KEY (kunci yang sama dengan di server OBE) pada server SIAKAD, lalu mulai ulang. Menu Capaian OBE (CPL), kartu di dashboard, dan tombol cetak PDF muncul di portal mahasiswa. Tanpa kedua variabel itu portal tidak menampilkan apa pun tentang OBE. SIAKAD memanggil OBE dari servernya; kunci tidak sampai ke browser, dan setiap mahasiswa hanya dapat melihat miliknya sendiri.' },
      {
        t: 'note',
        kind: 'info',
        title: 'Login dan tanda tangan',
        text: 'Pengguna SIAKAD dapat masuk ke OBE dengan email, NIDN, atau NUPTK dan kata sandi SIAKAD. Penandatangan laporan capaian diatur di Aturan Tanda Tangan (jenis dokumen Laporan Capaian OBE).',
      },
      { t: 'p', text: 'Dokumentasi teknis lengkap (kolom view, endpoint, dan contoh jawaban) ada di docs/integrasi-obe.md pada repositori SIAKAD.' },
    ],
  },
  {
    id: 'deployment',
    group: 'Operasional',
    title: 'Deployment & Server',
    summary: 'Satu berkas .env, Docker Compose, CI/CD, dan routing Cloudflare.',
    blocks: [
      {
        t: 'h3',
        text: 'Satu berkas .env untuk semua layanan',
      },
      {
        t: 'p',
        text: 'Semua layanan membaca satu berkas /srv/projects/siakadpremium/.env. Template-nya .env.prod.example. Jangan menaruh PORT di berkas ini: tiap Dockerfile sudah menetapkan port sendiri dan PORT bersama akan membuat container bentrok.',
      },
      {
        t: 'table',
        head: ['Variabel', 'Fungsi'],
        rows: [
          ['NEXT_PUBLIC_API_URL', 'Harus /api/v1 agar browser memanggil API lewat domain yang sama.'],
          ['INTERNAL_API_URL', 'Alamat API di jaringan Docker (http://api:3001/api/v1) untuk SSR dan rewrite.'],
          ['NEXT_PUBLIC_WEB_URL / PORTAL_URL / APP_URL', 'Alamat publik untuk tautan antar aplikasi dan email.'],
          ['DATABASE_URL, REDIS_*', 'Koneksi PostgreSQL dan Redis di jaringan Docker.'],
          ['JWT_SECRET, JWT_REFRESH_SECRET', 'Rahasia penandatanganan token. Ganti dengan nilai acak yang kuat di produksi.'],
          ['UPLOAD_PATH', 'Folder unggahan (Docker: /app/uploads, volume api_uploads).'],
          ['MAIL_*', 'Konfigurasi SMTP.'],
          ['BACKUP_*', 'Konfigurasi backup (opsional).'],
        ],
      },
      { t: 'h3', text: 'Alur CI/CD' },
      {
        t: 'ol',
        items: [
          'Push ke cabang main memicu GitHub Actions: build image api, web, pmb, p2m, p3m, dan portal, lalu mendorongnya ke GHCR.',
          'Job deploy (runner self-hosted) menyalin docker-compose.prod.yml, menyiapkan .env bila belum ada, menarik image terbaru, dan menjalankan ulang container.',
          'Skema database disinkronkan dengan prisma db push setelah container berjalan.',
        ],
      },
      { t: 'h3', text: 'Routing subdomain' },
      {
        t: 'table',
        head: ['Subdomain', 'Arahkan ke (port host)'],
        rows: [
          ['domain utama', 'localhost:3100 (web)'],
          ['portal.', 'localhost:3102'],
          ['pmb.', 'localhost:3103'],
          ['p2m.', 'localhost:3104'],
          ['p3m.', 'localhost:3105'],
          ['api. (opsional)', 'localhost:3101'],
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Sebelum deploy aplikasi baru',
        text: 'Buat dulu route Cloudflare Tunnel untuk subdomain barunya (pmb., p2m., p3m.). Tanpa route, container berjalan tetapi alamatnya tidak dapat dibuka.',
      },
      { t: 'h3', text: 'Perintah umum pengembangan' },
      {
        t: 'code',
        lang: 'bash',
        text: 'pnpm install                     # pasang dependensi\npnpm dev                         # jalankan semua aplikasi (turbo)\npnpm db:push                     # terapkan skema Prisma ke database\npnpm db:generate                 # buat ulang Prisma Client\npnpm --filter @siakad/p3m dev    # jalankan satu aplikasi',
      },
      {
        t: 'note',
        kind: 'tip',
        title: 'Prisma generate gagal (EPERM) di Windows',
        text: 'Hentikan API lebih dulu (berkas query_engine terkunci saat API berjalan), jalankan db:generate, lalu nyalakan API kembali.',
      },
    ],
  },
  {
    id: 'keamanan',
    group: 'Operasional',
    title: 'Keamanan & Audit',
    summary: 'Mekanisme perlindungan yang berlaku dan hal yang perlu diperhatikan.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Autentikasi memakai JWT; endpoint login dibatasi 10 percobaan per menit dan seluruh API dibatasi 120 permintaan per menit per alamat.',
          'Penjaga global (GlobalAuthGuard): SEMUA endpoint wajib membawa token yang valid kecuali daftar publik di apps/api/src/common/guards/global-auth.guard.ts (situs publik, login, berkas bertanda tangan, serta pendaftaran/login/opsi PMB dan memulai live chat tamu). Tambahkan ke daftar itu hanya bila memang untuk publik.',
          'Pembatasan peran pada kelompok sensitif: /users dan pengelolaan aturan tanda tangan (Super Admin); /employees dan /shifts (SDM); /finance (Keuangan, kecuali tagihan/transaksi yang juga diakses mahasiswa); /admissions (Panitia PMB/BAAK); /lp3m dan /p2m (unit masing-masing). Mengubah fakultas/program studi hanya Super Admin.',
          'Pembatasan laju (rate limit) dihitung per alamat klien sungguhan (header Cloudflare/X-Forwarded-For), bukan alamat proxy, sehingga pengguna tidak saling memblokir. Live chat tamu: 5 percakapan baru per jam per alamat, kolom honeypot, dan token tamu (PMB_VISITOR, 7 hari) yang hanya sah untuk endpoint chat.',
          'Pendaftar PMB memakai JWT sungguhan (peran PMB_APPLICANT, berlaku 7 hari) yang hanya sah untuk /admissions/pmb/*; identitas pendaftar selalu dari token dan tagihan hanya bisa dibayar oleh pemiliknya. Token lama berbentuk pmb_token_... tidak berlaku lagi (pendaftar perlu login ulang sekali).',
          'Mahasiswa hanya dapat melihat tagihannya sendiri dan mengirim bukti bayar untuk tagihannya; dosen hanya dapat melihat dan mengisi nilai kelas yang ia ampu; pengunci nilai semester hanya BAAK.',
          'Portal menyisipkan token otomatis pada setiap panggilan ke /api/v1; halaman yang dulu mengambil data di server kini mengambilnya di browser dengan token.',
          'Berita: membuat memerlukan peran BAAK/Prodi/PMB/P2M/LP3M/Super Admin; mengubah/menghapus dibatasi pemilik untuk Prodi, PMB, P2M, dan LP3M.',
          'Unggahan berkas wajib login dan setiap berkas dicatat di tabel uploaded_files (siapa, kapan, ukuran, folder). Berkas publik hanya yang diunggah dengan isPrivate=false.',
          'Berita mencatat penulis (authorId dan role publik) dan pengubah terakhir (updatedById).',
          'Backup dan pengaturan integrasi hanya untuk Super Admin.',
          'Halaman publik hanya menerima data yang sudah disaring di API (mis. tanpa NIDN, anggaran, catatan reviewer, atau nama akun).',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Keterbatasan yang diketahui',
        text: 'Kepemilikan data sudah dijaga untuk jalur utama (tagihan mahasiswa, nilai dan kelas dosen, data pendaftar PMB) dan pembatasan peran untuk operasi tulis di modul akademik, surat, dan master data. Endpoint baca lain yang hanya "harus login" (mis. daftar tahun akademik atau detail dosen) masih dapat dibaca peran mana pun yang sudah login. Tinjau ulang bila ada data yang sangat sensitif di luar yang disebut.',
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Rahasia',
        text: 'Ganti JWT_SECRET, JWT_REFRESH_SECRET, kata sandi database/Redis, dan kredensial SMTP dari nilai contoh. Kata sandi SMTP lama pernah tertulis di kode sehingga ada di riwayat git; ganti di penyedia SMTP.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    group: 'Operasional',
    title: 'Pemecahan Masalah',
    summary: 'Gejala umum, penyebab, dan cara memperbaikinya.',
    blocks: [
      {
        t: 'table',
        head: ['Gejala', 'Penyebab umum', 'Tindakan'],
        rows: [
          ['Portal: "Failed to proxy … ECONNREFUSED", halaman HTTP 500', 'API mati atau sedang dikompilasi ulang (mode watch)', 'Tunggu ±1 menit setelah ubah kode API; jika tetap, jalankan ulang API dan baca lognya.'],
          ['Endpoint baru 404 padahal sudah dibuat', 'API belum direstart', 'Restart API.'],
          ['Kartu Backup HTTP 500 / gagal', 'pg_dump tidak ada di server API', 'Docker: image terbaru sudah memuat postgresql-client; dev: set BACKUP_DOCKER_CONTAINER.'],
          ['Email PMB tidak terkirim', 'MAIL_* belum lengkap', 'Lengkapi MAIL_* di .env lalu restart API.'],
          ['Perubahan data tidak tampil di situs publik', 'Cache halaman 60 detik', 'Tunggu satu menit lalu muat ulang.'],
          ['Subdomain tidak bisa dibuka', 'Route Cloudflare belum dibuat atau container belum berjalan', 'Tambahkan route ke port host yang benar; cek docker compose ps.'],
          ['Feeder: "Tidak ditemukan di Feeder"', 'ID Feeder belum tertaut', 'Tarik data dari Feeder dahulu agar tertaut, lalu bandingkan.'],
          ['Sinkronisasi nilai/KRS sangat lambat', 'Penarikan tanpa filter semester', 'Proses per semester; gunakan job latar belakang.'],
          ['Prisma generate EPERM', 'API menahan berkas query engine', 'Hentikan API, generate, nyalakan lagi.'],
          ['Admin Prodi melihat data kosong', 'Akun belum dikaitkan ke program studi', 'Set program studi pada akun di menu User.'],
          ['Dekan/Kaprodi "Belum ditetapkan"', 'Jabatan struktural dosen belum diisi', 'Isi jabatan struktural pada data dosen.'],
          ['Gambar berita tidak muncul', 'Rewrite /uploads belum aktif atau berkas privat', 'Pastikan next.config memuat rewrite /uploads/public dan berkas diunggah sebagai publik.'],
        ],
      },
    ],
  },
  {
    id: 'referensi',
    group: 'Operasional',
    title: 'Referensi Teknis',
    summary: 'Struktur proyek dan titik masuk penting bagi pengembang.',
    blocks: [
      {
        t: 'code',
        lang: 'text',
        text: 'apps/\n  api/      NestJS: modul per domain (academic, students, lecturers, thesis, graduation, exams,\n            prodi, admissions, finance, letters, lp3m, p2m, landing-page, backups, storage, ...)\n  web/      Situs publik (Next.js)\n  portal/   Portal login + semua dashboard (Next.js)\n  pmb/      Portal pendaftar PMB\n  p2m/      Situs publik Penjaminan Mutu\n  p3m/      Situs publik LP3M\npackages/\n  database/ Skema Prisma dan klien (@siakad/database)\n  types/    Konstanta peran dan tipe bersama (@siakad/types)\n  utils/    Utilitas bersama',
      },
      {
        t: 'ul',
        items: [
          'Prefix API: /api/v1. Swagger: /api/docs.',
          'Tabel besar di portal memakai hook useServerTable dan komponen TablePagination; endpoint menerima page, pageSize, search, sortKey, sortDir.',
          'Menu setiap peran didefinisikan di components/layout/PortalLayout.tsx; pembatasan rute di lib/auth.ts (isRouteAllowedForRole).',
          'Skema database tidak memakai folder migrasi: perubahan diterapkan dengan prisma db push.',
          'Dokumentasi ini ada di apps/portal/src/lib/docs/superadmin-docs.ts.',
          'Catatan pembaruan (menu Updates) ada di apps/portal/src/lib/updates/changelog.ts: tambahkan entri baru di paling atas setiap rilis; status baca disimpan per browser.',
        ],
      },
    ],
  },
];
