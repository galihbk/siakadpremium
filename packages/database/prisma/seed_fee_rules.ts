import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- START SEEDING PMB MASTER & FEE RULES ---');

  // 1. Standarisasi Master PMB (AdmissionTrack, AdmissionRegistrationType, AdmissionClass)
  // Ubah track dengan code 'REGULER' menjadi 'MAHASISWA_BARU'
  const oldRegulerTrack = await prisma.admissionTrack.findFirst({
    where: { OR: [{ code: 'REGULER' }, { name: { contains: 'Mahasiswa Baru', mode: 'insensitive' } }] },
  });

  let mahasiswaBaruTrack;
  if (oldRegulerTrack) {
    mahasiswaBaruTrack = await prisma.admissionTrack.update({
      where: { id: oldRegulerTrack.id },
      data: {
        code: 'MAHASISWA_BARU',
        name: 'Mahasiswa Baru',
        description: 'Lulusan baru SMA / SMK / MA / Sederajat yang baru memulai jenjang perkuliahan.',
        isActive: true,
      },
    });
  } else {
    mahasiswaBaruTrack = await prisma.admissionTrack.upsert({
      where: { code: 'MAHASISWA_BARU' },
      update: { name: 'Mahasiswa Baru', isActive: true },
      create: {
        code: 'MAHASISWA_BARU',
        name: 'Mahasiswa Baru',
        description: 'Lulusan baru SMA / SMK / MA / Sederajat yang baru memulai jenjang perkuliahan.',
        isActive: true,
      },
    });
  }

  const transferTrack = await prisma.admissionTrack.upsert({
    where: { code: 'TRANSFER' },
    update: { name: 'Mahasiswa Transfer / Pindahan', isActive: true },
    create: {
      code: 'TRANSFER',
      name: 'Mahasiswa Transfer / Pindahan',
      description: 'Mahasiswa pindahan antar kampus atau lulusan D3 alih jenjang ke S1.',
      isActive: true,
    },
  });

  // Jenis Pendaftaran: KIP dan NON_KIP
  const existingKipk = await prisma.admissionRegistrationType.findFirst({
    where: { code: 'KIPK' },
  });
  let kipType;
  if (existingKipk) {
    kipType = await prisma.admissionRegistrationType.update({
      where: { id: existingKipk.id },
      data: {
        code: 'KIP',
        name: 'KIP-Kuliah (Beasiswa)',
        badge: 'Beasiswa Penuh',
        description: 'Bagi pemegang nomor KIP / beasiswa bantuan pendidikan.',
        isKip: true,
        isActive: true,
      },
    });
  } else {
    kipType = await prisma.admissionRegistrationType.upsert({
      where: { code: 'KIP' },
      update: { name: 'KIP-Kuliah (Beasiswa)', isKip: true, isActive: true },
      create: {
        code: 'KIP',
        name: 'KIP-Kuliah (Beasiswa)',
        badge: 'Beasiswa Penuh',
        description: 'Bagi pemegang nomor KIP / beasiswa bantuan pendidikan.',
        isKip: true,
        isActive: true,
      },
    });
  }

  const nonKipType = await prisma.admissionRegistrationType.upsert({
    where: { code: 'NON_KIP' },
    update: { name: 'NON-KIP (Reguler Mandiri)', isKip: false, isActive: true },
    create: {
      code: 'NON_KIP',
      name: 'NON-KIP (Reguler Mandiri)',
      badge: 'Reguler Mandiri',
      description: 'Pendaftaran umum dengan pembiayaan mandiri.',
      isKip: false,
      isActive: true,
    },
  });

  // Pilihan Kelas: REGULER dan KARYAWAN
  const regulerClass = await prisma.admissionClass.upsert({
    where: { code: 'REGULER' },
    update: { name: 'Kelas Reguler (Pagi)', isActive: true },
    create: {
      code: 'REGULER',
      name: 'Kelas Reguler (Pagi)',
      description: 'Perkuliahan tatap muka reguler Senin - Jumat (08.00 - 16.00 WIB).',
      isActive: true,
    },
  });

  const karyawanClass = await prisma.admissionClass.upsert({
    where: { code: 'KARYAWAN' },
    update: { name: 'Kelas Karyawan (Sore / Akhir Pekan)', isActive: true },
    create: {
      code: 'KARYAWAN',
      name: 'Kelas Karyawan (Sore / Akhir Pekan)',
      description: 'Jadwal perkuliahan malam dan Sabtu untuk mahasiswa yang sedang bekerja.',
      isActive: true,
    },
  });

  console.log('✅ Master PMB verified:');
  console.log(`- Jenis Pendaftaran: ${kipType.code}, ${nonKipType.code}`);
  console.log(`- Jenis Mahasiswa: ${mahasiswaBaruTrack.code}, ${transferTrack.code}`);
  console.log(`- Pilihan Kelas: ${regulerClass.code}, ${karyawanClass.code}`);

  // 2. Master Komponen Biaya
  const componentsData = [
    {
      code: 'SPP',
      name: 'Sumbangan Pembinaan Pendidikan (SPP / UKT)',
      defaultAmount: 500000,
      category: 'SEMESTER',
      description: 'Biaya operasional pendidikan per semester.',
    },
    {
      code: 'SKS',
      name: 'Biaya SKS Perkuliahan',
      defaultAmount: 1500000,
      category: 'SEMESTER',
      description: 'Paket beban studi dan kegiatan perkuliahan per semester.',
    },
    {
      code: 'PRAKTIKUM',
      name: 'Biaya Praktikum & Laboratorium',
      defaultAmount: 100000,
      category: 'SEMESTER',
      description: 'Biaya bahan & pemakaian laboratorium praktikum.',
    },
    {
      code: 'UJIAN',
      name: 'Biaya Ujian Semester (UTS & UAS)',
      defaultAmount: 200000,
      category: 'SEMESTER',
      description: 'Penyelenggaraan evaluasi tengah & akhir semester.',
    },
    {
      code: 'REGISTRASI',
      name: 'Biaya Heregistrasi Semester',
      defaultAmount: 250000,
      category: 'SEMESTER',
      description: 'Administrasi daftar ulang dan aktivasi status KRS.',
    },
    {
      code: 'WISUDA',
      name: 'Biaya Kelulusan & Wisuda',
      defaultAmount: 1750000,
      category: 'SEKALI_BAYAR',
      description: 'Biaya toga, ijazah terakreditasi, dan prosesi wisuda.',
    },
  ];

  const componentsMap = new Map();
  for (const c of componentsData) {
    const comp = await prisma.feeComponent.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        defaultAmount: c.defaultAmount,
        category: c.category,
        description: c.description,
        isActive: true,
      },
      create: {
        code: c.code,
        name: c.name,
        defaultAmount: c.defaultAmount,
        category: c.category,
        description: c.description,
        isActive: true,
      },
    });
    componentsMap.set(c.code, comp);
  }
  console.log(`✅ Seeded ${componentsMap.size} Fee Components.`);

  // 3. Aturan Pembiayaan (Fee Rules)
  // RULE 1: KIP-Kuliah (Beasiswa)
  // Kondisi: Jenis Pendaftaran = KIP
  const ruleKip = await prisma.feeRule.upsert({
    where: { code: 'RULE_KIP' },
    update: {
      name: 'Aturan Beasiswa KIP-Kuliah',
      description: 'Pembebasan SPP, SKS & Registrasi bagi mahasiswa penerima beasiswa KIP-Kuliah.',
      priority: 90,
      registrationTypeId: kipType.id,
      isActive: true,
    },
    create: {
      code: 'RULE_KIP',
      name: 'Aturan Beasiswa KIP-Kuliah',
      description: 'Pembebasan SPP, SKS & Registrasi bagi mahasiswa penerima beasiswa KIP-Kuliah.',
      priority: 90,
      registrationTypeId: kipType.id,
      isActive: true,
    },
  });

  // RULE 2: Reguler Mahasiswa Baru
  // Kondisi: NON_KIP + MAHASISWA_BARU + REGULER
  const ruleReguler = await prisma.feeRule.upsert({
    where: { code: 'RULE_REGULER' },
    update: {
      name: 'Aturan Reguler Mahasiswa Baru',
      description: 'Tarif standar untuk mahasiswa baru jalur reguler mandiri kelas pagi.',
      priority: 50,
      registrationTypeId: nonKipType.id,
      trackId: mahasiswaBaruTrack.id,
      classId: regulerClass.id,
      isActive: true,
    },
    create: {
      code: 'RULE_REGULER',
      name: 'Aturan Reguler Mahasiswa Baru',
      description: 'Tarif standar untuk mahasiswa baru jalur reguler mandiri kelas pagi.',
      priority: 50,
      registrationTypeId: nonKipType.id,
      trackId: mahasiswaBaruTrack.id,
      classId: regulerClass.id,
      isActive: true,
    },
  });

  // RULE 3: Kelas Karyawan
  // Kondisi: NON_KIP + MAHASISWA_BARU + KARYAWAN
  const ruleKaryawan = await prisma.feeRule.upsert({
    where: { code: 'RULE_KARYAWAN' },
    update: {
      name: 'Aturan Tarif Kelas Karyawan',
      description: 'Tarif kelas sore / akhir pekan dengan penyesuaian SPP dan operasional dosen khusus.',
      priority: 60,
      registrationTypeId: nonKipType.id,
      trackId: mahasiswaBaruTrack.id,
      classId: karyawanClass.id,
      isActive: true,
    },
    create: {
      code: 'RULE_KARYAWAN',
      name: 'Aturan Tarif Kelas Karyawan',
      description: 'Tarif kelas sore / akhir pekan dengan penyesuaian SPP dan operasional dosen khusus.',
      priority: 60,
      registrationTypeId: nonKipType.id,
      trackId: mahasiswaBaruTrack.id,
      classId: karyawanClass.id,
      isActive: true,
    },
  });

  // RULE 4: Mahasiswa Transfer / Pindahan
  // Kondisi: NON_KIP + TRANSFER
  const ruleTransfer = await prisma.feeRule.upsert({
    where: { code: 'RULE_TRANSFER' },
    update: {
      name: 'Aturan Tarif Mahasiswa Transfer',
      description: 'Tarif mahasiswa alih jenjang / transfer dengan penyesuaian konversi SKS dan administrasi.',
      priority: 70,
      registrationTypeId: nonKipType.id,
      trackId: transferTrack.id,
      isActive: true,
    },
    create: {
      code: 'RULE_TRANSFER',
      name: 'Aturan Tarif Mahasiswa Transfer',
      description: 'Tarif mahasiswa alih jenjang / transfer dengan penyesuaian konversi SKS dan administrasi.',
      priority: 70,
      registrationTypeId: nonKipType.id,
      trackId: transferTrack.id,
      isActive: true,
    },
  });

  // 4. Perlakuan Komponen Biaya per Aturan (FeeRuleItems)
  const kipItems = [
    { code: 'SPP', actionType: 'BEBAS', amountValue: null, notes: 'Ditanggung KIP-Kuliah' },
    { code: 'SKS', actionType: 'BEBAS', amountValue: null, notes: 'Ditanggung KIP-Kuliah' },
    { code: 'PRAKTIKUM', actionType: 'NORMAL', amountValue: null, notes: 'Sesuai konfigurasi laboratorium' },
    { code: 'UJIAN', actionType: 'NORMAL', amountValue: null, notes: 'Biaya operasional ujian' },
    { code: 'REGISTRASI', actionType: 'BEBAS', amountValue: null, notes: 'Bebas biaya registrasi' },
  ];

  for (const item of kipItems) {
    const comp = componentsMap.get(item.code);
    if (!comp) continue;
    await prisma.feeRuleItem.upsert({
      where: {
        feeRuleId_feeComponentId: {
          feeRuleId: ruleKip.id,
          feeComponentId: comp.id,
        },
      },
      update: {
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
      create: {
        feeRuleId: ruleKip.id,
        feeComponentId: comp.id,
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
    });
  }

  const regulerItems = [
    { code: 'SPP', actionType: 'NORMAL', amountValue: null, notes: 'Tarif normal SPP' },
    { code: 'SKS', actionType: 'NORMAL', amountValue: null, notes: 'Tarif normal SKS' },
    { code: 'PRAKTIKUM', actionType: 'NORMAL', amountValue: null, notes: 'Tarif normal Praktikum' },
    { code: 'UJIAN', actionType: 'NORMAL', amountValue: null, notes: 'Tarif normal Ujian' },
    { code: 'REGISTRASI', actionType: 'NORMAL', amountValue: null, notes: 'Tarif normal Registrasi' },
  ];

  for (const item of regulerItems) {
    const comp = componentsMap.get(item.code);
    if (!comp) continue;
    await prisma.feeRuleItem.upsert({
      where: {
        feeRuleId_feeComponentId: {
          feeRuleId: ruleReguler.id,
          feeComponentId: comp.id,
        },
      },
      update: {
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
      create: {
        feeRuleId: ruleReguler.id,
        feeComponentId: comp.id,
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
    });
  }

  const karyawanItems = [
    { code: 'SPP', actionType: 'TARIF_KHUSUS', amountValue: 750000, notes: 'Tarif khusus kuliah malam' },
    { code: 'SKS', actionType: 'TARIF_KHUSUS', amountValue: 1800000, notes: 'Paket SKS akhir pekan' },
    { code: 'PRAKTIKUM', actionType: 'NORMAL', amountValue: null, notes: 'Praktikum lab shift karyawan' },
    { code: 'UJIAN', actionType: 'NORMAL', amountValue: null, notes: 'Ujian jadwal khusus' },
    { code: 'REGISTRASI', actionType: 'NORMAL', amountValue: null, notes: 'Heregistrasi' },
  ];

  for (const item of karyawanItems) {
    const comp = componentsMap.get(item.code);
    if (!comp) continue;
    await prisma.feeRuleItem.upsert({
      where: {
        feeRuleId_feeComponentId: {
          feeRuleId: ruleKaryawan.id,
          feeComponentId: comp.id,
        },
      },
      update: {
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
      create: {
        feeRuleId: ruleKaryawan.id,
        feeComponentId: comp.id,
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
    });
  }

  const transferItems = [
    { code: 'SPP', actionType: 'NORMAL', amountValue: null, notes: 'Tarif SPP transfer' },
    { code: 'SKS', actionType: 'DISKON_PERSENTASE', amountValue: 10, notes: 'Diskon 10% penyesuaian SKS diakui' },
    { code: 'PRAKTIKUM', actionType: 'NORMAL', amountValue: null, notes: 'Praktikum' },
    { code: 'UJIAN', actionType: 'NORMAL', amountValue: null, notes: 'Ujian' },
    { code: 'REGISTRASI', actionType: 'TARIF_KHUSUS', amountValue: 500000, notes: 'Biaya konversi transkrip & registrasi' },
  ];

  for (const item of transferItems) {
    const comp = componentsMap.get(item.code);
    if (!comp) continue;
    await prisma.feeRuleItem.upsert({
      where: {
        feeRuleId_feeComponentId: {
          feeRuleId: ruleTransfer.id,
          feeComponentId: comp.id,
        },
      },
      update: {
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
      create: {
        feeRuleId: ruleTransfer.id,
        feeComponentId: comp.id,
        actionType: item.actionType,
        amountValue: item.amountValue,
        notes: item.notes,
      },
    });
  }

  console.log('✅ Seeded 4 Fee Rules with Rule Items.');
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((err) => {
    console.error('Error during seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
