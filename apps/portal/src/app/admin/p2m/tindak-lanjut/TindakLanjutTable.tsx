'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, AlertTriangle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';

export interface AuditFollowUp {
  id: string;
  code: string | null;
  studyProgram: string;
  auditDate: string;
  auditorName: string;
  result: string;
  status: string;
  findingsSummary: string | null;
  followUpDeadline: string | null;
  followUpStatus: string;
  notes: string | null;
}

const RESULT_STYLE: Record<string, string> = {
  Sesuai: 'bg-emerald-100 text-emerald-700',
  'Temuan Minor': 'bg-amber-100 text-amber-700',
  'Temuan Mayor': 'bg-rose-100 text-rose-700',
};

const FOLLOW_UP_STATUSES = ['Belum Ditindaklanjuti', 'Dalam Proses', 'Selesai'];

const isOverdue = (deadline: string | null) => Boolean(deadline && new Date(deadline) < new Date());

export function TindakLanjutTable({ initialAudits }: { initialAudits: AuditFollowUp[] }) {
  const apiBase = getApiBaseUrl();
  const [audits, setAudits] = useState<AuditFollowUp[]>(initialAudits);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOpenAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/p2m/audits`);
      if (res.ok) {
        const json = await res.json();
        const all: AuditFollowUp[] = Array.isArray(json.data) ? json.data : [];
        setAudits(all.filter((a) => a.followUpStatus !== 'Selesai'));
      }
    } catch (err) {
      console.warn('Gagal memuat tindak lanjut audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (item: AuditFollowUp, nextStatus: string) => {
    setUpdatingId(item.id);
    const prevStatus = item.followUpStatus;
    setAudits((prev) =>
      nextStatus === 'Selesai'
        ? prev.filter((a) => a.id !== item.id)
        : prev.map((a) => (a.id === item.id ? { ...a, followUpStatus: nextStatus } : a)),
    );
    try {
      const res = await fetch(`${apiBase}/p2m/audits/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpStatus: nextStatus }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui status tindak lanjut.');
      showToast(
        nextStatus === 'Selesai'
          ? `Tindak lanjut untuk ${item.studyProgram} ditandai selesai.`
          : `Status tindak lanjut ${item.studyProgram} diperbarui.`,
      );
    } catch (err) {
      setAudits((prev) => {
        if (nextStatus === 'Selesai') return [...prev, { ...item, followUpStatus: prevStatus }];
        return prev.map((a) => (a.id === item.id ? { ...a, followUpStatus: prevStatus } : a));
      });
      showToast('Gagal menghubungi server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = audits.filter(
    (a) =>
      a.studyProgram.toLowerCase().includes(search.toLowerCase()) ||
      a.auditorName.toLowerCase().includes(search.toLowerCase()) ||
      (a.code && a.code.toLowerCase().includes(search.toLowerCase())),
  );

  const overdueCount = audits.filter((a) => isOverdue(a.followUpDeadline)).length;

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<AuditFollowUp>(filtered, 'followUpDeadline');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/p2m"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard P2M
        </Link>
      </div>

      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">P2M</span>
          <h1 className="text-xl sm:text-2xl font-black">Tindak Lanjut Audit</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Rekap temuan audit mutu yang belum ditindaklanjuti tuntas</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Lewat Tenggat</p>
          <p className="text-xl font-black text-white">{overdueCount} Temuan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari prodi, auditor, atau kode..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchOpenAudits}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<AuditFollowUp> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Temuan</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Hasil</th>
                <SortableTh<AuditFollowUp> label="Tenggat" column="followUpDeadline" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada temuan yang masih terbuka. Semua tindak lanjut sudah selesai.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => {
                  const overdue = isOverdue(a.followUpDeadline);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{a.studyProgram}</div>
                        {a.code && <div className="text-[11px] text-slate-400 font-mono">{a.code}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <p className="truncate">{a.findingsSummary || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RESULT_STYLE[a.result] || 'bg-slate-100 text-slate-600'}`}>
                          {a.result}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {a.followUpDeadline ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                            {overdue && <AlertTriangle className="w-3.5 h-3.5" />}
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(a.followUpDeadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Tidak ada tenggat</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.followUpStatus}
                          onChange={(e) => handleUpdateStatus(a, e.target.value)}
                          disabled={updatingId === a.id}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border-0 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${
                            a.followUpStatus === 'Dalam Proses' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {FOLLOW_UP_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {updatingId === a.id && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1.5 text-slate-400" />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="temuan" />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
