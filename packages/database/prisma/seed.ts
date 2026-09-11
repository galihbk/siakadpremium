import { PrismaClient, Role, DegreeLevel, SemesterType, StudentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding data SIAKAD Premium...');

  // 1. Seed Fakultas
  const ft = await prisma.faculty.upsert({
    where: { code: 'FT' },
    update: {},
    create: {
      code: 'FT',
      name: 'Fakultas Teknik',
      deanName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
      description:
        'Fakultas yang berfokus pada inovasi keinsinyuran dan rekayasa teknologi infrastruktur.',
    },
  });

  const fik = await prisma.faculty.upsert({
    where: { code: 'FIK' },
    update: {},
    create: {
      code: 'FIK',
      name: 'Fakultas Ilmu Komputer',
      deanName: 'Dr. Eng. Satria Pratama, S.Kom., M.T.',
      description: 'Pusat keunggulan sains komputer, kecerdasan buatan, dan keamanan siber.',
    },
  });

  const feb = await prisma.faculty.upsert({
    where: { code: 'FEB' },
    update: {},
    create: {
      code: 'FEB',
      name: 'Fakultas Ekonomi & Bisnis',
      deanName: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
      description: 'Mencetak pemimpin bisnis, akuntan profesional, dan entrepreneur digital.',
    },
  });

  // 2. Seed Program Studi
  const prodiTif = await prisma.studyProgram.upsert({
    where: { code: 'TIF-S1' },
    update: {},
    create: {
      facultyId: fik.id,
      code: 'TIF-S1',
      name: 'Teknik Informatika',
      degreeLevel: DegreeLevel.S1,
      accreditation: 'Unggul',
      headOfProgram: 'Dr. Bayu Wicaksono, M.Kom.',
    },
  });

  const prodiSi = await prisma.studyProgram.upsert({
    where: { code: 'SI-S1' },
    update: {},
    create: {
      facultyId: fik.id,
      code: 'SI-S1',
      name: 'Sistem Informasi',
      degreeLevel: DegreeLevel.S1,
      accreditation: 'Unggul',
      headOfProgram: 'Ir. Anita Rahmawati, M.T.',
    },
  });

  const prodiMesin = await prisma.studyProgram.upsert({
    where: { code: 'TM-S1' },
    update: {},
    create: {
      facultyId: ft.id,
      code: 'TM-S1',
      name: 'Teknik Mesin',
      degreeLevel: DegreeLevel.S1,
      accreditation: 'Unggul',
      headOfProgram: 'Dr. Ir. Budi Hartono, M.T.',
    },
  });

  // 3. Seed Tahun Akademik Aktif
  const academicYear = await prisma.academicYear.upsert({
    where: { code: '20261' },
    update: { isActive: true },
    create: {
      code: '20261',
      name: '2026/2027',
      semesterType: SemesterType.ODD,
      isActive: true,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-31'),
      krsStartDate: new Date('2026-08-15'),
      krsEndDate: new Date('2026-08-31'),
    },
  });

  // 4. Seed Mata Kuliah
  const courses = [
    { code: 'TIF-101', name: 'Algoritma & Pemrograman Dasar', sks: 3, semester: 1 },
    { code: 'TIF-201', name: 'Struktur Data & Analisis Algoritma', sks: 3, semester: 3 },
    { code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5 },
    { code: 'TIF-305', name: 'Pemrograman Web & Cloud Lanjut', sks: 3, semester: 5 },
    { code: 'TIF-401', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, semester: 7 },
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        studyProgramId: prodiTif.id,
        code: c.code,
        name: c.name,
        sks: c.sks,
        semester: c.semester,
      },
    });
  }

  // 5. Seed Users & Profiles (Super Admin, BAAK, Dosen, Mahasiswa)
  // Password default dummy: "Password123!" (hashed)
  const defaultHash = '$2b$10$wE99Jb0Z/T7Tq4xR7eY6euT3vE49mG09jO0N4uF7iA8a4m0vKxG7e';

  // Admin BAAK
  await prisma.user.upsert({
    where: { email: 'admin@itn.ac.id' },
    update: {},
    create: {
      email: 'admin@itn.ac.id',
      fullName: 'Ahmad Fauzi, S.Kom. (BAAK)',
      role: Role.ADMIN_BAAK,
      passwordHash: defaultHash,
    },
  });

  // Dosen PA
  const userDosen = await prisma.user.upsert({
    where: { email: 'dosen@itn.ac.id' },
    update: {},
    create: {
      email: 'dosen@itn.ac.id',
      fullName: 'Dr. Bayu Wicaksono, M.Kom.',
      role: Role.LECTURER,
      passwordHash: defaultHash,
    },
  });

  const lecturer = await prisma.lecturer.upsert({
    where: { nidn: '0412088501' },
    update: {},
    create: {
      userId: userDosen.id,
      studyProgramId: prodiTif.id,
      nidn: '0412088501',
      nip: '198508122010121003',
      titlePrefix: 'Dr.',
      titleSuffix: 'M.Kom.',
      phone: '081288991122',
      isAcademicAdvisor: true,
    },
  });

  // Mahasiswa
  const userStudent = await prisma.user.upsert({
    where: { email: 'mahasiswa@itn.ac.id' },
    update: {},
    create: {
      email: 'mahasiswa@itn.ac.id',
      fullName: 'Muhammad Rizky Pratama',
      role: Role.STUDENT,
      passwordHash: defaultHash,
    },
  });

  await prisma.student.upsert({
    where: { nim: '2311501001' },
    update: {},
    create: {
      userId: userStudent.id,
      studyProgramId: prodiTif.id,
      advisorLecturerId: lecturer.id,
      nim: '2311501001',
      entryYear: 2023,
      currentSemester: 5,
      status: StudentStatus.ACTIVE,
      phone: '081399887766',
    },
  });

  // Mahasiswa tambahan (dummy) — dibuat untuk kebutuhan pengujian
  const userStudent2 = await prisma.user.upsert({
    where: { email: 'student02@itn.ac.id' },
    update: {},
    create: {
      email: 'student02@itn.ac.id',
      fullName: 'Rina Salsabila',
      role: Role.STUDENT,
      passwordHash: defaultHash,
    },
  });

  await prisma.student.upsert({
    where: { nim: '2311501002' },
    update: {},
    create: {
      userId: userStudent2.id,
      studyProgramId: prodiSi.id,
      advisorLecturerId: lecturer.id,
      nim: '2311501002',
      entryYear: 2024,
      currentSemester: 3,
      status: StudentStatus.ACTIVE,
      phone: '081234567890',
    },
  });

  // 6. Seed Super Admin (Pengelola CMS & Landing Page)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@itn.ac.id' },
    update: {
      fullName: 'Bambang Pratama, S.Kom., M.Cs.',
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: 'superadmin@itn.ac.id',
      fullName: 'Bambang Pratama, S.Kom., M.Cs.',
      role: Role.SUPER_ADMIN,
      passwordHash: defaultHash,
    },
  });

  // 6b. Seed Pegawai Tambahan (PMB, Keuangan, IT, Dosen-Dosen)
  await prisma.user.upsert({
    where: { email: 'admin.pmb@itn.ac.id' },
    update: {
      fullName: 'Bagus Wicaksono, S.Kom. (Panitia PMB)',
      role: 'ADMIN_PMB' as any,
    },
    create: {
      email: 'admin.pmb@itn.ac.id',
      fullName: 'Bagus Wicaksono, S.Kom. (Panitia PMB)',
      role: 'ADMIN_PMB' as any,
      passwordHash: defaultHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'dewi.lestari@itn.ac.id' },
    update: {},
    create: {
      email: 'dewi.lestari@itn.ac.id',
      fullName: 'Dewi Lestari, S.E., M.Ak.',
      role: Role.ADMIN_KEUANGAN,
      passwordHash: defaultHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'rizky.kurniawan@itn.ac.id' },
    update: {},
    create: {
      email: 'rizky.kurniawan@itn.ac.id',
      fullName: 'Rizky Kurniawan, S.Tr.Kom.',
      role: Role.STAFF,
      passwordHash: defaultHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'ahmad.fauzi@itn.ac.id' },
    update: {},
    create: {
      email: 'ahmad.fauzi@itn.ac.id',
      fullName: 'Ahmad Fauzi, A.Md.',
      role: Role.STAFF,
      passwordHash: defaultHash,
    },
  });

  // Dosen Dekan FT
  const userHendra = await prisma.user.upsert({
    where: { email: 'h.gunawan@itn.ac.id' },
    update: {},
    create: {
      email: 'h.gunawan@itn.ac.id',
      fullName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
      role: Role.LECTURER,
      passwordHash: defaultHash,
    },
  });

  await prisma.lecturer.upsert({
    where: { nidn: '0012087501' },
    update: {},
    create: {
      userId: userHendra.id,
      studyProgramId: prodiMesin.id,
      nidn: '0012087501',
      nip: '19750812 200112 1 002',
      titlePrefix: 'Prof. Dr. Ir.',
      titleSuffix: 'M.Eng., IPU.',
      phone: '0812-3456-7890',
      isAcademicAdvisor: true,
    },
  });

  // Dosen Dekan FIK
  const userSatria = await prisma.user.upsert({
    where: { email: 'satria.pratama@itn.ac.id' },
    update: {},
    create: {
      email: 'satria.pratama@itn.ac.id',
      fullName: 'Dr. Eng. Satria Pratama, S.Kom., M.T.',
      role: Role.LECTURER,
      passwordHash: defaultHash,
    },
  });

  await prisma.lecturer.upsert({
    where: { nidn: '0405108701' },
    update: {},
    create: {
      userId: userSatria.id,
      studyProgramId: prodiTif.id,
      nidn: '0405108701',
      nip: '19871005 201509 1 003',
      titlePrefix: 'Dr. Eng.',
      titleSuffix: 'S.Kom., M.T.',
      phone: '0813-7766-5544',
      isAcademicAdvisor: true,
    },
  });

  // Dosen Kaprodi TIF
  const userSiti = await prisma.user.upsert({
    where: { email: 'siti.rahmawati@itn.ac.id' },
    update: {},
    create: {
      email: 'siti.rahmawati@itn.ac.id',
      fullName: 'Dr. Siti Rahmawati, S.T., M.Kom.',
      role: Role.LECTURER,
      passwordHash: defaultHash,
    },
  });

  await prisma.lecturer.upsert({
    where: { nidn: '0424098802' },
    update: {},
    create: {
      userId: userSiti.id,
      studyProgramId: prodiTif.id,
      nidn: '0424098802',
      nip: '19880924 201403 2 004',
      titlePrefix: 'Dr.',
      titleSuffix: 'S.T., M.Kom.',
      phone: '0815-4422-9900',
      isAcademicAdvisor: true,
    },
  });

  // Dosen Dekan FEB
  const userNurul = await prisma.user.upsert({
    where: { email: 'nurul.hidayati@itn.ac.id' },
    update: {},
    create: {
      email: 'nurul.hidayati@itn.ac.id',
      fullName: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
      role: Role.LECTURER,
      passwordHash: defaultHash,
    },
  });

  await prisma.lecturer.upsert({
    where: { nidn: '0018028503' },
    update: {},
    create: {
      userId: userNurul.id,
      studyProgramId: prodiSi.id,
      nidn: '0018028503',
      nip: '19850218 201101 2 002',
      titlePrefix: 'Dr.',
      titleSuffix: 'S.E., M.M., Ak.',
      phone: '0812-9988-7766',
      isAcademicAdvisor: true,
    },
  });

  // 7. Seed Landing Page Setting (Default CMS Content)
  await prisma.landingPageSetting.upsert({
    where: { id: 'default-setting' },
    update: {
      updatedByUserId: superAdmin.id,
    },
    create: {
      id: 'default-setting',
      campusName: 'Institut Teknologi Nusantara',
      campusShortName: 'ITN',
      tagline: 'Kampus Inovasi Teknologi Masa Depan',
      heroBadge: 'Penerimaan Mahasiswa Baru TA 2026/2027 Telah Dibuka!',
      heroTitle: 'Membentuk Generasi Unggul di Era Transformasi Digital',
      heroSubtitle:
        'Institut Teknologi Nusantara (ITN) memadukan keunggulan akademik berstandar internasional, riset terapan mutakhir, dan ekosistem industri teknologi terdepan untuk mencetak profesional dan entrepreneur masa depan.',
      heroCtaText: 'Daftar Sekarang (PMB)',
      heroCtaLink: '/pmb',
      heroSecondaryCtaText: 'Jelajahi Program Studi',
      heroSecondaryCtaLink: '/#program-studi',
      rectorName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
      rectorTitle: 'Rektor Institut Teknologi Nusantara',
      rectorQuote:
        'Pendidikan di ITN tidak hanya berfokus pada penguasaan teori semata, melainkan melahirkan karya nyata dan solusi inovatif berdaya saing global bagi kemajuan bangsa.',
      rectorSpeech:
        'Selamat datang di kampus masa depan, Institut Teknologi Nusantara. Di tengah gelombang disrupsi kecerdasan buatan dan otomatisasi global, ITN berkomitmen penuh untuk menghadirkan kurikulum adaptif berbasis industri serta riset terapan kelas dunia.\n\nKami membekali setiap civitas akademika dengan fasilitas laboratorium superkomputasi, inkubator startup teknologi, dan jejaring magang internasional agar setiap lulusan tidak hanya siap kerja, tetapi juga siap memimpin masa depan. Bersama ITN, mari kita wujudkan impian besar Anda dalam ekosistem akademik yang inspiratif, inklusif, dan unggul.',
      rectorImageUrl: '/images/rector.png',
      announcementActive: true,
      announcementBadge: 'INFO AKADEMIK TERKINI',
      announcementText:
        'Pengisian KRS Semester Ganjil 2026/2027 diperpanjang hingga 31 Agustus 2026 pukul 23:59 WIB. Pastikan konsultasi Dosen PA telah disetujui.',
      announcementLink: '/portal',
      contactAddress:
        'Jl. Raya Pendidikan No. 45, Kampus Terpadu ITN Cyber Park, Jakarta Selatan 12430',
      contactPhone: '(021) 7890-1234',
      contactEmail: 'info@itn.ac.id',
      contactWhatsapp: '+62 812-3456-7890',
      socialInstagram: 'https://instagram.com/itn_official',
      socialYoutube: 'https://youtube.com/@itnofficial',
      socialLinkedin: 'https://linkedin.com/school/itn-official',
      updatedByUserId: superAdmin.id,
    },
  });

  // 8. Seed Landing Page Articles (Berita & Kegiatan)
  const defaultArticles = [
    {
      title: 'ITN Raih Juara 1 Kompetisi AI & Robotika Nasional 2026',
      slug: 'itn-raih-juara-1-kompetisi-ai-robotika-2026',
      category: 'Prestasi',
      excerpt:
        'Tim mahasiswa Fakultas Ilmu Komputer ITN sukses menyabet medali emas dengan inovasi Autonomous Drone pemantau pertanian cerdas.',
      content:
        'Prestasi gemilang kembali ditorehkan oleh mahasiswa ITN dalam ajang bergengsi Kompetisi AI Nasional. Karya prototipe drone berbasis Computer Vision mampu mendeteksi kesehatan tanaman secara presisi.',
      authorName: 'Humas ITN',
      readTime: '3 min read',
      isFeatured: true,
      isPublished: true,
      authorId: superAdmin.id,
    },
    {
      title: 'Kuliah Umum Internasional: Kolaborasi Riset Cloud Computing dengan Silicon Valley',
      slug: 'kuliah-umum-internasional-cloud-silicon-valley',
      category: 'Akademik',
      excerpt:
        'Menghadirkan Principal Cloud Architect ternama untuk membedah arsitektur microservices terdistribusi skala petabyte.',
      content:
        'ITN menggelar webinar dan workshop hands-on arsitektur cloud tingkat lanjut dengan pembicara industri internasional untuk meningkatkan kompetensi mahasiswa.',
      authorName: 'Biro Kerjasama ITN',
      readTime: '4 min read',
      isFeatured: false,
      isPublished: true,
      authorId: superAdmin.id,
    },
    {
      title: 'Sosialisasi Program Beasiswa Unggulan Cendekia Nusantara TA 2026/2027',
      slug: 'beasiswa-unggulan-cendekia-nusantara-2026',
      category: 'Beasiswa',
      excerpt:
        'Pendaftaran beasiswa penuh biaya kuliah dan uang saku bulanan resmi dibuka bagi calon mahasiswa baru berprestasi.',
      content:
        'Institut Teknologi Nusantara membuka kesempatan bagi putra-putri terbaik bangsa untuk menempuh studi S1 gratis melalui Beasiswa Unggulan Cendekia Nusantara.',
      authorName: 'Panitia PMB ITN',
      readTime: '5 min read',
      isFeatured: false,
      isPublished: true,
      authorId: superAdmin.id,
    },
  ];

  for (const art of defaultArticles) {
    await prisma.landingPageArticle.upsert({
      where: { slug: art.slug },
      update: {},
      create: art,
    });
  }

  // 9. Seed PMB Applicant contoh
  await prisma.admissionApplicant.upsert({
    where: { registrationNumber: 'PMB20270001' },
    update: {},
    create: {
      registrationNumber: 'PMB20270001',
      fullName: 'Siti Aisyah Rahmadani',
      email: 'aisyah.pmb@gmail.com',
      phone: '081234567890',
      highSchool: 'SMAN 1 Teladan Jakarta',
      chosenStudyProgram: 'Teknik Informatika (S1)',
      jalurPendaftaran: 'Jalur Prestasi Akademik',
      testScore: 88.5,
    },
  });

  console.log(
    '✅ Seeding berhasil! Data master akademik, super admin CMS, dan landing page siap digunakan.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
