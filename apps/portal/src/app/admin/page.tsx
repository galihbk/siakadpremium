'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Users,
  UserCheck,
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  Building,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface FacultyRow {
  id: string;
  name: string;
  code: string;
  studyProgramsCount: number;
  studentsCount: number;
  lecturersCount: number;
  accreditation: string;
}

interface DashboardSummary {
  totalMahasiswaAktif: number;
  totalDosen: number;
  totalProgramStudi: number;
  totalFakultas: number;
  persentaseRegistrasiKRS: number;
  mahasiswaBaruTerdaftar: number;
  facultyList: FacultyRow[];
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/admin-dashboard`);
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data || json);
      }
    } catch (err) {
      console.warn('Gagal memuat dashboard BAAK dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const ratioDosenMhs =
    summary && summary.totalDosen > 0 ? (summary.totalMahasiswaAktif / summary.totalDosen).toFixed(1) : '-';

  return (
    <PortalLayout
      role="admin"
      userName="Ahmad Fauzi, S.Kom."
      userIdText="Admin BAAK & Sistem Informasi Pusat"
    >
      <div className="space-y-6">

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Biro Administrasi Akademik & Kemahasiswaan (BAAK)
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Kendali Administrasi Akademik ITN
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Monitoring Real-Time Civitas Akademika &amp; Registrasi Mahasiswa
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan BAAK</span>
            </button>
          </div>
        </div>

        {/* 4 Admin Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mahasiswa Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">
              {loading ? '-' : (summary?.totalMahasiswaAktif ?? 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">{summary?.totalProgramStudi ?? 0} Program Studi Aktif</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dosen & Pengajar</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.totalDosen ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Rasio Dosen : Mhs: <strong className="text-slate-700">1 : {ratioDosenMhs}</strong></p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registrasi KRS Selesai</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.persentaseRegistrasiKRS ?? 0}%</p>
            <p className="text-xs text-slate-500 mt-1">Mahasiswa aktif dengan KRS diajukan semester ini</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendaftar PMB</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.mahasiswaBaruTerdaftar ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Formulir pendaftaran yang sudah disubmit</p>
          </div>
        </div>

        {/* Faculty Distribution Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Distribusi Akademik per Fakultas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sebaran mahasiswa, dosen, dan program studi per fakultas dari basis data
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Fakultas</th>
                  <th className="py-3 px-4 text-center">Program Studi</th>
                  <th className="py-3 px-4 text-center">Mahasiswa Aktif</th>
                  <th className="py-3 px-4 text-center">Dosen</th>
                  <th className="py-3 px-4 text-center">Akreditasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data fakultas...</span>
                      </div>
                    </td>
                  </tr>
                ) : (summary?.facultyList?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data fakultas.
                    </td>
                  </tr>
                ) : (
                  summary!.facultyList.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#1E3A8A]" />
                          <span>{f.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">{f.studyProgramsCount} Prodi</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#1E3A8A]">
                        {f.studentsCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">{f.lecturersCount} Orang</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          {f.accreditation}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
