'use client';

import { LaporanKegiatanPage } from '@/components/p3m/LaporanKegiatanPage';

export default function PenelitianAdminPage() {
  return (
    <LaporanKegiatanPage
      config={{
        type: 'Penelitian',
        title: 'Laporan Penelitian Dosen',
        breadcrumb: 'Laporan Penelitian',
        description:
          'Rekap laporan penelitian dosen yang sudah selesai dilaksanakan, beserta dana realisasi dan luaran yang dicapai. Data terverifikasi menjadi dasar rekap borang akreditasi.',
        gradient: 'bg-gradient-to-r from-[#091a44] via-[#1e3a8a] to-[#1e40af]',
        accentText: 'text-[#D4A017]',
        addLabel: 'Tambah Laporan Penelitian',
        leaderLabel: 'Ketua Peneliti',
        outputLabel: 'Luaran yang Dicapai',
        outputPlaceholder: 'Contoh: Jurnal Internasional Scopus Q2, Paten Sederhana',
        hasMitra: false,
      }}
    />
  );
}
