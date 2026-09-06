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
      description: 'Fakultas yang berfokus pada inovasi keinsinyuran dan rekayasa teknologi infrastruktur.',
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

  // 6. Seed PMB Applicant contoh
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

  console.log('✅ Seeding berhasil! Data master akademik, dosen, dan mahasiswa siap digunakan.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
