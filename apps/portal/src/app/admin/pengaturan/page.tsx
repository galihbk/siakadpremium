'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Briefcase, Settings } from 'lucide-react';
import { JenisKegiatanPanel } from './JenisKegiatanPanel';

// Tiap pengaturan akademik menjadi satu tab. Tambahkan pengaturan baru dengan menambah satu entri di sini.
const TABS = [{ key: 'jenis-kegiatan', label: 'Jenis Tugas Akhir & Lapangan', icon: Briefcase }] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function PengaturanAkademikPage() {
  const [tab, setTab] = useState<TabKey>('jenis-kegiatan');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (TABS.some((x) => x.key === t)) setTab(t as TabKey);
  }, []);

  const pick = (k: TabKey) => {
    setTab(k);
    window.history.replaceState(null, '', `?tab=${k}`);
  };

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Pengaturan
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">Pengaturan akademik kampus. Pilih tab untuk mengatur aturan yang dipakai di seluruh modul akademik.</p>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => pick(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px cursor-pointer ${tab === t.key ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'jenis-kegiatan' && <JenisKegiatanPanel />}
      </div>
    </PortalLayout>
  );
}
