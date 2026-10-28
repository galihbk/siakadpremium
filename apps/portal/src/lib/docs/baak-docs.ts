import type { DocSection } from './types';

export const BAAK_DOCS_VERSION = 'Oktober 2026';

export const BAAK_DOCS: DocSection[] = [
  {
    id: 'mulai',
    group: 'Mulai',
    title: 'Peran BAAK',
    summary: 'Gambaran tugas dan menu Admin BAAK.',
    blocks: [
      {
        t: 'p',
        text: 'BAAK (Biro Administrasi Akademik) adalah pusat operasional akademik: mengelola data induk mahasiswa dan dosen, kurikulum, penjadwalan, KRS, nilai, tugas akhir, yudisium, layanan surat, berita, dan pelaporan ke PDDIKTI.',
      },
      {
        t: 'table',
        head: ['Kelompok menu', 'Isi'],
        rows: [
          ['Dashboard', 'Dashboard BAAK: sebaran mahasiswa, status, gender, tren angkatan.'],
          ['Data Induk', 'Data Mahasiswa, Data Dosen.'],
          ['Kurikulum', 'Kurikulum & Mata Kuliah, Master Kurikulum.'],
          ['Penjadwalan', 'Tahun Akademik, Gedung, Ruang, Jadwal Kelas, Jadwal Ujian (UTS/UAS).'],
          ['Perkuliahan', 'KRS, Tugas Akhir/Skripsi, Kegiatan Lapangan, Yudisium & Kelulusan, Presensi, Nilai, Skala Nilai, Komponen Penilaian.'],
          ['Layanan Mahasiswa', 'Layanan Surat.'],
          ['Publikasi', 'Berita & Pengumuman.'],
          ['Pelaporan & Integrasi', 'Pelaporan PDDIKTI, Sinkronisasi Feeder.'],
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
      { t: 'p', text: 'BAAK menyiapkan semua yang dibutuhkan role lain. Dosen tidak bisa mengisi bobot, mahasiswa tidak bisa mengisi KRS, dan nilai tidak bisa diinput sebelum langkah P1 dan P2 di bawah selesai. Karena itu urutan kerja BAAK adalah urutan dasar semester.' },
      {
        t: 'table',
        head: ['Prioritas', 'Pekerjaan', 'Kapan', 'Menu'],
        rows: [
          ['P1 - Kerjakan lebih dulu', 'Buat dan aktifkan Tahun Akademik, lalu isi jendela tanggal KRS dan jendela input nilai', 'Awal semester, sebelum KRS dibuka', 'Tahun Akademik'],
          ['P1 - Kerjakan lebih dulu', 'Tetapkan Komponen Penilaian yang berlaku mulai semester itu (hanya daftar komponen; bobot diisi dosen)', 'Sebelum dosen menyusun Kontrak Kuliah', 'Komponen Penilaian'],
          ['P1 - Kerjakan lebih dulu', 'Periksa Skala Nilai (huruf, rentang nilai, bobot IPK)', 'Sebelum nilai pertama diinput', 'Skala Nilai'],
          ['P2 - Penting', 'Buat kelas kuliah: mata kuliah, dosen pengampu, hari, jam, ruang, kuota', 'Sebelum KRS dibuka', 'Jadwal Kelas'],
          ['P2 - Penting', 'Pastikan data dosen lengkap (NIDN/NUPTK/NIP) dan setiap mahasiswa punya dosen PA', 'Sebelum KRS dibuka', 'Data Dosen, Data Mahasiswa'],
          ['P2 - Penting', 'Jadwalkan UTS/UAS beserta pengawas', 'Beberapa minggu sebelum ujian', 'Jadwal Ujian (UTS/UAS)'],
          ['P3 - Rutin', 'Pantau KRS, presensi, dan nilai; koreksi nilai bila diminta dosen', 'Sepanjang semester', 'KRS, Presensi, Nilai'],
          ['P3 - Rutin', 'Proses pengajuan surat yang masuk antrean BAAK', 'Harian', 'Layanan Surat'],
          ['P4 - Bila diperlukan', 'Atur pembimbing dan sidang tugas akhir, proses yudisium', 'Sesuai kalender akademik', 'Tugas Akhir, Yudisium & Kelulusan'],
          ['P4 - Bila diperlukan', 'Kirim data ke PDDIKTI dan tulis berita', 'Akhir semester / bila ada kabar', 'Sinkronisasi Feeder, Berita & Pengumuman'],
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
        text: 'Komponen Penilaian dikunci begitu ada satu nilai yang tersimpan, dan tidak boleh berlaku mundur ke semester yang sudah punya nilai. Tetapkan sebelum perkuliahan dimulai. Perubahan di semester berikutnya dibuat sebagai versi baru.',
      },
    ],
  },
  {
    id: 'data-induk',
    group: 'Data Induk',
    title: 'Data Mahasiswa & Dosen',
    summary: 'Mengelola data induk, filter, dan ekspor.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Tambah, ubah, dan nonaktifkan mahasiswa atau dosen; status aktif/nonaktif lewat tombol toggle.',
          'Gunakan pencarian dan filter (mis. prodi, angkatan, status) untuk mempersempit daftar.',
          'Ekspor Excel/PDF mengikuti hasil filter yang sedang aktif.',
          'Jabatan struktural dosen (Dekan, Kaprodi) memengaruhi nama pada dokumen dan situs publik; diatur pada data dosen.',
          'Status kepegawaian dosen ditampilkan hanya-baca; yang berwenang mengubah adalah SDM.',
        ],
      },
    ],
  },
  {
    id: 'kurikulum',
    group: 'Kurikulum & Penjadwalan',
    title: 'Kurikulum & Mata Kuliah',
    summary: 'Katalog mata kuliah per kurikulum.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Master Kurikulum: buat kurikulum per prodi (tahun mulai, total SKS wajib/pilihan).',
          'Kurikulum & Mata Kuliah: tambah mata kuliah (kode, nama, SKS teori/praktik, semester, jenis).',
          'Tandai kategori Tugas Akhir/Lapangan (Skripsi, KKN, PLP, dst.) untuk mata kuliah yang tidak memiliki jadwal tetap; mahasiswa yang mengambilnya otomatis masuk daftar plotting pembimbing (tab Plotting Pembimbing di Tugas Akhir / Skripsi, atau tab jenisnya di Kegiatan Lapangan).',
        ],
      },
    ],
  },
  {
    id: 'penjadwalan',
    group: 'Kurikulum & Penjadwalan',
    title: 'Tahun Akademik, Ruang & Jadwal Kelas',
    summary: 'Menetapkan semester aktif, ruang, dan jadwal.',
    blocks: [
      { t: 'h3', text: 'Tahun Akademik' },
      {
        t: 'ol',
        items: [
          'Buat tahun akademik/semester dan aktifkan yang berjalan.',
          'Isi jendela tanggal pengisian KRS dan penginputan nilai. Di luar jendela, KRS dan input nilai terkunci otomatis.',
        ],
      },
      { t: 'h3', text: 'Gedung & Ruang' },
      { t: 'p', text: 'Kelola gedung dan ruang beserta kapasitasnya; keduanya dipakai pada jadwal kelas dan jadwal ujian.' },
      { t: 'h3', text: 'Jadwal Kelas' },
      {
        t: 'ol',
        items: [
          'Buat kelas kuliah: pilih mata kuliah, dosen pengampu, hari, jam, ruang, dan kuota.',
          'Bila kampus punya beberapa kelas kuliah (mis. Reguler Pagi dan Karyawan Sore), pilih Kelas Kuliah pada jadwal. KRS mahasiswa lalu hanya menampilkan jadwal untuk kelasnya. Biarkan "Semua kelas" bila jadwal terbuka untuk semuanya. Pilihan kelas kuliah diatur admin PMB di menu Jalur, Jenis & Kelas.',
          'Jadwal Pagi dan Sore untuk mata kuliah yang sama harus memakai nama kelas berbeda (mis. A dan B).',
          'Sistem mendeteksi bentrok ruang dan dosen.',
          'Kelas mata kuliah tugas akhir/lapangan tidak memerlukan jadwal tetap.',
        ],
      },
    ],
  },
  {
    id: 'ujian',
    group: 'Kurikulum & Penjadwalan',
    title: 'Jadwal Ujian UTS/UAS',
    summary: 'Menjadwalkan ujian dan pengawas.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Jadwal Ujian (UTS/UAS) dan pilih jenis ujian.',
          'Untuk tiap kelas, isi tanggal, jam, ruang, dan pengawas.',
          'Sistem memblok bentrok ruang dan pengawas pada waktu yang sama.',
          'Bila ada mahasiswa dengan dua ujian bersamaan, sistem hanya memberi peringatan; selesaikan dengan menggeser jadwal bila perlu.',
        ],
      },
      { t: 'p', text: 'Mahasiswa melihat jadwal dan mencetak kartu ujian; dosen melihat tugas mengawas.' },
    ],
  },
  {
    id: 'krs-nilai',
    group: 'Perkuliahan',
    title: 'KRS, Presensi & Nilai',
    summary: 'Memantau dan mengoreksi proses perkuliahan.',
    blocks: [
      {
        t: 'ul',
        items: [
          'KRS: pantau pengajuan lintas prodi dan status persetujuan dosen PA; periode pengisian diatur lewat Tahun Akademik.',
          'Presensi: rekap kehadiran lintas kelas dan Berita Acara Perkuliahan.',
          'Nilai: monitoring dan koreksi nilai; pengisian oleh dosen terkunci per tahun akademik aktif. Bila kelas memakai Komponen Penilaian, kolom nilai mengikuti komponen itu. Jika dosen belum mengisi bobot di Kontrak Kuliah, tombol simpan nonaktif dan muncul peringatan.',
          'Skala Nilai: atur konversi nilai angka ke huruf dan bobot.',
          'Komponen Penilaian: lihat bagian khusus di bawah.',
        ],
      },
    ],
  },
  {
    id: 'komponen-penilaian',
    group: 'Perkuliahan',
    title: 'Komponen Penilaian',
    summary: 'Satu daftar komponen untuk seluruh kampus; bobotnya diisi dosen per kelas.',
    blocks: [
      { t: 'p', text: 'Komponen Penilaian menentukan bagian apa saja yang membentuk nilai akhir (misalnya Kehadiran, Tugas, UTS, UAS). Daftar ini sama untuk semua dosen di kampus. Akademik hanya menentukan nama komponen; bobot tiap komponen ditentukan dosen pengampu untuk kelasnya di menu Kontrak Kuliah.' },
      { t: 'h3', text: 'Membuat skema' },
      {
        t: 'ol',
        items: [
          'Buka Komponen Penilaian lalu klik Buat Skema Baru.',
          'Isi nama skema dan pilih Berlaku Mulai (tahun akademik dan semester).',
          'Tambahkan komponen. Satu komponen boleh ditandai Otomatis dari kehadiran; nilainya dihitung dari absensi, bukan diinput dosen.',
          'Simpan. Skema berlaku sampai ada skema yang lebih baru dengan tanggal berlaku setelahnya.',
        ],
      },
      { t: 'h3', text: 'Aturan yang perlu diketahui' },
      {
        t: 'ul',
        items: [
          'Skema yang sudah dipakai (ada nilai tersimpan) dikunci dan tidak bisa diubah atau dihapus. Gunakan Duplikat sebagai Versi Baru untuk semester berikutnya.',
          'Skema tidak boleh berlaku mundur ke semester yang nilainya sudah ada.',
          'Selama belum ada skema untuk suatu semester, nilai dihitung dengan cara lama (Tugas, UTS, UAS, Kehadiran) memakai bobot dari Kontrak Kuliah.',
          'Nilai yang diekspor ke OBE mengikuti nama komponen pada skema.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        text: 'Beri tahu dosen setelah skema dibuat. Mereka wajib membuka Kontrak Kuliah tiap kelas dan mengisi bobot (total 100%) sebelum bisa menginput nilai.',
      },
    ],
  },
  {
    id: 'skripsi',
    group: 'Perkuliahan',
    title: 'Tugas Akhir / Skripsi',
    summary: 'Plotting pembimbing, penjadwalan sidang, dan input nilai.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Proposal masuk: tetapkan dosen pembimbing atau tolak proposal (mahasiswa dapat mengajukan ulang).',
          'Setelah pembimbing meng-ACC proposal dan mahasiswa mendaftar sempro: jadwalkan seminar dan pilih dosen penguji.',
          'Setelah skripsi di-ACC dan mahasiswa mendaftar ujian: jadwalkan ujian dan pilih penguji.',
          'Setelah ujian dilaksanakan: input nilai akhir. Nilai hanya dapat diinput setelah jadwal ditetapkan.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Daftar dapat difilter menurut tahap dan dicari. Tab Plotting Pembimbing dipakai untuk mahasiswa yang mengambil mata kuliah Skripsi/TA lewat KRS dan menunggu penetapan pembimbing. PLP, KKN, Kerja Praktik, dan Magang ditangani di menu Kegiatan Lapangan (satu tab per jenis).',
      },
    ],
  },
  {
    id: 'yudisium',
    group: 'Perkuliahan',
    title: 'Yudisium & Kelulusan',
    summary: 'Memverifikasi pendaftar dan menetapkan kelulusan.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Yudisium & Kelulusan: daftar pendaftar dengan SKS lulus, IPK, dan hasil checklist syarat.',
          'Periksa syarat: aktif, SKS minimal, IPK minimal 2,00, tugas akhir selesai, tidak ada tagihan belum lunas.',
          'Setujui: isi tanggal lulus dan nomor SK. Predikat dihitung dari IPK, dan status mahasiswa otomatis menjadi Lulus.',
          'Atau tolak dengan catatan agar mahasiswa dapat memperbaiki dan mengajukan lagi.',
        ],
      },
    ],
  },
  {
    id: 'surat',
    group: 'Layanan & Publikasi',
    title: 'Layanan Surat',
    summary: 'Menerbitkan surat resmi.',
    blocks: [
      {
        t: 'ul',
        items: [
          'Surat Keterangan Aktif Kuliah terbit otomatis bila mahasiswa aktif dan UKT lunas; selain itu masuk antrean untuk diperiksa manual.',
          'Surat lain (pengantar magang, izin penelitian, rekomendasi beasiswa, berkelakuan baik) melewati persetujuan Dosen PA lebih dulu, lalu diproses BAAK.',
          'Nomor surat dibuat otomatis mengikuti format di Profil Institusi.',
          'Nama dan jabatan penandatangan mengikuti Aturan Tanda Tangan.',
        ],
      },
    ],
  },
  {
    id: 'berita',
    group: 'Layanan & Publikasi',
    title: 'Berita & Pengumuman',
    summary: 'Menulis dan menerbitkan berita untuk situs publik.',
    blocks: [
      {
        t: 'ol',
        items: [
          'Buka Berita & Pengumuman lalu klik Tulis Berita Baru.',
          'Isi judul, kategori, dan ringkasan singkat (maksimal 200 karakter).',
          'Tulis isi lengkap dengan editor teks kaya (tebal, miring, judul, daftar, tautan).',
          'Unggah gambar dengan memilih berkas (JPG/PNG/WEBP, maksimal 5 MB); pratinjau muncul dan dapat dihapus.',
          'Opsional: tandai sebagai berita unggulan (menjadi berita utama di /berita).',
          'Biarkan "Langsung publikasikan" tercentang untuk terbit seketika, atau lepas centang untuk menyimpan sebagai draf.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        text: 'Di situs publik, berita memuat keterangan "Diunggah oleh BAAK" (role, bukan nama akun). Daftar berita BAAK menampilkan seluruh berita termasuk draf, beserta penulis dan pengubah terakhir.',
      },
    ],
  },
  {
    id: 'feeder',
    group: 'Pelaporan',
    title: 'Sinkronisasi Feeder (PDDIKTI)',
    summary: 'Menarik, membandingkan, dan mengirim data ke Neo Feeder.',
    blocks: [
      {
        t: 'p',
        text: 'Menu: Pelaporan & Integrasi → Sinkronisasi Feeder. Koneksi Feeder diatur Super Admin di Pengaturan DIKTI.',
      },
      {
        t: 'ol',
        items: [
          'Tahun Akademik & Periode Semester',
          'Dosen',
          'Mahasiswa',
          'Riwayat Pendidikan Mahasiswa',
          'Kurikulum & Mata Kuliah',
          'Kelas Perkuliahan & Dosen Pengampu',
          'KRS & Rencana Studi Mahasiswa',
          'Nilai Perkuliahan Semester',
          'Aktivitas Kuliah Mahasiswa (AKM)',
        ],
      },
      {
        t: 'table',
        head: ['Tab', 'Fungsi'],
        rows: [
          ['Tarik', 'Ambil data dari Feeder ke sistem lokal.'],
          ['Kirim', 'Kirim data lokal yang dipilih (kotak centang) ke Feeder. Tersedia untuk Mahasiswa, Riwayat Pendidikan, AKM, Kelas Perkuliahan, KRS, dan Nilai; Push Kelas/KRS/Nilai hanya dapat dijalankan Super Admin (BAAK dapat melihat jumlah yang siap dan tertahan).'],
          ['Update ke Feeder', 'Satu tabel dengan kolom Perbandingan: yang berbeda ditampilkan selisihnya dan diurutkan di atas.'],
        ],
      },
      {
        t: 'note',
        kind: 'warn',
        text: 'Kirim dan Update mengubah data resmi di PDDIKTI. Lakukan Bandingkan dan periksa selisih sebelum mengirim. Nilai dan KRS diproses per semester karena penarikan tanpa filter sangat lambat.',
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
          ['Dosen tidak bisa input nilai', 'Periksa jendela tanggal nilai pada Tahun Akademik aktif.'],
          ['Mahasiswa tidak bisa mengisi KRS', 'Periksa periode KRS pada Tahun Akademik aktif dan status mahasiswa.'],
          ['Tidak bisa menjadwalkan ujian (bentrok)', 'Ruang atau pengawas sudah terpakai pada waktu yang sama; ganti ruang/pengawas/jam.'],
          ['Nama Dekan/Kaprodi kosong di dokumen', 'Isi jabatan struktural pada data dosen.'],
          ['Perubahan berita belum tampil di situs', 'Situs publik memperbarui data paling lambat tiap 60 detik.'],
          ['Feeder: "Tidak ditemukan"', 'Tarik data dari Feeder terlebih dahulu agar tertaut, lalu bandingkan.'],
        ],
      },
    ],
  },
];
