/**
 * Skrip sekali-pakai: menghapus data contoh/dummy yang dulu dibuat otomatis oleh
 * kode seed (sekarang sudah dimatikan) — penelitian & pengabdian LP3M, HAKI,
 * dokumen LP3M, serta gedung & ruang contoh (Tower BJ Habibie, dst.).
 *
 * Aman dijalankan berkali-kali: kalau datanya sudah tidak ada, tidak akan
 * mengubah apa pun.
 *
 * PERINGATAN: menghapus gedung akan ikut menghapus semua ruang di gedung itu
 * (cascade). Kelas kuliah yang memakai ruang tersebut TIDAK ikut terhapus,
 * tapi kolom ruangnya akan menjadi kosong — perlu diisi ulang lewat menu
 * Jadwal Kelas setelah skrip ini selesai.
 *
 * Cara pakai (dari folder packages/database):
 *   node scripts/cleanup-dummy-seed.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const affectedClasses = await prisma.courseClass.count({ where: { roomId: { not: null } } });

  const research = await prisma.lp3mResearch.deleteMany({});
  const haki = await prisma.lp3mIntellectualProperty.deleteMany({});
  const docs = await prisma.lp3mDocument.deleteMany({});
  const buildings = await prisma.building.deleteMany({});

  console.log('Selesai membersihkan data contoh:');
  console.log('- Laporan penelitian/pengabdian LP3M dihapus:', research.count);
  console.log('- Data HAKI dihapus:', haki.count);
  console.log('- Dokumen LP3M dihapus:', docs.count);
  console.log('- Gedung (& ruang di dalamnya, cascade) dihapus:', buildings.count);

  if (affectedClasses > 0) {
    console.log(
      `\nCatatan: ${affectedClasses} kelas kuliah sebelumnya memakai ruang yang baru saja dihapus.`,
      'Ruangnya sekarang kosong — isi ulang lewat menu Jadwal Kelas (Edit) dengan ruang yang sudah Anda tambahkan sendiri.',
    );
  }
}

main()
  .catch((err) => {
    console.error('Gagal menjalankan pembersihan:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
