/**
 * Skrip SEKALI JALAN, SANGAT DESTRUKTIF: menghapus SELURUH data di database lokal,
 * KECUALI akun admin/staf (semua role selain STUDENT dan LECTURER: SUPER_ADMIN,
 * ADMIN_BAAK, ADMIN_PMB, ADMIN_KEUANGAN, ADMIN_LP3M, LP3M, STAFF).
 *
 * Dipakai saat Anda akan mengisi ulang data akademik (mahasiswa, dosen, prodi, dst.)
 * dari Web Service Neo Feeder PDDIKTI, dan ingin database lokal benar-benar bersih
 * dulu sebelum menarik data asli.
 *
 * YANG DIHAPUS (semuanya, sesuai konfirmasi Anda):
 *   - Semua Mahasiswa & Dosen beserta akun login-nya
 *   - Semua data akademik: mata kuliah, kelas, KRS, presensi, nilai, kontrak kuliah,
 *     skala nilai, tahun akademik, kurikulum
 *   - Semua PMB/pendaftaran calon mahasiswa
 *   - Semua Fakultas & Program Studi
 *   - Semua Gedung & Ruang
 *   - Semua data Keuangan: tagihan, rekening bank, anggaran, aturan biaya
 *   - Semua data LP3M: laporan penelitian/pengabdian, HAKI, dokumen
 *   - Semua Layanan Surat & Bimbingan Tugas Akhir
 *   - Aturan Tanda Tangan Dokumen
 *   - Kredensial integrasi: Pengaturan DIKTI (Neo Feeder) & Payment Gateway Bank
 *   - Profil institusi (Landing Page Setting), artikel, kalender akademik
 *   - Log kunjungan web & log audit sistem
 *
 * YANG DIPERTAHANKAN:
 *   - Semua akun User dengan role selain STUDENT/LECTURER (akun admin & staf Anda)
 *
 * CARA PAKAI (dari folder packages/database):
 *   node scripts/wipe-database.js            -> mode pratinjau (TIDAK menghapus apa pun)
 *   node scripts/wipe-database.js --yes       -> benar-benar menghapus (WAJIB baca dulu!)
 *
 * Semua penghapusan dibungkus SATU transaksi database: kalau ada satu saja langkah
 * yang gagal (mis. ada relasi yang belum tercakup urutannya), SEMUA dibatalkan dan
 * tidak ada data yang hilang sama sekali -- bukan penghapusan sebagian.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_ROLES = ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_PMB', 'ADMIN_KEUANGAN', 'ADMIN_LP3M', 'LP3M', 'STAFF'];

// Urutan dari tabel paling "anak" (bergantung ke tabel lain) ke paling "induk",
// supaya tidak melanggar foreign key constraint.
function buildDeleteSteps(tx) {
  return [
    ['AttendanceRecord', () => tx.attendanceRecord.deleteMany({})],
    ['CourseContractWeek', () => tx.courseContractWeek.deleteMany({})],
    ['PaymentInvoiceItem', () => tx.paymentInvoiceItem.deleteMany({})],
    ['FeeRuleItem', () => tx.feeRuleItem.deleteMany({})],
    ['StudentFeeAssignment', () => tx.studentFeeAssignment.deleteMany({})],
    ['AdmissionPayment', () => tx.admissionPayment.deleteMany({})],
    ['GradeScale', () => tx.gradeScale.deleteMany({})],
    ['LetterRequest', () => tx.letterRequest.deleteMany({})],
    ['ThesisSupervision', () => tx.thesisSupervision.deleteMany({})],
    ['CourseEnrollment', () => tx.courseEnrollment.deleteMany({})],
    ['AttendanceSession', () => tx.attendanceSession.deleteMany({})],
    ['CourseContract', () => tx.courseContract.deleteMany({})],
    ['PaymentInvoice', () => tx.paymentInvoice.deleteMany({})],
    ['VisitorLog', () => tx.visitorLog.deleteMany({})],
    ['SystemAuditLog', () => tx.systemAuditLog.deleteMany({})],
    ['CalendarEvent', () => tx.calendarEvent.deleteMany({})],
    ['LandingPageArticle', () => tx.landingPageArticle.deleteMany({})],
    ['LandingPageFeature', () => tx.landingPageFeature.deleteMany({})],
    ['Lp3mResearch', () => tx.lp3mResearch.deleteMany({})],
    ['Lp3mIntellectualProperty', () => tx.lp3mIntellectualProperty.deleteMany({})],
    ['Lp3mDocument', () => tx.lp3mDocument.deleteMany({})],
    ['DocumentSignatureRule', () => tx.documentSignatureRule.deleteMany({})],
    ['FinanceBankAccount', () => tx.financeBankAccount.deleteMany({})],
    ['FinanceBudgetItem', () => tx.financeBudgetItem.deleteMany({})],
    ['AdmissionApplication', () => tx.admissionApplication.deleteMany({})],
    ['AdmissionApplicant', () => tx.admissionApplicant.deleteMany({})],
    ['AdmissionBrochure', () => tx.admissionBrochure.deleteMany({})],
    ['PmbFeeConfig', () => tx.pmbFeeConfig.deleteMany({})],
    ['CourseClass', () => tx.courseClass.deleteMany({})],
    ['Student', () => tx.student.deleteMany({})],
    ['Lecturer', () => tx.lecturer.deleteMany({})],
    ['FeeRule', () => tx.feeRule.deleteMany({})],
    ['FeeComponent', () => tx.feeComponent.deleteMany({})],
    ['AdmissionBatch', () => tx.admissionBatch.deleteMany({})],
    ['AdmissionRegistrationType', () => tx.admissionRegistrationType.deleteMany({})],
    ['AdmissionTrack', () => tx.admissionTrack.deleteMany({})],
    ['AdmissionClass', () => tx.admissionClass.deleteMany({})],
    ['PmbAccount', () => tx.pmbAccount.deleteMany({})],
    ['Course', () => tx.course.deleteMany({})],
    ['Curriculum', () => tx.curriculum.deleteMany({})],
    ['GradeScaleVersion', () => tx.gradeScaleVersion.deleteMany({})],
    ['AcademicYear', () => tx.academicYear.deleteMany({})],
    ['Room', () => tx.room.deleteMany({})],
    ['Building', () => tx.building.deleteMany({})],
    ['StudyProgram', () => tx.studyProgram.deleteMany({})],
    ['Faculty', () => tx.faculty.deleteMany({})],
    ['BankGatewaySetting', () => tx.bankGatewaySetting.deleteMany({})],
    ['PddiktiSetting', () => tx.pddiktiSetting.deleteMany({})],
    ['LandingPageSetting', () => tx.landingPageSetting.deleteMany({})],
    // Paling akhir: akun login mahasiswa/dosen (bukan admin) yang kini sudah yatim.
    ['User (role STUDENT/LECTURER)', () => tx.user.deleteMany({ where: { role: { in: ['STUDENT', 'LECTURER'] } } })],
  ];
}

async function main() {
  const isDryRun = !process.argv.includes('--yes');

  const keptAdmins = await prisma.user.findMany({
    where: { role: { in: KEEP_ROLES } },
    select: { email: true, role: true },
    orderBy: { role: 'asc' },
  });

  console.log('Akun yang akan DIPERTAHANKAN (role admin/staf):');
  if (keptAdmins.length === 0) {
    console.log('  (tidak ada akun dengan role admin/staf ditemukan -- periksa dulu sebelum melanjutkan!)');
  } else {
    keptAdmins.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
  }
  console.log('');

  if (isDryRun) {
    console.log('MODE PRATINJAU (tidak ada yang dihapus). Jalankan ulang dengan flag --yes untuk benar-benar menghapus:');
    console.log('  node scripts/wipe-database.js --yes\n');
    return;
  }

  console.log('⚠️  MENGHAPUS SEMUA DATA KECUALI AKUN ADMIN/STAF DI ATAS. Proses dimulai...\n');

  const result = await prisma.$transaction(
    async (tx) => {
      const steps = buildDeleteSteps(tx);
      const summary = [];
      for (const [label, run] of steps) {
        const { count } = await run();
        summary.push({ label, count });
        console.log(`  - ${label}: ${count} baris dihapus`);
      }
      return summary;
    },
    { timeout: 120000 },
  );

  console.log('\n✅ Selesai. Seluruh data berhasil dihapus dalam satu transaksi (tidak ada yang tertinggal setengah).');
  console.log(`Total tabel diproses: ${result.length}`);
}

main()
  .catch((err) => {
    console.error('\n❌ Gagal menghapus data -- TIDAK ADA perubahan tersimpan (transaksi dibatalkan seluruhnya).');
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
