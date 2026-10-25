import type { DocSection } from './types';

export const MAHASISWA_DOCS_VERSION = 'Oktober 2026';

export const MAHASISWA_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Selamat Datang',
    summary: 'Apa yang bisa Anda lakukan di portal mahasiswa dan cara masuknya.',
    blocks: [
      {
        t: 'p',
        text: 'Portal mahasiswa adalah tempat Anda mengurus seluruh kebutuhan akademik: mengisi KRS, melihat jadwal dan presensi, melihat nilai (KHS), jadwal ujian, mengerjakan tugas akhir, mendaftar yudisium, mengajukan surat, dan membayar tagihan.',
      },
      {
        t: 'ol',
        items: [
          'Buka alamat portal kampus (portal.<domain>) lalu masuk dengan email dan kata sandi Anda.',
          'Anda otomatis diarahkan ke Dashboard mahasiswa.',
          'Gunakan menu di sebelah kiri. Menu dikelompokkan: Menu Utama, Perkuliahan, Ujian & Hasil Studi, Tugas Akhir & Kelulusan, Layanan, dan Keuangan.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Akun mahasiswa hanya dapat membuka halaman mahasiswa. Jika lupa kata sandi, klik Lupa kata sandi? pada halaman masuk dan ikuti tautan yang dikirim ke email Anda (berlaku 1 jam, sekali pakai). Bila email tidak masuk, hubungi BAAK.',
      },
    ],
  },
  {
    id: 'prioritas',
    group: 'Mulai',
    title: 'Prioritas Pekerjaan Anda',
    summary: 'Apa yang harus dikerjakan lebih dulu, kapan, dan di menu mana.',
    blocks: [
      { t: 'p', text: 'Sebagian besar pekerjaan mahasiswa mengikuti kalender akademik. KRS dan pembayaran paling sering terlambat dan paling berakibat, jadi dahulukan keduanya.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Isi KRS dan kirim ke dosen PA', 'Selama masa KRS dibuka', 'Rencana Studi (KRS)'],
          ['P1 - Kerjakan lebih dulu', 'Bayar tagihan yang belum lunas (pilih rekening bank kampus, unggah bukti transfer)', 'Sebelum jatuh tempo dan sebelum ujian', 'Tagihan & Pembayaran'],
          ['P2 - Penting', 'Cek dan jaga presensi minimal 75% di tiap mata kuliah', 'Sepanjang semester', 'Presensi & Kehadiran'],
          ['P2 - Penting', 'Cek jadwal ujian dan cetak kartu ujian', 'Sebelum UTS/UAS', 'Jadwal Ujian (UTS/UAS)'],
          ['P3 - Rutin', 'Lihat KHS dan unduh PDF-nya setelah nilai terbit', 'Akhir semester', 'Hasil Studi (KHS)'],
          ['P3 - Rutin', 'Pantau jadwal kuliah mingguan', 'Mingguan', 'Jadwal Kuliah'],
          ['P4 - Bila diperlukan', 'Lihat seluruh nilai dalam Transkrip Sementara', 'Bila diperlukan', 'Transkrip Sementara'],
          ['P4 - Bila diperlukan', 'Ajukan surat, kerjakan tugas akhir, daftar yudisium', 'Sesuai kebutuhan dan semester akhir', 'Layanan Surat, Tugas Akhir, Yudisium'],
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
        title: 'Akibat bila terlewat',
        text: 'Tagihan belum lunas dapat menghambat kartu ujian dan pendaftaran yudisium. Presensi di bawah 75% dapat membuat Anda tidak boleh mengikuti ujian mata kuliah itu.',
      },
    ],
  },
  {
    id: 'profil',
    group: 'Menu Utama',
    title: 'Dashboard & Profil',
    summary: 'Ringkasan akademik dan cara memperbarui biodata.',
    blocks: [
      {
        t: 'p',
        text: 'Dashboard menampilkan IPK, total SKS lulus, status KRS semester berjalan, dan status tagihan dalam satu pandangan. Tagihan yang belum dibayar ditampilkan langsung di dashboard.',
      },
      { t: 'h3', text: 'Memperbarui profil' },
      {
        t: 'ol',
        items: [
          'Buka menu Profil.',
          'Ubah biodata, kontak, atau foto profil yang diizinkan.',
          'Untuk Tempat Lahir, ketik nama kabupaten/kota pada kolom pilihan lalu pilih dari daftar yang muncul.',
          'Simpan perubahan.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Data akademik seperti NIM, program studi, dan status ditetapkan BAAK dan tidak dapat diubah dari profil.',
      },
    ],
  },
  {
    id: 'krs',
    group: 'Perkuliahan',
    title: 'Mengisi KRS',
    summary: 'Memilih mata kuliah per semester dan menunggu persetujuan dosen PA.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Rencana Studi (KRS) pada masa pengisian KRS yang ditetapkan BAAK.',
          'Pilih kelas mata kuliah yang akan diambil. Total SKS dibatasi otomatis sesuai ketentuan. Daftar hanya memuat jadwal untuk kelas kuliah Anda (mis. Pagi atau Sore).',
          'Kirim KRS untuk disetujui Dosen Pembimbing Akademik (PA).',
          'Pantau status: "Menunggu persetujuan Dosen Pembimbing Akademik" berubah menjadi "Disetujui Dosen Pembimbing Akademik".',
          'Unduh KRS sebagai PDF dari halaman KRS; dokumen memakai kop surat kampus dan tanda tangan sesuai aturan.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Di luar masa KRS',
        text: 'Jika periode pengisian sudah ditutup, KRS tidak dapat diubah. Hubungi BAAK bila ada keadaan khusus.',
      },
      {
        t: 'p',
        text: 'Jadwal kuliah mingguan tersusun otomatis dari KRS yang sudah disetujui dan dapat dilihat di menu Jadwal Kuliah.',
      },
    ],
  },
  {
    id: 'presensi',
    group: 'Perkuliahan',
    title: 'Presensi & Kehadiran',
    summary: 'Memantau kehadiran per mata kuliah.',
    blocks: [
      {
        t: 'p',
        text: 'Menu Presensi & Kehadiran menampilkan rekap kehadiran tiap mata kuliah dan rincian per pertemuan yang dicatat dosen.',
      },
      {
        t: 'ul',
        items: [
          'Persentase kehadiran ditandai terhadap batas minimal 75%.',
          'Kehadiran di bawah batas dapat membuat Anda tidak diperkenankan mengikuti ujian pada mata kuliah tersebut.',
          'Jika ada catatan kehadiran yang tidak sesuai, sampaikan ke dosen pengampu.',
        ],
      },
    ],
  },
  {
    id: 'ujian-khs',
    group: 'Ujian & Hasil Studi',
    title: 'Jadwal Ujian & KHS',
    summary: 'Jadwal UTS/UAS, kartu ujian, dan nilai semester.',
    blocks: [
      { t: 'h3', text: 'Jadwal Ujian (UTS/UAS)' },
      {
        t: 'ul',
        items: [
          'Menampilkan tanggal, jam, ruang, dan pengawas tiap mata kuliah.',
          'Kartu peserta ujian dapat dicetak dari halaman ini.',
          'Muncul peringatan bila masih ada tagihan yang belum lunas.',
          'Bila dua ujian bertabrakan pada waktu yang sama, segera hubungi BAAK.',
        ],
      },
      { t: 'h3', text: 'Hasil Studi (KHS)' },
      {
        t: 'ul',
        items: [
          'Pilih semester untuk melihat nilai setiap mata kuliah, IPS, dan IPK kumulatif.',
          'Grafik tren IPS dan distribusi nilai dihitung dari data nilai Anda yang sebenarnya.',
          'Nilai hanya muncul setelah dosen menerbitkannya.',
          'Klik cetak untuk mengunduh KHS sebagai PDF dengan kop surat kampus dan tanda tangan sesuai aturan.',
        ],
      },
    ],
  },
  {
    id: 'transkrip',
    group: 'Ujian & Hasil Studi',
    title: 'Transkrip Sementara',
    summary: 'Seluruh nilai Anda dalam satu tabel.',
    blocks: [
      { t: 'p', text: 'Menu Transkrip Sementara menampilkan semua nilai mata kuliah yang sudah terbit dalam satu tabel, tanpa pengelompokan per semester, lengkap dengan total SKS dan IPK kumulatif.' },
      {
        t: 'ul',
        items: [
          'Klik cetak untuk mengunduh PDF berjudul Transkrip Nilai Sementara dengan kop surat kampus.',
          'Dokumen ini bersifat sementara dan bukan transkrip resmi kelulusan.',
          'Nilai yang belum diterbitkan dosen tidak tampil.',
        ],
      },
    ],
  },
  {
    id: 'capaian-obe',
    group: 'Ujian & Hasil Studi',
    title: 'Capaian OBE (CPL)',
    summary: 'Sejauh mana kemampuan lulusan program studi sudah Anda capai.',
    blocks: [
      { t: 'p', text: 'Bila kampus Anda memakai OBE (Outcome-Based Education), menu Capaian OBE (CPL) muncul di portal. Menu ini menampilkan Capaian Pembelajaran Lulusan (CPL) yang ditetapkan program studi dan seberapa jauh Anda sudah mencapainya, dihitung dari nilai komponen (tugas, kuis, UTS, UAS, dan lainnya) mata kuliah Anda.' },
      {
        t: 'ul',
        items: [
          'Jaring laba-laba menggambarkan capaian setiap CPL. Area biru adalah capaian Anda, garis putus-putus adalah target. CPL yang berada di luar garis target sudah tercapai.',
          'Tabel di sebelahnya menunjukkan angka tiap CPL, statusnya (Tercapai atau Belum tercapai), dan mata kuliah asal nilainya.',
          'Rincian per mata kuliah dapat dibuka untuk melihat nilai komponen, lalu capaian Sub-CPMK, CPMK, dan CPL dari mata kuliah itu.',
          'Kartu ringkasan jaring laba-laba juga tampil di Dashboard.',
        ],
      },
      { t: 'p', text: 'Klik Cetak / Unduh PDF untuk mengunduh Laporan Capaian Pembelajaran Lulusan dengan kop surat kampus. Dokumen ini bukan pengganti transkrip atau SKPI resmi.' },
      {
        t: 'note',
        kind: 'info',
        title: 'Bila capaian belum tampil',
        text: 'CPL yang belum memiliki nilai ditampilkan sebagai belum ada nilai, bukan 0. Capaian muncul setelah dosen mengisi nilai komponen pada mata kuliah yang memakai RPS OBE. Bila muncul keterangan data belum tersedia di OBE, data akademik Anda belum sampai ke OBE; hubungi Admin Prodi.',
      },
    ],
  },
  {
    id: 'skripsi',
    group: 'Tugas Akhir & Kelulusan',
    title: 'Tugas Akhir / Skripsi',
    summary: 'Alur dari proposal sampai ujian skripsi.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Ajukan proposal (judul dan uraian) di menu Tugas Akhir / Skripsi.',
          'BAAK menetapkan dosen pembimbing. Bila proposal ditolak, ajukan ulang setelah memperbaikinya.',
          'Lakukan bimbingan proposal: catat setiap pertemuan dan tunggu tanggapan pembimbing.',
          'Setelah semua pembimbing memberi ACC proposal, daftar Seminar Proposal.',
          'BAAK menjadwalkan seminar dan menetapkan penguji; pantau jadwalnya di halaman yang sama.',
          'Lanjutkan bimbingan skripsi sampai pembimbing memberi ACC skripsi.',
          'Daftar Ujian Skripsi, tunggu jadwal dan penguji, lalu ikuti ujian.',
          'BAAK menginput nilai akhir; status berubah menjadi selesai.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Setiap tahap dikunci oleh sistem: Anda tidak dapat mendaftar sidang sebelum di-ACC, dan tidak bisa melompati tahap.',
      },
    ],
  },
  {
    id: 'yudisium',
    group: 'Tugas Akhir & Kelulusan',
    title: 'Yudisium & Kelulusan',
    summary: 'Syarat dan cara mendaftar yudisium.',
    blocks: [
      {
        t: 'p',
        text: 'Halaman Yudisium & Kelulusan menampilkan checklist syarat yang dicek otomatis:',
      },
      {
        t: 'ul',
        items: [
          'Berstatus mahasiswa aktif.',
          'SKS lulus minimal sesuai kurikulum.',
          'IPK minimal 2,00 (dihitung dari nilai terbaik tiap mata kuliah).',
          'Tugas akhir/skripsi selesai.',
          'Tidak ada tagihan yang belum lunas.',
        ],
      },
      {
        t: 'ol',
        items: [
          'Pastikan semua syarat bertanda terpenuhi.',
          'Klik tombol daftar yudisium.',
          'Tunggu verifikasi BAAK. Bila disetujui, status Anda menjadi Lulus dan predikat kelulusan ditetapkan berdasarkan IPK.',
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
    ],
  },
  {
    id: 'surat',
    group: 'Layanan',
    title: 'Layanan Surat',
    summary: 'Mengajukan surat resmi dan melacak statusnya.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Layanan Surat lalu pilih jenis surat (mis. Surat Keterangan Aktif Kuliah, pengantar magang/KP, izin penelitian, rekomendasi beasiswa, keterangan berkelakuan baik).',
          'Isi keperluan, instansi, dan keterangan yang diminta, lalu kirim.',
          'Pantau status pada riwayat pengajuan (tombol pelacakan).',
          'Setelah terbit, surat dapat dilihat dan dicetak dari halaman yang sama.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Surat Keterangan Aktif Kuliah terbit otomatis dan seketika bila status akademik aktif dan UKT semester berjalan lunas. Jika tidak, permohonan masuk antrean BAAK untuk diperiksa manual. Surat pengantar magang, izin penelitian, rekomendasi beasiswa, dan berkelakuan baik diteruskan lebih dulu ke Dosen PA untuk persetujuan.',
      },
    ],
  },
  {
    id: 'keuangan',
    group: 'Keuangan',
    title: 'Tagihan & Pembayaran',
    summary: 'Melihat tagihan dan membayar.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Tagihan & Pembayaran untuk melihat daftar tagihan dan statusnya.',
          'Pilih tagihan yang akan dibayar lalu pilih metode pembayaran.',
          'Pilih rekening bank kampus tempat Anda mengirim pembayaran. Jika belum ada rekening yang diatur, pembayaran belum bisa dikonfirmasi; hubungi Biro Keuangan.',
          'Transfer sesuai nominal, lalu unggah bukti transfer (gambar atau PDF) dan kirim.',
          'Bagian Keuangan memverifikasi pembayaran; status berubah menjadi Lunas setelah terverifikasi.',
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Tagihan yang belum lunas dapat menghambat kartu ujian dan pendaftaran yudisium.',
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
          ['KRS tidak bisa diubah', 'Periode KRS sudah ditutup atau KRS sudah disetujui dosen PA. Hubungi BAAK/dosen PA.'],
          ['Nilai belum muncul di KHS', 'Dosen belum menerbitkan nilai atau jendela input nilai belum selesai.'],
          ['Kartu ujian tidak bisa dicetak / ada peringatan', 'Periksa tagihan belum lunas dan presensi di bawah 75%.'],
          ['Tidak bisa mendaftar yudisium', 'Lihat checklist syarat; tombol aktif setelah semua syarat terpenuhi.'],
          ['Tidak bisa mengonfirmasi pembayaran', 'Rekening tujuan belum diatur kampus. Hubungi Biro Keuangan; setelah ada rekening aktif, pilih rekening itu lalu unggah bukti.'],
          ['Bukti transfer ditolak', 'Buka tagihan, baca alasan penolakan Keuangan, lalu unggah ulang bukti yang valid.'],
          ['Bukti transfer gagal diunggah', 'Pastikan berkas berupa gambar/PDF dan ukurannya wajar; coba lagi, atau hubungi Keuangan.'],
          ['Data profil salah', 'Biodata dasar diubah BAAK; ajukan koreksi ke BAAK.'],
        ],
      },
    ],
  },
];
