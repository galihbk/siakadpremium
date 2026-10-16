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
          ['Penerimaan & Tagihan', 'Penerimaan SPP & UKT, Daftar Tagihan Mahasiswa, Verifikasi Pembayaran, Aturan Biaya Perkuliahan.'],
          ['Honor & Pengajaran', 'Rekapitulasi Mengajar, Pengaturan Gaji, Tarif Honor per Jenjang, Tarif Uang Transport, Rekap Honor.'],
          ['Kas & Anggaran', 'Rekening Bank & Kas, Realisasi Anggaran Kampus.'],
        ],
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
          'Buka Verifikasi Pembayaran untuk melihat pembayaran yang menunggu verifikasi.',
          'Periksa bukti transfer yang diunggah mahasiswa terhadap mutasi rekening.',
          'Pilih Verifikasi Manual lalu setujui bila sesuai; tambahkan catatan bila perlu.',
          'Status tagihan berubah menjadi lunas dan kwitansi dapat dicetak dari dashboard.',
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
