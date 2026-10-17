'use client';

import React from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { BackupPanel } from '@/components/system/BackupPanel';
import {
  Calendar, Globe, ArrowRight,
} from 'lucide-react';

export default function PengaturanSistemPage() {
  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Konfigurasi Sistem</span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pengaturan Sistem</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Ringkasan pengaturan SIAKAD Premium dan tautan ke halaman pengelolaannya</p>
        </div>

        {/* Tautan ke pengaturan yang sudah nyata & tersambung database */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/superadmin/kalender"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:border-[#1E3A8A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Kalender & Tahun Akademik</h3>
                <p className="text-xs text-slate-500">Semester aktif, periode KRS & UAS — dikelola di sini</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/admin/superadmin/pengaturan-dikti"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:border-[#1E3A8A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Globe className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Integrasi PDDIKTI</h3>
                <p className="text-xs text-slate-500">Konfigurasi & uji koneksi Neo Feeder — dikelola di sini</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <BackupPanel />
      </div>
    </PortalLayout>
  );
}
