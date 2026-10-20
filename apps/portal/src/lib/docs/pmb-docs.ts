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
          'Verifikasi bukti transfer Biaya Registrasi dan Biaya Daftar Ulang.',
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
