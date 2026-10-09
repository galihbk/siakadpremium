'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Users,
  UserCheck,
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  Building,
  GraduationCap,
  CalendarDays,
  ClipboardList,
  BookOpenCheck,
  UserRound,
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
  studentsByProdi: { name: string; count: number }[];
  studentStatusBreakdown: { status: string; count: number }[];
  studentGenderBreakdown: { label: string; count: number }[];
  studentsByEntryYear: { year: number; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Aktif: 'bg-emerald-500',
  Cuti: 'bg-amber-500',
  Lulus: 'bg-blue-500',
  DO: 'bg-rose-500',
  Pindah: 'bg-slate-400',
};

const QUICK_LINKS = [
  { href: '/admin/mahasiswa', label: 'Data Mahasiswa', icon: Users, color: 'bg-blue-50 text-[#1E3A8A]' },
  { href: '/admin/dosen', label: 'Data Dosen', icon: UserCheck, color: 'bg-emerald-50 text-emerald-700' },
  { href: '/admin/jadwal', label: 'Jadwal Kelas', icon: CalendarDays, color: 'bg-amber-50 text-amber-700' },
  { href: '/admin/krs', label: 'KRS', icon: ClipboardList, color: 'bg-violet-50 text-violet-700' },
  { href: '/admin/nilai', label: 'Nilai', icon: BookOpenCheck, color: 'bg-rose-50 text-rose-700' },
  { href: '/admin/kurikulum', label: 'Kurikulum & MK', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-700' },
];

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

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle hover:border-[#1E3A8A]/30 hover:shadow-sm transition-all text-center"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${q.color}`}>
                <q.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">{q.label}</span>
            </Link>
          ))}
        </div>

        {/* Sebaran Mahasiswa: per Prodi, Status, Gender, Angkatan */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
            <h3 className="text-base font-bold text-slate-900">Sebaran Mahasiswa per Program Studi</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Jumlah mahasiswa terdaftar per prodi, dari yang terbanyak</p>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Memuat data...</span>
              </div>
            ) : (summary?.studentsByProdi?.length ?? 0) === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Belum ada data mahasiswa.</p>
            ) : (
              <div className="space-y-3">
                {summary!.studentsByProdi.map((p) => {
                  const max = summary!.studentsByProdi[0]?.count || 1;
                  const pct = Math.max(4, Math.round((p.count / max) * 100));
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 truncate pr-2">{p.name}</span>
                        <span className="font-bold text-[#1E3A8A] shrink-0">{p.count.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] to-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-3.5">Status Mahasiswa</h3>
              {loading || (summary?.studentStatusBreakdown?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">{loading ? 'Memuat...' : 'Belum ada data.'}</p>
              ) : (
                <>
                  <div className="h-2.5 rounded-full overflow-hidden flex w-full bg-slate-100 mb-3">
                    {summary!.studentStatusBreakdown.map((s) => {
                      const total = summary!.totalMahasiswaAktif || 1;
                      const pct = Math.max(2, (s.count / total) * 100);
                      return (
                        <div
                          key={s.status}
                          className={STATUS_COLORS[s.status] || 'bg-slate-400'}
                          style={{ width: `${pct}%` }}
                          title={`${s.status}: ${s.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {summary!.studentStatusBreakdown.map((s) => (
                      <div key={s.status} className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s.status] || 'bg-slate-400'}`} />
                        <span className="text-slate-600 truncate">{s.status}</span>
                        <span className="ml-auto font-bold text-slate-800">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-3.5">Jenis Kelamin</h3>
              {loading || (summary?.studentGenderBreakdown?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">{loading ? 'Memuat...' : 'Belum ada data.'}</p>
              ) : (
                <div className="flex items-center gap-4">
                  {summary!.studentGenderBreakdown.map((g) => {
                    const total = summary!.totalMahasiswaAktif || 1;
                    const pct = Math.round((g.count / total) * 100);
                    return (
                      <div key={g.label} className="flex items-center gap-2">
                        <UserRound className={`w-4 h-4 ${g.label === 'Perempuan' ? 'text-rose-500' : 'text-blue-500'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {g.label} <span className="text-slate-400 font-medium">{pct}%</span>
                          </p>
                          <p className="text-[11px] text-slate-500">{g.count.toLocaleString('id-ID')} mahasiswa</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tren Mahasiswa per Angkatan */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
          <h3 className="text-base font-bold text-slate-900">Tren Mahasiswa Baru per Angkatan</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">6 angkatan terakhir berdasarkan tahun masuk</p>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memuat data...</span>
            </div>
          ) : (summary?.studentsByEntryYear?.length ?? 0) === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Belum ada data angkatan.</p>
          ) : (
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-40">
              {summary!.studentsByEntryYear.map((y) => {
                const max = Math.max(...summary!.studentsByEntryYear.map((x) => x.count), 1);
                const pct = Math.max(6, Math.round((y.count / max) * 100));
                return (
                  <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{y.count}</span>
                    <div
                      className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#1E3A8A] to-blue-400"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[11px] font-semibold text-slate-500">{y.year}</span>
                  </div>
                );
              })}
            </div>
          )}
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
