import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PMB master data...');

  // Jalur Masuk (Jenis Mahasiswa: Reguler & Transfer)
  const tracks = [
    {
      code: 'REGULER',
      name: 'Mahasiswa Baru',
      description: 'Lulusan baru SMA / SMK / MA / Sederajat yang baru memulai jenjang perkuliahan.',
      isActive: true,
    },
    {
      code: 'TRANSFER',
      name: 'Mahasiswa Transfer / Pindahan',
      description: 'Mahasiswa pindahan antar kampus atau lulusan D3 alih jenjang ke S1.',
      isActive: true,
    },
    {
      code: 'PRESTASI',
      name: 'Jalur Prestasi Akademik & Minat Bakat',
      description: 'Bebas tes tertulis bagi pemenang juara lomba & olimpiade.',
      isActive: false,
    },
    {
      code: 'CBT',
      name: 'Jalur Mandiri Online (CBT)',
      description: 'Ujian Computer-Based Test fleksibel langsung dari rumah.',
      isActive: false,
    },
    {
      code: 'KIPK',
      name: 'Jalur KIP-Kuliah & Beasiswa',
      description: 'Beasiswa pendidikan penuh bagi calon mahasiswa berprestasi.',
      isActive: false,
    },
  ];

  for (const t of tracks) {
    await prisma.admissionTrack.upsert({
      where: { code: t.code },
      update: { name: t.name, description: t.description, isActive: t.isActive },
      create: t,
    });
  }

  // Pilihan Kelas
  const classes = [
    {
      code: 'REGULER',
      name: 'Kelas Reguler (Pagi)',
      description: 'Perkuliahan tatap muka reguler Senin - Jumat (08.00 - 16.00 WIB).',
      isActive: true,
    },
    {
      code: 'KARYAWAN',
      name: 'Kelas Karyawan (Sore / Akhir Pekan)',
      description: 'Jadwal perkuliahan malam dan Sabtu untuk mahasiswa yang sedang bekerja.',
      isActive: true,
    },
  ];

  for (const c of classes) {
    await prisma.admissionClass.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.description, isActive: c.isActive },
      create: c,
    });
  }

  // Gelombang Pendaftaran Sederhana
  const batchCount = await prisma.admissionBatch.count();
  if (batchCount === 0) {
    await prisma.admissionBatch.create({
      data: {
        name: 'Gelombang 1 (Early Bird)',
        academicYear: '2027/2028',
        startDate: '2026-08-01',
        endDate: '2026-11-30',
        status: 'OPEN',
        quota: 350,
        isDefault: true,
        description: 'Gelombang pembuka pendaftaran mahasiswa baru tahun akademik 2027/2028.',
      },
    });
  }

  console.log('✅ PMB Master data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding PMB master:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
