import type { DocSection } from './types';

export const PMB_DOCS_VERSION = 'Oktober 2026';

export const PMB_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran Panitia PMB',
    summary: 'Alur penerimaan mahasiswa baru dari awal sampai NIM terbit.',
    blocks: [
      {
        t: 'p',
        text: 'Panitia PMB mengelola seluruh proses penerimaan: menyiapkan gelombang dan jalur, memverifikasi berkas dan pembayaran calon mahasiswa, menetapkan kelulusan seleksi, hingga registrasi ulang yang menerbitkan NIM.',
      },
      {
        t: 'ol',
        items: [
          'Atur Gelombang Pendaftaran dan Jalur, Jenis & Kelas.',
          'Calon mahasiswa mendaftar sendiri di portal pmb. (verifikasi email, isi formulir, unggah berkas, bayar).',
          'Panitia memverifikasi berkas dan pembayaran.',
          'Panitia menetapkan kelulusan seleksi.',
          'Calon yang lulus melakukan registrasi ulang; panitia menerbitkan NIM.',
        ],
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Menu Utama', 'Dashboard PMB (KPI dan progres seleksi).'],
          ['Pengaturan PMB', 'Gelombang Pendaftaran, Jalur/Jenis/Kelas.'],
          ['Proses Seleksi', 'Data Calon Mahasiswa, Verifikasi Berkas, Kelulusan & Registrasi.'],
          ['Keuangan & Kemitraan', 'Pembayaran & Keuangan, Data Affiliate.'],
          ['Komunikasi', 'Live Chat dengan pendaftar.'],
          ['Laporan', 'Rekapitulasi PMB.'],
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
      { t: 'p', text: 'PMB berjalan dalam urutan: persiapan, pendaftaran, seleksi, registrasi ulang. Dua hal di luar PMB harus siap lebih dulu: rekening bank kampus (Keuangan) dan Format NIM (Super Admin).' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Pastikan rekening bank kampus aktif (Keuangan) dan Format NIM sudah diatur (Super Admin)', 'Sebelum gelombang dibuka', 'Koordinasi dengan Keuangan dan Super Admin'],
          ['P1 - Kerjakan lebih dulu', 'Buat gelombang pendaftaran dan atur jalur, jenis, dan kelas', 'Sebelum pendaftaran dibuka', 'Gelombang Pendaftaran, Jalur, Jenis & Kelas'],
          ['P1 - Kerjakan lebih dulu', 'Verifikasi berkas dan pembayaran pendaftar; isi catatan saat menolak', 'Harian selama pendaftaran', 'Verifikasi Berkas, Pembayaran & Keuangan'],
          ['P2 - Penting', 'Tetapkan kelulusan seleksi', 'Setelah seleksi selesai', 'Kelulusan & Registrasi'],
          ['P2 - Penting', 'Verifikasi daftar ulang lalu terbitkan NIM', 'Setelah calon lulus membayar daftar ulang', 'Kelulusan & Registrasi'],
          ['P3 - Rutin', 'Balas pertanyaan calon mahasiswa', 'Harian', 'Live Chat'],
          ['P3 - Rutin', 'Pantau KPI dan progres seleksi', 'Mingguan', 'Dashboard PMB'],
          ['P4 - Bila diperlukan', 'Kelola mitra affiliate dan rekap laporan', 'Bila diperlukan / akhir gelombang', 'Data Affiliate, Rekapitulasi PMB'],
          ['P4 - Bila diperlukan', 'Tulis berita dan pengumuman PMB', 'Bila ada kabar', 'Berita & Pengumuman'],
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
        title: 'Yang sering terlewat',
        text: 'Pendaftar harus memilih rekening bank kampus saat membayar. Jika belum ada rekening aktif, pembayaran tidak bisa dikonfirmasi dan pendaftar tertahan.',
      },
    ],
  },
  {
    id: 'dashboard',
    group: 'Menu Utama',
    title: 'Dashboard PMB',
    summary: 'Membaca ringkasan dan progres seleksi.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Kartu KPI: total pendaftar, menunggu verifikasi, berkas lolos, lulus seleksi, dan registrasi ulang.',
          'Bar progres seleksi: Registrasi Ulang, Lolos Seleksi, Terverifikasi, Menunggu Verifikasi, dan Tidak Lolos.',
          'Distribusi pilihan program studi dan jalur seleksi.',
          'Daftar pendaftar terbaru; tombol Tambah Calon Mahasiswa, Segarkan Data, dan Cetak Laporan.',
        ],
      },
    ],
  },
  {
    id: 'pengaturan',
    group: 'Pengaturan PMB',
    title: 'Gelombang, Jalur & Kelas',
    summary: 'Menyiapkan periode dan jenis penerimaan.',
    blocks: [
      { t: 'h3', text: 'Gelombang Pendaftaran' },
      {
        t: 'ol',
        items: [
          'Klik Tambah Gelombang.',
          'Isi nama, tahun akademik, jenjang, tanggal mulai/selesai, kuota, tanggal ujian dan pengumuman, serta jalur yang tersedia.',
          'Status (buka, akan datang, tutup) mengikuti periode dan menentukan apakah pendaftar dapat mendaftar.',
        ],
      },
      { t: 'h3', text: 'Jalur, Jenis & Kelas' },
      { t: 'p', text: 'Kelola master jenis penerimaan, jalur masuk, dan kelas (mis. reguler/karyawan) yang dipilih pendaftar.' },
    ],
  },
  {
    id: 'seleksi',
    group: 'Proses Seleksi',
    title: 'Calon Mahasiswa & Verifikasi',
    summary: 'Memeriksa data, berkas, dan pembayaran.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Data Calon Mahasiswa: cari, filter, ekspor CSV, atau Tambah Calon Mahasiswa secara manual.',
          'Buka detail pendaftar untuk melihat biodata, berkas, kartu bukti pendaftaran, dan riwayat; dapat Kirim Email atau menyetujui pembayaran (Setujui Lunas).',
          'Buka Verifikasi Berkas: periksa dokumen, lalu Verifikasi & Setujui atau Tolak dengan catatan hasil verifikasi.',
          'Pembayaran biaya pendaftaran diperiksa di Pembayaran & Keuangan (lihat bagian berikut).',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Selalu isi catatan saat menolak agar pendaftar tahu apa yang harus diperbaiki.',
      },
    ],
  },
  {
    id: 'kelulusan',
    group: 'Proses Seleksi',
    title: 'Kelulusan & Registrasi Ulang',
    summary: 'Menetapkan hasil seleksi dan menerbitkan NIM.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Kelulusan & Registrasi Ulang Mahasiswa Baru.',
          'Tetapkan hasil seleksi (lulus/tidak lolos) dan isi Catatan SK/Putusan Seleksi; cetak surat bila diperlukan.',
          'Calon yang lulus melakukan registrasi ulang dan membayar biaya daftar ulang.',
          'Setelah daftar ulang terverifikasi, klik Terbitkan NIM (Registrasi Selesai) untuk menerbitkan NIM resmi.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Pola NIM mengikuti pengaturan Format NIM yang ditetapkan Super Admin. Mahasiswa yang sudah teregistrasi tercatat di SIAKAD dan dapat login ke portal mahasiswa.',
      },
    ],
  },
  {
    id: 'keuangan',
    group: 'Keuangan & Kemitraan',
    title: 'Pembayaran & Affiliate',
    summary: 'Verifikasi pembayaran dan program referral.',
    blocks: [
      { t: 'h3', text: 'Pembayaran & Keuangan' },
      {
        t: 'ul',
        items: [
          'Verifikasi bukti transfer Biaya Registrasi dan Biaya Daftar Ulang. Pendaftar memilih rekening bank kampus tujuan transfer; rekening itu tertera pada pembayarannya.',
          'Bagian Keuangan juga dapat memverifikasi pembayaran PMB lewat tab PMB pada menu Verifikasi Pembayaran.',
          'Atur nominal biaya dan Simpan Perubahan Biaya.',
        ],
      },
      { t: 'h3', text: 'Data Affiliate' },
      {
        t: 'ul',
        items: [
          'Tambah Mitra Affiliate (pemberi referral) dan pantau pendaftar yang masuk lewat kode mereka.',
          'Verifikasi/proses registrasi ulang referral dan Ekspor CSV untuk rekap.',
        ],
      },
    ],
  },
  {
    id: 'live-chat',
    group: 'Komunikasi',
    title: 'Live Chat Pendaftar',
    summary: 'Membalas pertanyaan calon mahasiswa secara langsung.',
    blocks: [
      {
        t: 'p',
        text: 'Tombol "Live Chat" muncul di pojok kanan bawah semua halaman portal pmb. (beranda, login, dasbor). Pendaftar yang sudah login langsung mengobrol; pengunjung yang belum punya akun mengisi nama, email/WhatsApp, dan pesan pertama lebih dulu (ditandai "Tamu" di sisi panitia). Pesan masuk ke menu Komunikasi → Live Chat, dan lencana emas pada menu menunjukkan jumlah pesan yang belum dibaca.',
      },
      {
        t: 'ol',
        items: [
          'Buka Live Chat. Daftar percakapan di kiri diurutkan dari pesan terbaru; saring dengan Belum dibaca, Terbuka, atau Ditutup, atau cari nama, email, atau nomor WhatsApp.',
          'Klik satu percakapan untuk membaca riwayatnya dan membalas (Enter untuk kirim, Shift+Enter baris baru; maksimal 1.000 karakter).',
          'Gunakan filter Tamu untuk melihat pengunjung yang belum mendaftar. Tutup percakapan bila pertanyaan sudah selesai. Bila pendaftar mengirim pesan lagi, percakapan terbuka kembali otomatis.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Halaman memperbarui diri otomatis (sekitar 3 detik saat percakapan dibuka). Pendaftar dan tamu hanya melihat nama "Panitia PMB"; nama akun petugas yang membalas hanya tampil di sisi panitia dan tercatat di database. Percakapan tamu tidak otomatis tergabung dengan akun yang dibuat kemudian; gunakan kontak yang tertera untuk menyambungkannya. Chat tamu dibatasi 5 percakapan baru per jam per alamat, kolom jebakan bot, dan 200 pesan per percakapan.',
      },
    ],
  },
  {
    id: 'laporan',
    group: 'Laporan & Informasi',
    title: 'Rekapitulasi & Berita',
    summary: 'Statistik PMB dan pengumuman.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Rekapitulasi PMB: statistik pendaftar menurut gelombang, prodi, jalur, dan status; Cetak Laporan dan Ekspor CSV.',
          'Berita & Pengumuman: tulis informasi PMB untuk situs publik (ringkasan maksimal 200 karakter, gambar diunggah langsung). Anda hanya mengelola berita tulisan sendiri; pengunggah tampil sebagai "Panitia PMB".',
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
          ['Pendaftar tidak menerima email verifikasi', 'SMTP belum dikonfigurasi di server (berkas .env); hubungi Super Admin.'],
          ['Pendaftar tidak bisa mendaftar', 'Periksa status gelombang (harus buka) dan kuota.'],
          ['NIM tidak terbit', 'Pastikan pembayaran daftar ulang sudah diverifikasi dan Format NIM sudah diatur.'],
          ['Tautan /pmb di situs utama', 'Dialihkan otomatis ke subdomain pmb.; alamat lama tetap berfungsi.'],
        ],
      },
    ],
  },
];
