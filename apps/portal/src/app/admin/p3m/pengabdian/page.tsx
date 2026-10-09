'use client';

import { LaporanKegiatanPage } from '@/components/p3m/LaporanKegiatanPage';

export default function PengabdianAdminPage() {
  return (
    <LaporanKegiatanPage
      config={{
        type: 'Pengabdian',
        title: 'Laporan Pengabdian kepada Masyarakat (PkM)',
        breadcrumb: 'Laporan Pengabdian (PkM)',
        description:
          'Rekap laporan kegiatan pengabdian dosen yang sudah selesai dilaksanakan bersama mitra masyarakat, beserta dana realisasi dan luaran yang dicapai.',
        gradient: 'bg-gradient-to-r from-[#091a44] via-[#065f46] to-[#047857]',
        accentText: 'text-[#D4A017]',
        addLabel: 'Tambah Laporan PkM',
        leaderLabel: 'Ketua Pelaksana',
        outputLabel: 'Luaran yang Dicapai',
        outputPlaceholder: 'Contoh: Modul pelatihan, publikasi media massa, alat TTG terpasang',
        hasMitra: true,
      }}
    />
  );
}
