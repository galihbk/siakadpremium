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
