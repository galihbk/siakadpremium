import type { DocSection } from './types';

export const DOSEN_DOCS_VERSION = 'Oktober 2026';

export const DOSEN_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Selamat Datang',
    summary: 'Ikhtisar portal dosen.',
    blocks: [
      {
        t: 'p',
        text: 'Portal dosen mencakup pengajaran (jadwal, absensi, kontrak kuliah, RPS, nilai), bimbingan (PA dan skripsi), pengawasan ujian, persetujuan surat mahasiswa, dan pelaporan penelitian/pengabdian.',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama', 'Dashboard Dosen dan Profil.'],
          ['Pengajaran & Nilai', 'Jadwal Mengajar, Jadwal Ujian & Pengawasan, Absensi Perkuliahan, Kontrak Kuliah, RPS, Input Nilai Semester.'],
          ['Bimbingan', 'Mahasiswa Bimbingan PA, Bimbingan Skripsi, Persetujuan Surat.'],
          ['Penelitian & Pengabdian (P3M)', 'Laporan Penelitian & PkM.'],
        ],
      },
    ],
  },
  {
    id: 'profil',
    group: 'Menu Utama',
    title: 'Dashboard & Profil',
    summary: 'Jadwal hari ini dan data diri.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Dashboard menampilkan kelas yang diampu; pada tiap kelas tersedia aksi cepat "Absen".',
          'Profil memuat biodata dan riwayat akademik yang dapat Anda lengkapi.',
          'Status kepegawaian pada profil hanya-baca; ditetapkan oleh bagian SDM.',
        ],
      },
    ],
  },
  {
    id: 'jadwal-absen',
    group: 'Pengajaran & Nilai',
    title: 'Jadwal & Absensi',
    summary: 'Melihat kelas yang diampu dan mencatat kehadiran.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Jadwal Mengajar untuk melihat kelas per tahun akademik (hari, jam, ruang, jumlah peserta).',
          'Buka Absensi Perkuliahan lalu pilih kelas dan pertemuan.',
          'Tandai kehadiran setiap mahasiswa dan simpan.',
          'Rekap kehadiran tiap kelas terakumulasi otomatis sepanjang semester dan terlihat oleh mahasiswa serta BAAK.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Kehadiran mahasiswa di bawah 75% dapat membuat mereka tidak diperkenankan mengikuti ujian, jadi pastikan absensi terisi tepat waktu.',
      },
    ],
  },
  {
    id: 'kontrak-rps',
    group: 'Pengajaran & Nilai',
    title: 'Kontrak Kuliah & RPS',
    summary: 'Bobot penilaian dan rencana pembelajaran.',
    blocks: [
      { t: 'h3', text: 'Kontrak Kuliah' },
      {
        t: 'ol',
        items: [
          'Buka Kontrak Kuliah dan pilih kelas.',
          'Tetapkan bobot komponen penilaian (Tugas, UTS, UAS, Kehadiran) hingga total 100%.',
          'Simpan lalu publikasikan agar mahasiswa dapat melihatnya.',
        ],
      },
      { t: 'h3', text: 'RPS' },
      {
        t: 'ol',
        items: [
          'Buka Rencana Pembelajaran (RPS) dan pilih kelas.',
          'Isi formulir RPS terstruktur: CPL/CPMK, bahan kajian, metode, pustaka, serta matriks 16 pertemuan menggunakan editor teks.',
          'Ajukan untuk divalidasi P2M. Bila ada catatan revisi dari P2M, perbaiki lalu ajukan kembali.',
        ],
      },
    ],
  },
  {
    id: 'nilai',
    group: 'Pengajaran & Nilai',
    title: 'Input Nilai',
    summary: 'Mengisi dan menerbitkan nilai semester.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Input Nilai Semester dan pilih kelas.',
          'Isi nilai tiap mahasiswa. Gunakan simpan-draf bila belum final.',
          'Terbitkan nilai agar terlihat oleh mahasiswa di KHS.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Jendela waktu',
        text: 'Input nilai hanya dapat dilakukan dalam rentang tanggal yang ditetapkan BAAK untuk tahun akademik aktif. Di luar rentang itu halaman terkunci otomatis; hubungi BAAK bila perlu membuka kembali.',
      },
    ],
  },
  {
    id: 'ujian',
    group: 'Pengajaran & Nilai',
    title: 'Jadwal Ujian & Pengawasan',
    summary: 'Ujian untuk kelas yang diampu dan tugas mengawas.',
    blocks: [
      {
        t: 'p',
        text: 'Menu ini menampilkan jadwal UTS/UAS kelas yang Anda ampu serta jadwal ketika Anda ditugaskan sebagai pengawas, lengkap dengan ruang dan jumlah peserta. Jadwal ditetapkan BAAK; jika terjadi bentrok pada tugas pengawasan, informasikan ke BAAK.',
      },
    ],
  },
  {
    id: 'bimbingan-pa',
    group: 'Bimbingan',
    title: 'Bimbingan Akademik (PA)',
    summary: 'Persetujuan KRS dan pendampingan mahasiswa.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Mahasiswa Bimbingan PA untuk melihat daftar mahasiswa bimbingan Anda.',
          'Buka satu mahasiswa untuk melihat riwayat KRS dan konsultasi.',
          'Setujui atau tolak pengajuan KRS yang masuk, sertakan catatan bila perlu.',
        ],
      },
      { t: 'h3', text: 'Persetujuan Surat' },
      {
        t: 'p',
        text: 'Surat tertentu (pengantar magang, izin penelitian, rekomendasi beasiswa, berkelakuan baik) membutuhkan persetujuan Anda sebelum diteruskan ke BAAK. Buka menu Persetujuan Surat untuk menyetujui atau menolak.',
      },
    ],
  },
  {
    id: 'bimbingan-skripsi',
    group: 'Bimbingan',
    title: 'Bimbingan Skripsi',
    summary: 'Membimbing proposal dan skripsi, memberi ACC.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Bimbingan Skripsi untuk melihat mahasiswa yang Anda bimbing setelah BAAK menetapkan Anda sebagai pembimbing.',
          'Tanggapi catatan bimbingan yang diisi mahasiswa pada setiap pertemuan.',
          'Berikan ACC proposal bila layak; mahasiswa baru dapat mendaftar seminar proposal setelah semua pembimbing memberi ACC.',
          'Setelah sempro, lanjutkan bimbingan dan berikan ACC skripsi agar mahasiswa dapat mendaftar ujian.',
          'Lihat jadwal seminar atau ujian yang Anda uji pada halaman yang sama.',
        ],
      },
    ],
  },
  {
    id: 'p3m',
    group: 'Penelitian & Pengabdian',
    title: 'Laporan Penelitian & PkM',
    summary: 'Mencatat luaran penelitian dan pengabdian.',
    blocks: [
      {
        t: 'p',
        text: 'Catat kegiatan penelitian atau pengabdian Anda (judul, skema, bidang fokus, anggota, tahun, luaran, mitra) pada menu Laporan Penelitian & PkM. LP3M akan memverifikasi; hanya kegiatan berstatus Terverifikasi yang tampil di situs publik LP3M.',
      },
    ],
  },
  {
    id: 'faq',
    group: 'Bantuan',
    title: 'Pertanyaan Umum',
    summary: 'Masalah yang sering ditanyakan.',
    blocks: [
      {
        t: 'table',
        head: ['Pertanyaan', 'Jawaban'],
        rows: [
          ['Halaman input nilai terkunci', 'Di luar jendela waktu yang ditetapkan BAAK. Hubungi BAAK.'],
          ['Kelas tidak muncul di jadwal', 'Kelas belum ditetapkan atau Anda belum dipasang sebagai pengampu. Hubungi BAAK/Prodi.'],
          ['Status kepegawaian salah', 'Hanya SDM yang dapat mengubahnya; hubungi bagian SDM.'],
          ['RPS dikembalikan', 'Baca catatan revisi dari P2M, perbaiki, lalu ajukan ulang.'],
        ],
      },
    ],
  },
];
