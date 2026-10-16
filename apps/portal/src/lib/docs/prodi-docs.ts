import type { DocSection } from './types';

export const PRODI_DOCS_VERSION = 'Oktober 2026';

export const PRODI_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran Admin Program Studi',
    summary: 'Apa yang dapat dilihat dan dikerjakan.',
    blocks: [
      {
        t: 'p',
        text: 'Admin Prodi memantau data program studinya sendiri: mahasiswa, dosen, mata kuliah, jadwal dan kelas, tugas akhir, dan yudisium, serta dapat menulis berita prodi untuk situs publik.',
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Terkunci ke satu program studi',
        text: 'Program studi diturunkan dari akun Anda di server. Anda tidak dapat melihat prodi lain, bahkan bila alamat halaman diubah. Jika dashboard kosong, minta Super Admin mengaitkan akun Anda dengan program studi.',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama Prodi', 'Dashboard Prodi.'],
          ['Data Program Studi', 'Data Mahasiswa, Data Dosen.'],
          ['Kurikulum & Perkuliahan', 'Mata Kuliah, Jadwal & Kelas.'],
          ['Tugas Akhir & Kelulusan', 'Tugas Akhir/Skripsi, Yudisium & Kelulusan.'],
          ['Informasi', 'Berita & Pengumuman.'],
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    group: 'Data Program Studi',
    title: 'Dashboard Prodi',
    summary: 'Identitas dan statistik prodi.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Identitas: kode prodi, jenjang, akreditasi, Ketua Program Studi, dan status.',
          'Statistik real-time: mahasiswa aktif, dosen, mata kuliah dalam katalog, dan kelas berjalan semester ini.',
          'Rincian status mahasiswa (aktif, cuti, lulus, dan lainnya).',
          'Tombol Segarkan Data memuat ulang angka terbaru.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Jika Ketua Program Studi tertulis "Belum ditetapkan", minta BAAK atau Super Admin menetapkan jabatan struktural Kaprodi pada data dosen.',
      },
    ],
  },
  {
    id: 'data',
    group: 'Data Program Studi',
    title: 'Data Mahasiswa & Dosen',
    summary: 'Memantau mahasiswa dan dosen prodi.',
    blocks: [
      { t: 'h3', text: 'Data Mahasiswa' },
      {
        t: 'ul',
        items: [
          'Menampilkan angkatan, status, dosen PA, SKS lulus, dan IPK.',
          'Cari berdasarkan NIM atau nama; saring menurut status dan angkatan; urutkan kolom. Semuanya dihitung di server sehingga cepat walau datanya banyak.',
        ],
      },
      { t: 'h3', text: 'Data Dosen' },
      {
        t: 'ul',
        items: [
          'Dosen homebase prodi beserta jabatan dan status kepegawaian (hanya-baca).',
          'Jumlah mahasiswa bimbingan PA dan beban mengajar semester aktif (jumlah kelas dan SKS).',
        ],
      },
      { t: 'note', kind: 'info', text: 'Halaman ini bersifat pemantauan; perubahan data induk dilakukan BAAK.' },
    ],
  },
  {
    id: 'kurikulum',
    group: 'Kurikulum & Perkuliahan',
    title: 'Mata Kuliah, Jadwal & Kelas',
    summary: 'Katalog mata kuliah dan kelas berjalan.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Mata Kuliah: kelola katalog mata kuliah prodi Anda (kurikulum, SKS, semester, kategori Tugas Akhir/Lapangan). Data otomatis terkunci ke prodi Anda.',
          'Jadwal & Kelas: kelas per semester untuk mata kuliah prodi, lengkap dengan dosen pengampu, jadwal, ruang, dan keterisian peserta terhadap kuota.',
        ],
      },
    ],
  },
  {
    id: 'ta-yudisium',
    group: 'Tugas Akhir & Kelulusan',
    title: 'Tugas Akhir & Yudisium',
    summary: 'Memantau progres tugas akhir dan kelulusan.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Tugas Akhir/Skripsi: tahapan tiap mahasiswa prodi (proposal, pembimbing, seminar, ujian, nilai akhir). Filter menurut tahap untuk mencari yang tertahan.',
          'Yudisium & Kelulusan: pendaftar prodi dengan SKS, IPK, predikat, dan status keputusan BAAK (Menunggu, Lulus, Ditolak).',
          'Keputusan akhir dan penjadwalan sidang dilakukan BAAK; Prodi memantau.',
        ],
      },
    ],
  },
  {
    id: 'berita',
    group: 'Informasi',
    title: 'Berita & Pengumuman Prodi',
    summary: 'Menulis berita yang tampil di situs publik.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Berita & Pengumuman lalu klik Tulis Berita Baru.',
          'Isi judul, kategori, ringkasan (maksimal 200 karakter), dan isi lengkap.',
          'Unggah gambar (JPG/PNG/WEBP, maksimal 5 MB).',
          'Simpan: berita langsung terbit, atau lepas centang "Langsung publikasikan" untuk menyimpannya sebagai draf.',
        ],
      },
      {
        t: 'ul',
        items: [
          'Anda hanya melihat dan mengelola berita tulisan Anda sendiri.',
          'Opsi berita unggulan tidak tersedia untuk Prodi (diatur BAAK/Super Admin).',
          'Di situs publik pengunggah tampil sebagai "Prodi <nama program studi Anda>".',
          'Situs publik memperbarui data paling lambat tiap 60 detik.',
        ],
      },
    ],
  },
  {
    id: 'faq',
    group: 'Bantuan',
    title: 'Pertanyaan Umum',
    summary: 'Masalah yang sering muncul.',
    blocks: [
      {
        t: 'table',
        head: ['Pertanyaan', 'Jawaban'],
        rows: [
          ['Dashboard atau tabel kosong', 'Akun belum dikaitkan ke program studi; hubungi Super Admin.'],
          ['Ingin mengubah data mahasiswa/dosen', 'Lakukan melalui BAAK; halaman Prodi bersifat pemantauan.'],
          ['Tidak bisa melihat berita orang lain', 'Memang dibatasi: hanya berita tulisan sendiri yang terlihat.'],
          ['Kaprodi tampil "Belum ditetapkan"', 'Tetapkan jabatan struktural KAPRODI pada data dosen (BAAK/Super Admin).'],
        ],
      },
    ],
  },
];
