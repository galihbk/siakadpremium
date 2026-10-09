/**
 * Menghapus akun contoh/seed (mahasiswa, dosen, pegawai) dari database LOKAL,
 * sambil mempertahankan struktur Fakultas & Program Studi serta akun admin inti
 * (SUPER_ADMIN, ADMIN_BAAK, ADMIN_PMB, ADMIN_KEUANGAN, ADMIN_LP3M, LP3M).
 *
 * Cara kerja: menghapus langsung row User dengan role STUDENT/LECTURER/STAFF.
 * Relasi Student.user & Lecturer.user di schema.prisma didefinisikan dengan
 * onDelete: Cascade, jadi menghapus User otomatis ikut menghapus row Student/
 * Lecturer terkait beserta data akademiknya (KRS, presensi, nilai, bimbingan TA,
 * dst -- semuanya juga Cascade di schema). Fakultas & Program Studi tidak disentuh
 * karena tidak ada relasi yang mengarah ke sana dari User/Student/Lecturer.
 *
 * CARA PAKAI (dari folder packages/database):
 *   node scripts/wipe-dummy-people.js            -> mode pratinjau (TIDAK menghapus apa pun)
 *   node scripts/wipe-dummy-people.js --yes       -> benar-benar menghapus
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_ROLES = ['STUDENT', 'LECTURER', 'STAFF'];

async function main() {
  const commit = process.argv.includes('--yes');

  const targets = await prisma.user.findMany({
    where: { role: { in: DUMMY_ROLES } },
    select: { id: true, email: true, fullName: true, role: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  if (targets.length === 0) {
    console.log('Tidak ada akun mahasiswa/dosen/pegawai yang ditemukan. Tidak ada yang dihapus.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Ditemukan ${targets.length} akun yang akan dihapus:`);
  for (const t of targets) {
    console.log(`  [${t.role}] ${t.fullName} <${t.email}>`);
  }

  if (!commit) {
    console.log('\nMode PRATINJAU -- tidak ada yang dihapus. Jalankan ulang dengan --yes untuk benar-benar menghapus.');
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.user.deleteMany({
    where: { role: { in: DUMMY_ROLES } },
  });

  console.log(`\nSELESAI: ${result.count} akun (beserta data Student/Lecturer & data akademik terkait) berhasil dihapus.`);
  console.log('Fakultas & Program Studi TIDAK disentuh.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Gagal menghapus data:', err);
  await prisma.$disconnect();
  process.exit(1);
});
