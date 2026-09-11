import { PrismaClient, Role, Gender, StudentStatus, PaymentStatus, EnrollmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menjalankan seed data PostgreSQL komprehensif (Mahasiswa, Tagihan Keuangan & KRS)...');

  // Precomputed bcrypt hash for 'password123'
  const passwordHash = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm';

  // 1. Get references
  const prodis = await prisma.studyProgram.findMany();
  const prodiMap = new Map(prodis.map((p) => [p.code, p.id]));
  const academicYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  const courses = await prisma.course.findMany();

  // 2. Seed 10 Realistic Students
  const studentsData = [
    {
      nim: '2211001',
      fullName: 'Ahmad Faiz Pratama',
      email: 'ahmad.faiz@itn.ac.id',
      phone: '081234567891',
      gender: Gender.MALE,
      prodiCode: 'TIF-S1',
      entryYear: 2022,
      currentSemester: 7,
      status: StudentStatus.ACTIVE,
      nik: '3578012201010001',
      address: 'Jl. Danau Toba No. 12, Sawojajar, Malang',
    },
    {
      nim: '2211002',
      fullName: 'Dewi Lestari',
      email: 'dewi.lestari@itn.ac.id',
      phone: '081234567892',
      gender: Gender.FEMALE,
      prodiCode: 'TIF-S1',
      entryYear: 2022,
      currentSemester: 7,
      status: StudentStatus.ACTIVE,
      nik: '3578012201020002',
      address: 'Jl. Ijen Boulevard No. 45, Klojen, Malang',
    },
    {
      nim: '2211008',
      fullName: 'Rizky Fauzan',
      email: 'rizky.fauzan@itn.ac.id',
      phone: '081234567893',
      gender: Gender.MALE,
      prodiCode: 'TM-S1',
      entryYear: 2022,
      currentSemester: 7,
      status: StudentStatus.ACTIVE,
      nik: '3578012201030003',
      address: 'Jl. Soekarno Hatta No. 88, Lowokwaru, Malang',
    },
    {
      nim: '2011012',
      fullName: 'Dina Kusuma Wardani',
      email: 'dina.kusuma@itn.ac.id',
      phone: '081234567894',
      gender: Gender.FEMALE,
      prodiCode: 'TI-IND-S1',
      entryYear: 2020,
      currentSemester: 9,
      status: StudentStatus.LEAVE,
      nik: '3578012201040004',
      address: 'Jl. Borobudur No. 20, Blimbing, Malang',
    },
    {
      nim: '2311032',
      fullName: 'Farhan Dwi Saputra',
      email: 'farhan.dwi@itn.ac.id',
      phone: '081234567895',
      gender: Gender.MALE,
      prodiCode: 'TIF-S1',
      entryYear: 2023,
      currentSemester: 5,
      status: StudentStatus.ACTIVE,
      nik: '3578012201050005',
      address: 'Jl. Bendungan Sigura-gura No. 15, Sumbersari, Malang',
    },
    {
      nim: '2111023',
      fullName: 'Bagas Priyambodo',
      email: 'bagas.priyambodo@itn.ac.id',
      phone: '081234567896',
      gender: Gender.MALE,
      prodiCode: 'TE-S1',
      entryYear: 2021,
      currentSemester: 9,
      status: StudentStatus.ACTIVE,
      nik: '3578012201060006',
      address: 'Jl. MT Haryono Gg 8 No. 4, Dinoyo, Malang',
    },
    {
      nim: '2211056',
      fullName: 'Anisa Putri Maharani',
      email: 'anisa.putri@itn.ac.id',
      phone: '081234567897',
      gender: Gender.FEMALE,
      prodiCode: 'TM-S1',
      entryYear: 2022,
      currentSemester: 7,
      status: StudentStatus.ACTIVE,
      nik: '3578012201070007',
      address: 'Jl. Kawi No. 34, Klojen, Malang',
    },
    {
      nim: '2411089',
      fullName: 'Muhammad Rizky Firdaus',
      email: 'rizky.firdaus@itn.ac.id',
      phone: '081234567898',
      gender: Gender.MALE,
      prodiCode: 'TS-S1',
      entryYear: 2024,
      currentSemester: 3,
      status: StudentStatus.ACTIVE,
      nik: '3578012201080008',
      address: 'Jl. Veteran No. 10, Malang',
    },
    {
      nim: '2011501008',
      fullName: 'Kevin Jonathan Wijaya',
      email: 'kevin.jonathan@itn.ac.id',
      phone: '081234567899',
      gender: Gender.MALE,
      prodiCode: 'TIF-S1',
      entryYear: 2020,
      currentSemester: 8,
      status: StudentStatus.GRADUATED,
      nik: '3578012201090009',
      address: 'Jl. Buring No. 5, Oro-oro Dowo, Malang',
    },
    {
      nim: '2411504012',
      fullName: 'Nadia Salsabila Putri',
      email: 'nadia.salsabila@itn.ac.id',
      phone: '081234567810',
      gender: Gender.FEMALE,
      prodiCode: 'MNJ-S1',
      entryYear: 2024,
      currentSemester: 3,
      status: StudentStatus.ACTIVE,
      nik: '3578012201100010',
      address: 'Jl. Wilis No. 17, Gading Kasri, Malang',
    },
  ];

  const createdStudents = [];
  for (const s of studentsData) {
    const prodiId = prodiMap.get(s.prodiCode) || prodis[0].id;

    // Create/update User
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { fullName: s.fullName, isActive: true },
      create: {
        email: s.email,
        passwordHash,
        fullName: s.fullName,
        role: Role.STUDENT,
        isActive: true,
      },
    });

    // Create/update Student
    const student = await prisma.student.upsert({
      where: { nim: s.nim },
      update: {
        studyProgramId: prodiId,
        currentSemester: s.currentSemester,
        status: s.status,
        address: s.address,
        phone: s.phone,
      },
      create: {
        userId: user.id,
        studyProgramId: prodiId,
        nim: s.nim,
        gender: s.gender,
        phone: s.phone,
        nik: s.nik,
        address: s.address,
        entryYear: s.entryYear,
        currentSemester: s.currentSemester,
        status: s.status,
      },
    });
    createdStudents.push(student);
  }
  console.log(`✅ ${createdStudents.length} Mahasiswa berhasil disimpan ke DB.`);

  // 3. Seed Course Enrollments for KRS if academicYear exists
  if (academicYear && courses.length > 0) {
    const studentRizky = await prisma.student.findUnique({ where: { nim: '2311501001' } });
    if (studentRizky) {
      for (const course of courses.slice(0, 6)) {
        await prisma.courseEnrollment.upsert({
          where: {
            studentId_courseId_academicYearId: {
              studentId: studentRizky.id,
              courseId: course.id,
              academicYearId: academicYear.id,
            },
          },
          update: { status: EnrollmentStatus.APPROVED },
          create: {
            studentId: studentRizky.id,
            courseId: course.id,
            academicYearId: academicYear.id,
            status: EnrollmentStatus.APPROVED,
            midtermScore: 85,
            finalScore: 90,
            totalScore: 88.5,
            gradeLetter: 'A',
            gradePoint: 4.0,
          },
        });
      }
      console.log('✅ KRS untuk Mahasiswa 2311501001 berhasil disimpan ke DB.');
    }
  }

  // 4. Seed Payment Invoices into PostgreSQL
  const invoicesData = [
    {
      invoiceNo: 'INV/2026/GASAL/0819',
      nim: '2211001',
      studentName: 'Ahmad Faiz Pratama',
      studyProgram: 'Teknik Informatika',
      semester: 7,
      paymentType: 'SPP / UKT Gasal',
      amount: 4500000,
      paymentMethod: 'VA BNI (Host to Host)',
      paidAt: '08 Sep 2026 14:22',
      status: PaymentStatus.LUNAS,
      receiptNo: 'KWT/ITN/2026/0819',
      notes: 'Pembayaran otomatis lunas via BNI H2H Gateway',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0820',
      nim: '2211002',
      studentName: 'Dewi Lestari',
      studyProgram: 'Teknik Informatika',
      semester: 7,
      paymentType: 'SPP / UKT Gasal',
      amount: 4500000,
      paymentMethod: 'Mandiri Bill Payment',
      paidAt: '08 Sep 2026 15:45',
      status: PaymentStatus.LUNAS,
      receiptNo: 'KWT/ITN/2026/0820',
      notes: 'Lunas tervalidasi host to host',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0821',
      nim: '2211008',
      studentName: 'Rizky Fauzan',
      studyProgram: 'Teknik Mesin',
      semester: 7,
      paymentType: 'Praktikum Bengkel & Laboratorium',
      amount: 1250000,
      paymentMethod: 'Teller Bank BRI',
      paidAt: null,
      status: PaymentStatus.MENUNGGU_VERIFIKASI,
      receiptNo: null,
      notes: 'Bukti transfer terlampir: slip setoran tunai BRI Cabang Soekarno Hatta',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0822',
      nim: '2311501001',
      studentName: 'Muhammad Rizky Pratama',
      studyProgram: 'Teknik Informatika',
      semester: 5,
      paymentType: 'SPP / UKT Gasal 2026/2027',
      amount: 4500000,
      paymentMethod: 'QRIS Dinamis',
      paidAt: '09 Sep 2026 10:15',
      status: PaymentStatus.LUNAS,
      receiptNo: 'KWT/ITN/2026/0822',
      notes: 'Pembayaran instan QRIS Nasional terverifikasi',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0823',
      nim: '2411089',
      studentName: 'Muhammad Rizky Firdaus',
      studyProgram: 'Teknik Sipil',
      semester: 3,
      paymentType: 'Registrasi Mahasiswa Baru (PMB)',
      amount: 5750000,
      paymentMethod: 'BRIVA BRI',
      paidAt: '07 Sep 2026 16:40',
      status: PaymentStatus.LUNAS,
      receiptNo: 'KWT/ITN/2026/0823',
      notes: 'Gelombang 1 Reguler - Lunas',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0824',
      nim: '2211056',
      studentName: 'Anisa Putri Maharani',
      studyProgram: 'Teknik Mesin',
      semester: 7,
      paymentType: 'SPP / UKT Gasal',
      amount: 4500000,
      paymentMethod: 'Virtual Account BCA',
      paidAt: null,
      status: PaymentStatus.TERTUNDA,
      receiptNo: null,
      notes: 'Belum dibayarkan. Jatuh tempo tgl 20 Sep 2026',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0825',
      nim: '2311032',
      studentName: 'Farhan Dwi Saputra',
      studyProgram: 'Teknik Informatika',
      semester: 5,
      paymentType: 'SPP / UKT Gasal',
      amount: 4500000,
      paymentMethod: 'Teller Bank Mandiri',
      paidAt: null,
      status: PaymentStatus.MENUNGGU_VERIFIKASI,
      receiptNo: null,
      notes: 'Setoran tunai cabang Klojen Malang. Menunggu konfirmasi admin.',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0826',
      nim: '2011012',
      studentName: 'Dina Kusuma Wardani',
      studyProgram: 'Teknik Industri',
      semester: 9,
      paymentType: 'SPP / UKT Perpanjangan Skripsi',
      amount: 2250000,
      paymentMethod: 'Virtual Account BCA',
      paidAt: null,
      status: PaymentStatus.TERTUNDA,
      receiptNo: null,
      notes: 'Tunggakan perpanjangan studi tahap 1',
      academicYear: '2026/2027',
      dueDate: '20 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0827',
      nim: '2111023',
      studentName: 'Bagas Priyambodo',
      studyProgram: 'Teknik Elektro',
      semester: 9,
      paymentType: 'Biaya Ujian Sidang Skripsi & Yudisium',
      amount: 1750000,
      paymentMethod: 'VA BNI (Host to Host)',
      paidAt: '10 Sep 2026 09:12',
      status: PaymentStatus.LUNAS,
      receiptNo: 'KWT/ITN/2026/0827',
      notes: 'Lunas biaya pendaftaran yudisium gasal',
      academicYear: '2026/2027',
      dueDate: '15 Sep 2026',
    },
    {
      invoiceNo: 'INV/2026/GASAL/0828',
      nim: '2411504012',
      studentName: 'Nadia Salsabila Putri',
      studyProgram: 'Manajemen Bisnis Digital',
      semester: 3,
      paymentType: 'SPP / UKT Gasal',
      amount: 4200000,
      paymentMethod: 'BNI Virtual Account',
      paidAt: null,
      status: PaymentStatus.TERTUNDA,
      receiptNo: null,
      notes: 'Tagihan UKT semester 3 diterbitkan otomatis',
      academicYear: '2026/2027',
      dueDate: '25 Sep 2026',
    },
  ];

  for (const inv of invoicesData) {
    await prisma.paymentInvoice.upsert({
      where: { invoiceNo: inv.invoiceNo },
      update: {
        status: inv.status,
        paidAt: inv.paidAt,
        receiptNo: inv.receiptNo,
        amount: inv.amount,
      },
      create: inv,
    });
  }
  console.log(`✅ ${invoicesData.length} Tagihan keuangan berhasil disimpan ke DB.`);

  console.log('🎉 Seeding data PostgreSQL selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
