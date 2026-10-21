import type { DocSection } from './types';

export const KEUANGAN_DOCS_VERSION = 'Oktober 2026';

export const KEUANGAN_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran Keuangan',
    summary: 'Gambaran tugas dan menu.',
    blocks: [
      {
        t: 'p',
        text: 'Modul Keuangan mengelola penerimaan dari mahasiswa (SPP/UKT dan biaya lain), verifikasi pembayaran, honor dan gaji dosen serta karyawan, rekening dan kas, serta realisasi anggaran kampus.',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama', 'Dashboard Keuangan & Perbendaharaan.'],
          ['Penerimaan & Tagihan', 'Penerimaan SPP & UKT, Daftar Tagihan Mahasiswa, Verifikasi Pembayaran, Riwayat Pembayaran, Aturan Biaya Perkuliahan.'],
          ['Honor & Pengajaran', 'Rekapitulasi Mengajar, Pengaturan Gaji, Tarif Honor per Jenjang, Tarif Uang Transport, Rekap Honor.'],
          ['Kas & Anggaran', 'Rekening Bank & Kas, Realisasi Anggaran Kampus.'],
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
      { t: 'p', text: 'Keuangan bergantung pada rekening dan aturan biaya yang benar. Tanpa rekening aktif, mahasiswa dan calon mahasiswa tidak bisa mengonfirmasi pembayaran; tanpa aturan biaya, tagihan bernominal salah.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Pastikan ada minimal satu rekening bank kampus yang aktif (tujuan transfer mahasiswa dan calon mahasiswa)', 'Sebelum tagihan dan PMB dibuka', 'Rekening Bank & Kas'],
          ['P1 - Kerjakan lebih dulu', 'Siapkan komponen dan nominal biaya', 'Sebelum menerbitkan tagihan', 'Aturan Biaya Perkuliahan'],
          ['P1 - Kerjakan lebih dulu', 'Verifikasi bukti transfer yang masuk (tab Mahasiswa dan tab PMB); tolak dengan alasan bila tidak sesuai', 'Harian', 'Verifikasi Pembayaran'],
          ['P2 - Penting', 'Terbitkan tagihan dari komponen biaya', 'Awal semester', 'Daftar Tagihan Mahasiswa'],
          ['P2 - Penting', 'Tinjau seluruh transaksi untuk rekonsiliasi', 'Mingguan', 'Riwayat Pembayaran, Penerimaan SPP & UKT'],
          ['P3 - Rutin', 'Rekap mengajar lalu hitung honor, gaji, dan transport', 'Bulanan', 'Rekapitulasi Mengajar, Rekap Honor'],
          ['P4 - Bila diperlukan', 'Atur tarif honor, tarif transport, dan gaji', 'Saat tarif berubah', 'Tarif Honor per Jenjang, Tarif Uang Transport, Pengaturan Gaji'],
          ['P4 - Bila diperlukan', 'Catat kategori dan realisasi anggaran', 'Sesuai siklus anggaran', 'Realisasi Anggaran Kampus'],
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
        text: 'Saat ini pembayaran memakai Konfirmasi Manual: mahasiswa transfer ke rekening kampus lalu mengunggah bukti, dan Anda memverifikasinya. Integrasi API bank belum tersedia.',
      },
    ],
  },
  {
    id: 'aturan',
    group: 'Penerimaan & Tagihan',
    title: 'Aturan Biaya Perkuliahan',
    summary: 'Menetapkan komponen biaya yang menjadi dasar tagihan.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Aturan Biaya Perkuliahan (SPP, UKT & SKS).',
          'Tambah Aturan lalu pilih cakupan (jenjang/prodi) dan Tambah Komponen Perkuliahan beserta nominalnya.',
          'Edit Aturan atau Hapus Komponen bila ada perubahan tarif.',
          'Gunakan Tetapkan Skema Manual untuk kondisi khusus.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Siapkan aturan biaya terlebih dahulu sebelum menerbitkan tagihan agar nominalnya benar.',
      },
    ],
  },
  {
    id: 'tagihan',
    group: 'Penerimaan & Tagihan',
    title: 'Tagihan & Penerimaan',
    summary: 'Menerbitkan tagihan dan memantau penerimaan.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Daftar Tagihan Mahasiswa dan klik Buat Tagihan, atau Terbitkan Tagihan dari Dashboard Keuangan.',
          'Pilih mahasiswa dan komponen biaya, lalu terbitkan.',
          'Pantau status tagihan di daftar; gunakan filter dan pencarian.',
          'Penerimaan SPP & UKT memperlihatkan rekap pembayaran yang masuk; gunakan Ekspor untuk laporan.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Tagihan yang belum lunas memengaruhi kartu ujian mahasiswa dan syarat pendaftaran yudisium.',
      },
    ],
  },
  {
    id: 'verifikasi',
    group: 'Penerimaan & Tagihan',
    title: 'Verifikasi Pembayaran',
    summary: 'Memeriksa bukti transfer dari mahasiswa.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Verifikasi Pembayaran. Tab Mahasiswa berisi pembayaran tagihan perkuliahan; tab PMB berisi pembayaran calon mahasiswa.',
          'Periksa pratinjau bukti transfer dan rekening tujuan yang dipilih pembayar, lalu cocokkan dengan mutasi rekening.',
          'Pilih Verifikasi Manual lalu setujui bila sesuai; tambahkan catatan bila perlu.',
          'Status tagihan berubah menjadi lunas dan kwitansi dapat dicetak dari dashboard.',
          'Bila bukti tidak valid, klik Tolak dan tulis alasannya. Tagihan kembali berstatus tertunda dan pembayar diminta mengunggah ulang.',
        ],
      },
    ],
  },
  {
    id: 'riwayat',
    group: 'Penerimaan & Tagihan',
    title: 'Riwayat Pembayaran',
    summary: 'Seluruh transaksi pembayaran dalam satu daftar.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Menampilkan semua pembayaran mahasiswa dan calon mahasiswa beserta metode dan rekening tujuan.',
          'Cari berdasarkan nomor, nama, NIM, atau keterangan; saring menurut jenis dan status.',
          'Gunakan untuk mencocokkan pembayaran dengan mutasi rekening dan menelusuri satu transaksi.',
        ],
      },
    ],
  },
  {
    id: 'honor',
    group: 'Honor & Pengajaran',
    title: 'Honor, Gaji & Transport',
    summary: 'Menghitung honor dan gaji dosen serta karyawan.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Tarif Honor per Jenjang: tetapkan honor per SKS menurut jenjang lalu Simpan.',
          'Tarif Uang Transport: atur tarif transport.',
          'Pengaturan Gaji: tetapkan gaji pokok, honor per SKS, dan rincian tunjangan/potongan untuk dosen dan karyawan.',
          'Rekapitulasi Mengajar: tinjau kehadiran mengajar dosen sebagai dasar honor; Ekspor CSV tersedia.',
          'Rekap Honor: lihat rekap honor dosen dan karyawan per periode; Ekspor CSV tersedia.',
        ],
      },
    ],
  },
  {
    id: 'kas',
    group: 'Kas & Anggaran',
    title: 'Rekening & Anggaran',
    summary: 'Rekening bank/kas dan realisasi anggaran.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Rekening Bank & Kas: Tambah Rekening dan pantau saldonya.',
          'Rekening yang aktif menjadi pilihan tujuan transfer bagi mahasiswa dan calon mahasiswa. Tanpa rekening aktif mereka tidak dapat mengonfirmasi pembayaran. Rekening ini sama dengan yang dikelola Super Admin di Pengaturan Bank.',
          'Realisasi Anggaran Kampus: kelola kategori anggaran (Tambah Kategori) dan catat realisasinya.',
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
          ['Nominal tagihan tidak sesuai', 'Periksa Aturan Biaya Perkuliahan untuk cakupan dan komponen terkait.'],
          ['Mahasiswa mengaku sudah transfer', 'Cek di Verifikasi Pembayaran; jika belum ada bukti, minta mahasiswa mengunggahnya di portalnya.'],
          ['Honor tidak muncul untuk dosen tertentu', 'Pastikan tarif jenjang dan data mengajar (rekap mengajar) sudah ada pada periode itu.'],
        ],
      },
    ],
  },
];
