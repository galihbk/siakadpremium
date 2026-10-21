import type { DocSection } from './types';

export const P2M_DOCS_VERSION = 'Oktober 2026';

export const P2M_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran P2M',
    summary: 'Siklus penjaminan mutu dan menu P2M.',
    blocks: [
      {
        t: 'p',
        text: 'P2M (Penjaminan Mutu) menjalankan Sistem Penjaminan Mutu Internal (SPMI) dengan siklus PPEPP: Penetapan standar, Pelaksanaan, Evaluasi (audit), Pengendalian (tindak lanjut), dan Peningkatan.',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama P2M', 'Dashboard P2M (pusat kendali penjaminan mutu).'],
          ['Penjaminan Mutu', 'Standar Mutu, Audit Mutu Internal, Validasi RPS, Tindak Lanjut Audit.'],
          ['Regulasi & Dokumen', 'Dokumen Mutu.'],
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
      { t: 'p', text: 'P2M menjalankan siklus PPEPP. Urutannya: tetapkan standar lebih dulu, lalu awasi pelaksanaan (validasi RPS), evaluasi lewat audit, dan kendalikan lewat tindak lanjut.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Tetapkan standar mutu dan pastikan statusnya Aktif', 'Awal tahun akademik', 'Standar Mutu'],
          ['P1 - Kerjakan lebih dulu', 'Validasi RPS yang diajukan dosen atau beri catatan revisi', 'Awal semester, lalu tiap ada pengajuan', 'Validasi RPS'],
          ['P2 - Penting', 'Jadwalkan Audit Mutu Internal tiap prodi', 'Sesuai siklus audit', 'Audit Mutu Internal'],
          ['P2 - Penting', 'Isi hasil audit (Sesuai, Temuan Minor, Temuan Mayor) dan batas waktu tindak lanjut', 'Setelah audit selesai', 'Audit Mutu Internal'],
          ['P3 - Rutin', 'Pantau dan perbarui status tindak lanjut sampai Selesai', 'Mingguan hingga temuan tuntas', 'Tindak Lanjut Audit'],
          ['P3 - Rutin', 'Unggah dokumen mutu terbaru dengan tingkat akses yang benar', 'Saat ada revisi dokumen', 'Dokumen Mutu'],
          ['P4 - Bila diperlukan', 'Tulis berita P2M', 'Bila ada kabar', 'Berita & Pengumuman'],
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
        title: 'Privasi',
        text: 'Situs publik hanya menampilkan ringkasan audit secara agregat dan jadwal mendatang. Temuan per program studi tidak ditampilkan.',
      },
    ],
  },
  {
    id: 'standar',
    group: 'Penjaminan Mutu',
    title: 'Standar Mutu',
    summary: 'Menetapkan standar SPMI.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Standar Mutu lalu klik Tambah Standar.',
          'Isi kode (mis. STD-01), nama, kategori (Akademik, Non-Akademik, Tata Kelola, Penelitian & PkM), deskripsi, indikator, target capaian, dan tahun akademik.',
          'Atur status Aktif atau Nonaktif; standar Nonaktif tidak tampil di situs publik.',
        ],
      },
    ],
  },
  {
    id: 'audit',
    group: 'Penjaminan Mutu',
    title: 'Audit Mutu Internal',
    summary: 'Menjadwalkan audit dan mencatat hasilnya.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Audit Mutu Internal (AMI) lalu tambah audit: prodi, tanggal, auditor, dan ruang lingkup.',
          'Perbarui status (Terjadwal, Berlangsung, Selesai) seiring pelaksanaan.',
          'Setelah audit, isi ringkasan temuan dan hasil (Sesuai, Temuan Minor, Temuan Mayor), serta batas waktu tindak lanjut.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Privasi',
        text: 'Situs publik hanya menampilkan ringkasan hasil audit secara agregat dan jadwal audit mendatang. Temuan per program studi tidak pernah ditampilkan.',
      },
    ],
  },
  {
    id: 'tindak-lanjut',
    group: 'Penjaminan Mutu',
    title: 'Tindak Lanjut Audit',
    summary: 'Memantau penyelesaian temuan.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Daftar audit beserta status tindak lanjut: Belum Ditindaklanjuti, Dalam Proses, atau Selesai.',
          'Perbarui status seiring perkembangan; persentase tindak lanjut tuntas tampil sebagai indikator di situs publik.',
        ],
      },
    ],
  },
  {
    id: 'rps',
    group: 'Penjaminan Mutu',
    title: 'Validasi RPS',
    summary: 'Mengesahkan RPS yang diajukan dosen.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Validasi RPS untuk melihat RPS yang diajukan dosen.',
          'Buka detail RPS (CPL/CPMK, bahan kajian, metode, pustaka, matriks 16 pertemuan) dan periksa kelengkapannya.',
          'Klik Validasi RPS bila sesuai, atau berikan Catatan Revisi untuk Dosen agar RPS diperbaiki dan diajukan ulang.',
        ],
      },
    ],
  },
  {
    id: 'dokumen',
    group: 'Regulasi & Dokumen',
    title: 'Dokumen Mutu',
    summary: 'Mengunggah dokumen mutu.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Klik Unggah Dokumen.',
          'Isi judul, kategori (Panduan & Renstra, Regulasi & SK Rektor, Template Borang, Instrumen AMI), versi, tahun akademik, dan deskripsi, lalu pilih berkas.',
          'Tetapkan tingkat akses: Publik, Dosen & Reviewer, atau Khusus Tim P2M.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Hanya dokumen berakses Publik yang tampil dan dapat diunduh di situs p2m. Jumlah unduhan tercatat per dokumen.',
      },
    ],
  },
  {
    id: 'berita',
    group: 'Informasi',
    title: 'Berita & Pengumuman',
    summary: 'Menulis berita P2M untuk situs publik.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Isi judul, kategori, ringkasan (maksimal 200 karakter), isi lengkap, dan gambar (maksimal 5 MB).',
          'Anda hanya mengelola berita tulisan sendiri; opsi unggulan tidak tersedia.',
          'Di situs publik pengunggah tampil sebagai "P2M (Penjaminan Mutu)".',
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
          ['Standar tidak tampil di situs p2m.', 'Statusnya Nonaktif; ubah menjadi Aktif.'],
          ['Dokumen tidak tampil di situs p2m.', 'Tingkat akses bukan Publik.'],
          ['Persentase tindak lanjut 0%', 'Belum ada audit berstatus Selesai dengan tindak lanjut Selesai.'],
        ],
      },
    ],
  },
];
