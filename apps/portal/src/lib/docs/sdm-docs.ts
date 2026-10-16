import type { DocSection } from './types';

export const SDM_DOCS_VERSION = 'Oktober 2026';

export const SDM_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran SDM',
    summary: 'Tugas dan menu SDM & Kepegawaian.',
    blocks: [
      {
        t: 'p',
        text: 'SDM mengelola data pegawai (dosen, karyawan, tenaga pendukung), menetapkan status kepegawaian dosen, mengatur shift kerja, dan merekap kehadiran.',
      },
      {
        t: 'table',
        head: ['Menu', 'Kegunaan'],
        rows: [
          ['Dashboard SDM', 'Ringkasan jumlah pegawai dan komposisinya.'],
          ['Data Pegawai', 'CRUD pegawai, cetak ID Card, cetak laporan, ekspor CSV.'],
          ['Status Dosen', 'Menetapkan status kepegawaian dosen (hanya SDM dan Super Admin).'],
          ['Pengaturan Shift', 'Jam kerja dan toleransi keterlambatan.'],
          ['Rekap Absensi', 'Rekap kehadiran bulanan/tahunan, impor Excel, ekspor CSV.'],
        ],
      },
    ],
  },
  {
    id: 'pegawai',
    group: 'Kepegawaian',
    title: 'Data Pegawai',
    summary: 'Mengelola data pegawai.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Data Pegawai lalu klik Tambah Pegawai Baru.',
          'Isi data pegawai, kategori, dan status ikatan kerja lalu Simpan Data Pegawai.',
          'Gunakan pencarian dan filter untuk menemukan pegawai; ubah atau nonaktifkan bila perlu.',
          'Cetak ID Card pegawai, Cetak Laporan, atau Ekspor CSV sesuai kebutuhan.',
        ],
      },
    ],
  },
  {
    id: 'status-dosen',
    group: 'Kepegawaian',
    title: 'Status Kepegawaian Dosen',
    summary: 'Satu-satunya tempat mengubah status dosen.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Status Dosen. Ringkasan di atas menampilkan total dosen dan yang belum diatur.',
          'Cari nama atau NIDN/NUPTK, atau saring menurut status ("Belum diatur" tersedia).',
          'Pilih status pada baris dosen (mis. Dosen Tetap, Dosen Tidak Tetap, Dosen DPK, Cuti, Tugas Belajar, Pensiun) lalu klik Simpan.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Dosen dan BAAK hanya dapat melihat status ini; pembatasannya dijaga di server, bukan hanya di tampilan.',
      },
    ],
  },
  {
    id: 'absensi',
    group: 'Kehadiran',
    title: 'Shift & Rekap Absensi',
    summary: 'Mengatur jam kerja dan merekap kehadiran.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Pengaturan Shift: klik Tambah Shift, isi jam masuk/pulang dan toleransi keterlambatan.',
          'Rekap Absensi: pilih periode untuk melihat kehadiran pagi/sore seluruh dosen dan karyawan.',
          'Impor data dari mesin/berkas dengan Import Absensi dari Excel; unduh hasilnya dengan Ekspor CSV.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Rekap menampilkan nol bila belum ada data absensi harian yang masuk atau diimpor pada periode itu.',
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
          ['Dosen minta ubah status kepegawaian', 'Lakukan di menu Status Dosen; dosen tidak dapat mengubahnya sendiri.'],
          ['Rekap absensi kosong', 'Belum ada data pada periode itu; impor dari Excel atau periksa shift.'],
          ['Pegawai tidak muncul di daftar', 'Periksa filter kategori dan status; pastikan pegawai sudah disimpan.'],
        ],
      },
    ],
  },
];
