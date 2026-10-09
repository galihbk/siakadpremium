'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Award, ClipboardCheck, AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, CalendarDays } from 'lucide-react';

interface OverviewData {
  totalStandards: number;
  activeStandards: number;
  totalAudits: number;
  completedAudits: number;
  openFollowUps: number;
  auditsByResult: { result: string; count: number }[];
  recentAudits: {
    id: string;
    code: string | null;
    studyProgram: string;
    auditDate: string;
    auditorName: string;
    result: string;
    status: string;
  }[];
}

const RESULT_COLORS: Record<string, string> = {
  Sesuai: 'bg-emerald-500',
  'Temuan Minor': 'bg-amber-500',
  'Temuan Mayor': 'bg-rose-500',
};

export default function AdminP2mDashboardPage() {
  const [summary, setSummary] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/p2m/overview`);
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data || json);
      }
    } catch (err) {
      console.warn('Gagal memuat ringkasan P2M:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Penjaminan Mutu (P2M)
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pusat Kendali Penjaminan Mutu</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Monitoring Standar Mutu & Audit Mutu Internal (AMI) seluruh program studi
            </p>
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standar Mutu</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">{loading ? '-' : summary?.totalStandards ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">{summary?.activeStandards ?? 0} standar aktif</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Mutu Internal</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.totalAudits ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">{summary?.completedAudits ?? 0} audit selesai</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tindak Lanjut Terbuka</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.openFollowUps ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Temuan belum ditindaklanjuti tuntas</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Sesuai Standar</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {loading
                ? '-'
                : summary?.auditsByResult.find((r) => r.result === 'Sesuai')?.count ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">dari {summary?.totalAudits ?? 0} audit tercatat</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/p2m/standar-mutu"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-subtle hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Kelola Standar Mutu</p>
                <p className="text-xs text-slate-500">Daftar standar SPMI & target capaian</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link
            href="/admin/p2m/audit-mutu"
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-subtle hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Audit Mutu Internal</p>
                <p className="text-xs text-slate-500">Jadwal, hasil, dan tindak lanjut AMI per prodi</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Audit Mutu Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">5 pelaksanaan AMI paling baru dicatat</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Program Studi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Auditor</th>
                  <th className="py-3 px-4 text-center">Hasil</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : (summary?.recentAudits?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada data audit mutu.
                    </td>
                  </tr>
                ) : (
                  summary!.recentAudits.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{a.studyProgram}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(a.auditDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{a.auditorName}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
                            RESULT_COLORS[a.result] || 'bg-slate-400'
                          }`}
                        >
                          {a.result}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {a.status}
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
