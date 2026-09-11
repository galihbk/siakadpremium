'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  GraduationCap,
  Award,
  RefreshCw,
  Printer,
  Download,
  AlertCircle,
  Building2,
  PieChart,
  School,
} from 'lucide-react';
import { AdmissionApplicantItem, AdmissionStatsSummary } from '@siakad/types';

export default function StatistikPage() {
  const [stats, setStats] = useState<AdmissionStatsSummary | null>(null);
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const apiBase = getApiBaseUrl();

  const fetchData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [statsRes, applicantsRes] = await Promise.all([
        fetch(`${apiBase}/admissions/stats`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/applicants?limit=100`, { cache: 'no-store' }),
      ]);

      if (statsRes.ok) {
        const jsonStats = await statsRes.json();
        setStats(jsonStats.data || jsonStats);
      }

      if (applicantsRes.ok) {
        const jsonApplicants = await applicantsRes.json();
        const list = Array.isArray(jsonApplicants.data)
          ? jsonApplicants.data
          : Array.isArray(jsonApplicants.data?.data)
          ? jsonApplicants.data.data
          : [];
        setApplicants(list);
      }
    } catch (err: any) {
      console.error('Error fetching PMB stats:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Breakdown by Prodi
  const prodiStats = useMemo(() => {
    if (!applicants.length) return [];
    const map: Record<string, { total: number; verified: number; accepted: number; registered: number }> = {};

    applicants.forEach((a) => {
      const prodi = a.chosenStudyProgram || 'Umum';
      if (!map[prodi]) {
        map[prodi] = { total: 0, verified: 0, accepted: 0, registered: 0 };
      }
      map[prodi].total += 1;
      if (['VERIFIED', 'PASSED', 'REGISTERED'].includes(a.status)) map[prodi].verified += 1;
      if (['PASSED', 'REGISTERED'].includes(a.status)) map[prodi].accepted += 1;
      if (a.status === 'REGISTERED') map[prodi].registered += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      conversionRate: data.total > 0 ? Math.round((data.registered / data.total) * 100) : 0,
    }));
  }, [applicants]);

  // Breakdown by Jalur
  const jalurStats = useMemo(() => {
    if (!applicants.length) return [];
    const map: Record<string, number> = {};
    applicants.forEach((a) => {
      const jalur = a.jalurPendaftaran || 'Jalur Mandiri';
      map[jalur] = (map[jalur] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / applicants.length) * 100),
    }));
  }, [applicants]);

  // Top Asal Sekolah
  const topSchools = useMemo(() => {
    if (!applicants.length) return [];
    const map: Record<string, number> = {};
    applicants.forEach((a) => {
      if (a.highSchool && a.highSchool.trim() !== '-') {
        const sch = a.highSchool.trim();
        map[sch] = (map[sch] || 0) + 1;
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [applicants]);

  const totalApplicants = applicants.length || stats?.totalApplicants || 0;
  const acceptedTotal = applicants.filter((a) => ['PASSED', 'REGISTERED'].includes(a.status)).length;
  const registeredTotal = applicants.filter((a) => a.status === 'REGISTERED').length;
  const verifiedTotal = applicants.filter((a) => ['VERIFIED', 'PASSED', 'REGISTERED'].includes(a.status)).length;
  const acceptanceRate = totalApplicants > 0 ? Math.round((acceptedTotal / totalApplicants) * 100) : 0;

  const handleExportCsv = () => {
    if (prodiStats.length === 0) return;
    const headers = ['Program Studi', 'Total Pendaftar', 'Terverifikasi', 'Lolos Seleksi', 'Registrasi Ulang', 'Persentase Konversi'];
    const rows = prodiStats.map((p) => [
      `"${p.name}"`,
      p.total,
      p.verified,
      p.accepted,
      p.registered,
      `"${p.conversionRate}%"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekapitulasi_pmb_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/statistik"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rekapitulasi &amp; Statistik Penerimaan Mahasiswa Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Laporan agregasi hasil seleksi, distribusi program studi, jalur masuk, dan tingkat konversi pendaftar.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={fetchData} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Pendaftar Masuk</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">{totalApplicants} Orang</p>
            <span className="text-[11px] text-slate-400">Pendaftar akun sistem PMB</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Berkas Terverifikasi</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-blue-800 mt-2">{verifiedTotal} Berkas</p>
            <span className="text-[11px] text-slate-400">Memenuhi syarat administratif</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Dinyatakan Diterima</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-600 mt-2">{acceptedTotal} Orang</p>
            <span className="text-[11px] text-slate-400">Tingkat kelulusan: {acceptanceRate}%</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Registrasi Ulang (NIM)</span>
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-purple-700 mt-2">{registeredTotal} Mahasiswa</p>
            <span className="text-[11px] text-slate-400">Telah memiliki NIM aktif</span>
          </div>
        </div>

        {/* Breakdown by Program Studi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rekapitulasi Berdasarkan Program Studi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sebaran pendaftar, hasil seleksi, dan mahasiswa registrasi per jurusan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Program Studi</th>
                  <th className="py-3 px-4 text-center">Pendaftar</th>
                  <th className="py-3 px-4 text-center">Terverifikasi</th>
                  <th className="py-3 px-4 text-center">Lolos Seleksi</th>
                  <th className="py-3 px-4 text-center">Registrasi Ulang</th>
                  <th className="py-3 px-4 text-center">Persentase Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat rekapitulasi data...</span>
                    </td>
                  </tr>
                ) : prodiStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Belum ada data agregasi program studi.
                    </td>
                  </tr>
                ) : (
                  prodiStats.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {row.total}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700">
                        {row.verified}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {row.accepted}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                        {row.registered}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1E3A8A] h-full rounded-full"
                              style={{ width: `${Math.min(row.conversionRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px]">{row.conversionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two-Column Grid: Jalur Pendaftaran & Asal Sekolah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jalur Pendaftaran */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribusi Jalur Pendaftaran</h3>
                <p className="text-xs text-slate-500">Proporsi jalur masuk calon mahasiswa baru.</p>
              </div>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {jalurStats.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-900 font-bold">{item.count} orang ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {jalurStats.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data pendaftar.</p>
              )}
            </div>
          </div>

          {/* Asal Sekolah */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Sekolah Asal Pendaftar</h3>
                <p className="text-xs text-slate-500">SMA/SMK dengan pendaftar terbanyak.</p>
              </div>
              <School className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5">
              {topSchools.map(([school, count], idx) => (
                <div
                  key={school}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{school}</span>
                  </div>
                  <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md">
                    {count} pendaftar
                  </span>
                </div>
              ))}
              {topSchools.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data sekolah pendaftar.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
