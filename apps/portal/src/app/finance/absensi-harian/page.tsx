'use client';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { AbsensiHarianCard } from '@/components/common/AbsensiHarianCard';
import { AbsensiRiwayatCard } from '@/components/common/AbsensiRiwayatCard';

export default function AbsensiHarianFinancePage() {
  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            Kehadiran
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Absensi Harian</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Absen pagi dan sore untuk mencatat uang transport harian Anda</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <AbsensiHarianCard />
          <AbsensiRiwayatCard />
        </div>
      </div>
    </PortalLayout>
  );
}
