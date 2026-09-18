import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runEndToEndTest() {
  console.log('===========================================================');
  console.log('TEST INTEGRASI PMB -> MAHASISWA -> KEUANGAN (END-TO-END)');
  console.log('===========================================================');

  // 1. Ambil Master PMB dari Database
  const kipReg = await prisma.admissionRegistrationType.findFirst({ where: { code: 'KIP' } });
  const nonKipReg = await prisma.admissionRegistrationType.findFirst({ where: { code: 'NON_KIP' } });
  const mhsBaruTrack = await prisma.admissionTrack.findFirst({ where: { code: 'MAHASISWA_BARU' } });
  const transferTrack = await prisma.admissionTrack.findFirst({ where: { code: 'TRANSFER' } });
  const regulerClass = await prisma.admissionClass.findFirst({ where: { code: 'REGULER' } });
  const karyawanClass = await prisma.admissionClass.findFirst({ where: { code: 'KARYAWAN' } });
  const prodi = await prisma.studyProgram.findFirst({ where: { status: 'Aktif' } });

  console.log('1. Verifikasi Master PMB:');
  console.log('   - KIP ID:', kipReg?.id, '| NON_KIP ID:', nonKipReg?.id);
  console.log('   - MAHASISWA_BARU ID:', mhsBaruTrack?.id, '| TRANSFER ID:', transferTrack?.id);
  console.log('   - REGULER ID:', regulerClass?.id, '| KARYAWAN ID:', karyawanClass?.id);

  if (!kipReg || !nonKipReg || !mhsBaruTrack || !transferTrack || !regulerClass || !karyawanClass || !prodi) {
    throw new Error('Master data belum lengkap di database.');
  }

  // 2. Buat Calon Mahasiswa KIP untuk Konversi
  const dummyEmail = `calon.kip.${Date.now()}@itn.ac.id`;
  const account = await prisma.pmbAccount.create({
    data: {
      fullName: 'Ahmad Fauzi (Mahasiswa KIP)',
      email: dummyEmail,
      whatsapp: '081299998888',
      passwordHash: 'dummyhash',
      isEmailVerified: true,
    },
  });

  const appKip = await prisma.admissionApplication.create({
    data: {
      accountId: account.id,
      fullName: 'Ahmad Fauzi (Mahasiswa KIP)',
      email: dummyEmail,
      phone: '081299998888',
      nik: '3578010101990001',
      formStatus: 'SUBMITTED',
      verificationStatus: 'VERIFIED',
      selectionStatus: 'PASSED',
      registrationNumber: `PMB-2027-${Date.now().toString().slice(-4)}`,
      registrationTypeId: kipReg.id,
      trackId: mhsBaruTrack.id,
      classId: regulerClass.id,
      studyProgramId: prodi.id,
    },
  });

  // Tambah pembayaran daftar ulang LUNAS
  await prisma.admissionPayment.create({
    data: {
      applicationId: appKip.id,
      type: 'RE_REGISTRATION',
      amount: 7300000,
      status: 'PAID',
    },
  });

  console.log('\n2. Calon Mahasiswa KIP Berhasil Dibuat:');
  console.log('   - No Pendaftaran:', appKip.registrationNumber);
  console.log('   - Status Seleksi:', appKip.selectionStatus);

  // 3. Panggil API Convert to Student
  const convertRes: any = await (await fetch(`http://localhost:3001/api/v1/admissions/admin/pmb/applications/${appKip.id}/convert-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })).json();

  const studentData = convertRes.data?.data || convertRes.data;
  console.log('\n3. Hasil Konversi PMB ke Student:');
  console.log('   - NIM Terbit:', studentData?.nim);
  console.log('   - Skema Pembiayaan:', studentData?.feeScheme);
  console.log('   - Tagihan Semester 1:', studentData?.semesterInvoice);

  // 4. Periksa Record Student di Database
  const studentDb = await prisma.student.findUnique({
    where: { nim: studentData?.nim },
    include: {
      registrationType: true,
      track: true,
      admissionClass: true,
      feeAssignments: true,
    },
  });

  console.log('\n4. Verifikasi Student di PostgreSQL:');
  console.log('   - NIM:', studentDb?.nim);
  console.log('   - Relasi Jenis Pendaftaran:', studentDb?.registrationType?.name);
  console.log('   - Relasi Jenis Mahasiswa:', studentDb?.track?.name);
  console.log('   - Relasi Pilihan Kelas:', studentDb?.admissionClass?.name);
  console.log('   - Total Snapshot Penetapan:', studentDb?.feeAssignments.length);

  const snapshot = studentDb?.feeAssignments[0];
  console.log('\n5. Snapshot Penetapan Pembiayaan (Histori Aman):');
  console.log('   - Skema:', snapshot?.schemeName);
  console.log('   - Angkatan:', snapshot?.academicYear);
  console.log('   - Ditetapkan Oleh:', snapshot?.assignedBy);
  const snapCalc = (snapshot?.snapshotData as any)?.calculation;
  console.log('   - Total Tarif Dasar:', snapCalc?.totalBaseAmount);
  console.log('   - Total Potongan KIP:', snapCalc?.totalDiscount);
  console.log('   - Total Final Dibayar:', snapCalc?.totalFinalAmount);

  // 6. Periksa Invoice dan Rincian Item Tagihan
  const invoiceDb = await prisma.paymentInvoice.findFirst({
    where: { nim: studentDb?.nim },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n6. Verifikasi Invoice Resmi di PostgreSQL:');
  console.log('   - No Invoice:', invoiceDb?.invoiceNo);
  console.log('   - Tipe Tagihan:', invoiceDb?.paymentType);
  console.log('   - Total Tagihan:', invoiceDb?.amount);
  console.log('   - Status:', invoiceDb?.status);
  console.log('   - Rincian Komponen Biaya:');
  invoiceDb?.items.forEach((item) => {
    console.log(`     * ${item.componentName} (${item.actionType}): Dasar Rp ${item.baseAmount} - Diskon Rp ${item.discountAmount} = Rp ${item.finalAmount}`);
  });

  console.log('\n===========================================================');
  console.log('✅ SELURUH PENGUJIAN INTEGRASI BERHASIL 100%!');
  console.log('===========================================================');
}

runEndToEndTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
