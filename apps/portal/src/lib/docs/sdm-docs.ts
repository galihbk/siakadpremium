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
    id: 'prioritas',
    group: 'Mulai',
    title: 'Prioritas Pekerjaan Anda',
    summary: 'Apa yang harus dikerjakan lebih dulu, kapan, dan di menu mana.',
    blocks: [
      { t: 'p', text: 'Data pegawai dan status dosen menjadi acuan bagian lain, sedangkan rekap absensi adalah pekerjaan berulang yang paling sering dicek.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Pastikan data pegawai lengkap dan tidak ada pegawai aktif yang belum tercatat', 'Awal tahun dan saat pegawai baru masuk', 'Data Pegawai'],
          ['P1 - Kerjakan lebih dulu', 'Tetapkan status kepegawaian setiap dosen (filter "Belum diatur" untuk mencarinya)', 'Awal semester', 'Status Dosen'],
          ['P2 - Penting', 'Atur shift dan toleransi keterlambatan', 'Sebelum rekap absensi pertama', 'Pengaturan Shift'],
          ['P3 - Rutin', 'Impor data absensi dan cek rekap', 'Bulanan', 'Rekap Absensi'],
          ['P4 - Bila diperlukan', 'Cetak ID Card, laporan, atau ekspor CSV', 'Bila diperlukan', 'Data Pegawai'],
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
        title: 'Wewenang',
        text: 'Hanya SDM dan Super Admin yang dapat mengubah status kepegawaian dosen. Dosen dan BAAK hanya melihat.',
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
