import type { DocSection } from './types';

export const LP3M_DOCS_VERSION = 'Oktober 2026';

export const LP3M_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran LP3M',
    summary: 'Tugas dan menu Lembaga Penelitian & Pengabdian.',
    blocks: [
      {
        t: 'p',
        text: 'LP3M mengelola laporan penelitian dan pengabdian kepada masyarakat, kekayaan intelektual (HAKI/paten), bank dokumen panduan, dan rekap borang akreditasi. Data yang sudah terverifikasi ditampilkan di situs publik LP3M (subdomain p3m.).',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama LP3M', 'Dashboard LP3M.'],
          ['Tri Dharma & Riset', 'Laporan Penelitian, Pengabdian (PkM), Sentra HAKI & Paten.'],
          ['Regulasi & Dokumen', 'Bank Dokumen Panduan, Rekap Borang Akreditasi.'],
          ['Informasi', 'Berita & Pengumuman.'],
        ],
      },
    ],
  },
  {
    id: 'prioritas',
    group: 'Mulai',
    title: 'Prioritas Pekerjaan Anda',
    summary: 'Apa yang harus dikerjakan lebih dulu, kapan, dan di menu mana.',
    blocks: [
      { t: 'p', text: 'Pekerjaan utama LP3M adalah memverifikasi laporan yang masuk. Hanya data berstatus Terverifikasi (atau HAKI Tersertifikasi) yang tampil di situs publik.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Verifikasi laporan penelitian dan pengabdian yang berstatus Menunggu Verifikasi; minta perbaikan dengan catatan bila kurang', 'Mingguan, lebih sering saat akhir periode pelaporan', 'Laporan Penelitian, Pengabdian (PkM)'],
          ['P1 - Kerjakan lebih dulu', 'Pastikan tingkat akses tiap dokumen benar (Publik hanya untuk dokumen yang boleh diunduh umum)', 'Setiap kali mengunggah dokumen', 'Bank Dokumen Panduan'],
          ['P2 - Penting', 'Catat dan proses HAKI/paten hingga Tersertifikasi', 'Saat ada pengajuan', 'Sentra HAKI & Paten'],
          ['P2 - Penting', 'Siapkan rekap borang per program studi', 'Menjelang akreditasi', 'Rekap Borang Akreditasi'],
          ['P3 - Rutin', 'Catat kegiatan yang belum dilaporkan dosen', 'Bulanan', 'Laporan Penelitian, Pengabdian (PkM)'],
          ['P4 - Bila diperlukan', 'Tulis berita LP3M', 'Bila ada kabar', 'Berita & Pengumuman'],
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
        kind: 'warn',
        title: 'Privasi',
        text: 'NIDN, anggaran, dan catatan reviewer tidak ditampilkan di situs publik. Dokumen internal jangan diberi akses Publik.',
      },
    ],
  },
  {
    id: 'laporan',
    group: 'Tri Dharma & Riset',
    title: 'Laporan Penelitian & Pengabdian',
    summary: 'Mencatat dan memverifikasi laporan kegiatan.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Catat laporan kegiatan (judul, skema, bidang fokus, ketua, anggota, tahun, sumber dana, luaran, mitra) dari Dashboard atau menu Laporan.',
          'Dosen juga dapat mencatat kegiatan dari portalnya; laporan masuk dengan status Menunggu Verifikasi.',
          'Periksa kelengkapan lalu Verifikasi Laporan: setujui menjadi Terverifikasi, atau minta perbaikan dengan catatan (Perlu Perbaikan).',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Yang tampil di situs publik',
        text: 'Hanya kegiatan berstatus Terverifikasi. NIDN, anggaran, dan catatan reviewer tidak ditampilkan.',
      },
    ],
  },
  {
    id: 'haki',
    group: 'Tri Dharma & Riset',
    title: 'Sentra HAKI & Paten',
    summary: 'Pencatatan kekayaan intelektual.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Catat HAKI dengan jenis (Hak Cipta, Paten Sederhana, Paten Biasa, Desain Industri), inventor, fakultas, nomor pendaftaran, dan tahun.',
          'Status: Menunggu Verifikasi, Pemeriksaan Substantif, atau Tersertifikasi.',
          'Hanya HAKI Tersertifikasi yang tampil di situs publik; sertifikat dapat diunduh dari daftar.',
        ],
      },
    ],
  },
  {
    id: 'dokumen',
    group: 'Regulasi & Dokumen',
    title: 'Bank Dokumen & Borang',
    summary: 'Mengunggah dokumen panduan dan merekap borang.',
    blocks: [
      { t: 'h3', text: 'Bank Dokumen Panduan' },
      {
        t: 'ol',
        items: [
          'Klik Unggah Dokumen / Regulasi Baru.',
          'Isi judul, kategori (Panduan & Renstra, Regulasi & SK Rektor, Template Proposal, Instrumen Borang), versi, tahun, dan deskripsi, lalu pilih berkas.',
          'Tetapkan tingkat akses: Publik, Dosen & Reviewer, atau Khusus Tim LP3M.',
          'Klik Unggah & Publikasikan.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Hanya dokumen berakses Publik yang dapat diunduh di situs publik. Pastikan dokumen internal tidak diberi akses Publik.',
      },
      { t: 'h3', text: 'Rekap Borang Akreditasi' },
      { t: 'p', text: 'Rekap data pendukung borang per program studi; tersedia Cetak Ringkasan Borang, Ekspor Berkas Prodi, dan Ekspor Excel LKPS BAN-PT.' },
    ],
  },
  {
    id: 'berita',
    group: 'Informasi',
    title: 'Berita & Pengumuman',
    summary: 'Menulis berita LP3M untuk situs publik.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Isi judul, kategori, ringkasan (maksimal 200 karakter), isi lengkap, dan unggah gambar (maksimal 5 MB).',
          'Anda hanya melihat dan mengelola berita tulisan sendiri; opsi berita unggulan tidak tersedia.',
          'Di situs publik pengunggah tampil sebagai "LP3M".',
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
          ['Kegiatan tidak tampil di situs p3m.', 'Statusnya belum Terverifikasi (HAKI: belum Tersertifikasi). Verifikasi dulu, lalu tunggu hingga 1 menit.'],
          ['Dokumen tidak ada di situs publik', 'Tingkat akses bukan Publik atau berkas belum diunggah.'],
          ['Dosen tidak melihat kegiatannya', 'Laporan harus tercatat atas nama dosen dan menunggu verifikasi LP3M.'],
        ],
      },
    ],
  },
];
