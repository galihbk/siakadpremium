'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import {
  BarChart3,
  Eye,
  Users,
  CalendarDays,
  FileText,
  RefreshCw,
  Loader2,
  XCircle,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Link2,
  Share2,
  ArrowRight,
} from 'lucide-react';

interface ChartPoint {
  label: string;
  visitors: number;
  percent: number;
}

interface DashboardData {
  overview: {
    totalVisits: number;
    uniqueVisitors: number;
    todayVisits: number;
    pmbLeads: number;
    totalArticles: number;
    totalUsers: number;
    totalStudents: number;
    totalLecturers: number;
    totalCourses: number;
  };
  charts: {
    today: ChartPoint[];
    '7days': ChartPoint[];
    '30days': ChartPoint[];
  };
  devices: {
    mobilePercent: number;
    desktopPercent: number;
    tabletPercent: number;
    mobileCount: number;
    desktopCount: number;
    tabletCount: number;
  };
  sources: {
    googlePercent: number;
    socialPercent: number;
    directPercent: number;
    referralPercent: number;
  };
  topPages: { path: string; views: number }[];
}

function BarChart({ points }: { points: ChartPoint[] }) {
  return (
    <div className="flex items-end gap-2.5 h-40 px-1">
      {points.map((p) => (
        <div key={p.label} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-[10px] font-bold text-slate-500">{p.visitors}</span>
          <div className="w-full h-28 flex items-end bg-slate-50 rounded-lg overflow-hidden">
            <div
              className="w-full bg-gradient-to-t from-[#1E3A8A] to-blue-400 rounded-t-lg transition-all group-hover:from-[#D4A017] group-hover:to-amber-300"
              style={{ height: `${Math.max(2, p.percent)}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

function SourceBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AnalitikKunjunganPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<'today' | '7days' | '30days'>('7days');

  const apiBase = getApiBaseUrl();

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/analytics/dashboard`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Gagal memuat data analitik');
      const json = await res.json();
      setData(json?.data || json);
      setError(null);
    } catch {
      setError('Gagal memuat data analitik kunjungan. Periksa koneksi ke server API.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
                Analitik Website
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                <BarChart3 className="w-6 h-6 text-[#D4A017]" />
                Monitoring Kunjungan Website & Profil Kampus
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                Statistik lalu lintas pengunjung website utama dan halaman profil kampus secara real-time.
              </p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60"
              title="Segarkan"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat data analitik...
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Kunjungan</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{data.overview.totalVisits.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pengunjung Unik</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{data.overview.uniqueVisitors.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kunjungan Hari Ini</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{data.overview.todayVisits.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Leads Pendaftar PMB</p>
                </div>
                <p className="text-2xl font-black text-slate-900">{data.overview.pmbLeads.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100 bg-slate-50">
                <div>
                  <h2 className="font-bold text-slate-800">Tren Kunjungan</h2>
                  <p className="text-xs text-slate-500">Jumlah kunjungan nyata dari log pengunjung</p>
                </div>
                <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 self-start sm:self-auto">
                  {[
                    { key: 'today', label: 'Hari Ini' },
                    { key: '7days', label: '7 Hari' },
                    { key: '30days', label: '30 Hari' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setChartTab(t.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        chartTab === t.key ? 'bg-[#1E3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <BarChart points={data.charts[chartTab]} />
              </div>
            </div>

            {/* Devices & Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-bold text-slate-800 mb-4">Jenis Perangkat</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Mobile" percent={data.devices.mobilePercent} color="bg-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Desktop" percent={data.devices.desktopPercent} color="bg-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tablet className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Tablet" percent={data.devices.tabletPercent} color="bg-amber-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-bold text-slate-800 mb-4">Sumber Kunjungan</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Google / Pencarian" percent={data.sources.googlePercent} color="bg-rose-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Media Sosial" percent={data.sources.socialPercent} color="bg-purple-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Langsung (Direct)" percent={data.sources.directPercent} color="bg-slate-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <SourceBar label="Referral" percent={data.sources.referralPercent} color="bg-teal-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Halaman Paling Banyak Dikunjungi</h2>
                  <p className="text-xs text-slate-500">Dikelompokkan langsung dari log kunjungan nyata</p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {data.topPages.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">Belum ada data kunjungan.</div>
                ) : (
                  data.topPages.map((p, idx) => (
                    <div key={p.path} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E3A8A] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-mono font-semibold text-slate-800">{p.path}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{p.views.toLocaleString('id-ID')}x kunjungan</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PortalLayout>
  );
}
