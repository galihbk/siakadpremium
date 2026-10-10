'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Users, GraduationCap, Briefcase, ClipboardCheck, ArrowRight } from 'lucide-react';

interface PegawaiItem {
  id: string;
  category: string;
  status: string;
}

export default function SdmDashboardPage() {
  const [employees, setEmployees] = useState<PegawaiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/employees`);
        if (res.ok) {
          const json = await res.json();
          setEmployees(json.data ?? json ?? []);
        }
      } catch (err) {
        console.error('Gagal memuat data pegawai', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = employees.length;
  const dosenCount = employees.filter((e) => e.category?.includes('Dosen')).length;
  const tendikCount = total - dosenCount;
  const aktifCount = employees.filter((e) => e.status === 'Aktif').length;

  return (
    <PortalLayout role="sdm" userName="Dewi Lestari, S.Psi., M.M." userIdText="Kepala Biro SDM & Kepegawaian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            Sumber Daya Manusia
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Dashboard SDM</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Ringkasan kepegawaian dan kehadiran seluruh dosen & karyawan</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Pegawai', val: loading ? '…' : total, icon: Users, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Dosen', val: loading ? '…' : dosenCount, icon: GraduationCap, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Tenaga Kependidikan', val: loading ? '…' : tendikCount, icon: Briefcase, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
            { label: 'Aktif Bekerja', val: loading ? '…' : aktifCount, icon: ClipboardCheck, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">{c.label}</p>
                <c.icon className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-2xl font-black">{c.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/sdm/pegawai"
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#1E3A8A] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Data Pegawai</h3>
              <p className="text-xs text-slate-500 mt-1">Kelola biodata, jabatan, dan unit kerja dosen & karyawan</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] transition-colors" />
          </Link>

          <Link
            href="/admin/sdm/rekap-absensi"
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#1E3A8A] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Rekap Absensi</h3>
              <p className="text-xs text-slate-500 mt-1">Pantau kehadiran pagi/sore seluruh dosen & karyawan per bulan</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] transition-colors" />
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}
