'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { BadgeCheck, Search, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Row {
  id: string;
  name: string;
  nidn: string | null;
  studyProgram: string;
  employmentStatus: string | null;
  functionalPosition: string | null;
}

interface Extra {
  totalAll?: number;
  unset?: number;
  options?: string[];
}

const inputCls =
  'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

export default function SdmStatusDosenPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const table = useServerTable<Row, Extra>({
    endpoint: 'lecturers/employment-status',
    defaultSortKey: 'name',
    params: { status: statusFilter },
  });
  const options = table.extra.options || [];

  // Draft pilihan per dosen sebelum disimpan
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 4500);
  };

  const current = (r: Row) => (r.id in draft ? draft[r.id] : r.employmentStatus || '');
  const dirty = (r: Row) => r.id in draft && draft[r.id] !== (r.employmentStatus || '');

  const save = async (r: Row) => {
    setSavingId(r.id);
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${getApiBaseUrl()}/lecturers/${r.id}/employment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ employmentStatus: draft[r.id] || null }),
      });
      const json = await res.json().catch(() => null);
      const body = json?.data ?? json;
      if (!res.ok) throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || `HTTP ${res.status}`);
      notify(true, `Status kepegawaian ${r.name} disimpan.`);
      setDraft((prev) => {
        const next = { ...prev };
        delete next[r.id];
        return next;
      });
      table.reload();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menyimpan status kepegawaian.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PortalLayout role="sdm" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${
              toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="max-w-sm">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Status Kepegawaian Dosen</h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-3xl leading-relaxed">
                Hanya bagian SDM yang dapat menetapkan status kepegawaian dosen. Dosen dan BAAK hanya melihatnya.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold bg-white text-slate-700 border-slate-200">
            Total dosen <span className="text-sm font-black">{table.extra.totalAll ?? '-'}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold bg-amber-50 text-amber-700 border-amber-200">
            Belum diatur <span className="text-sm font-black">{table.extra.unset ?? '-'}</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputCls} w-full pl-9`}
                placeholder="Cari nama atau NIDN/NUPTK dosen..."
                value={table.searchInput}
                onChange={(e) => table.setSearchInput(e.target.value)}
              />
            </div>
            <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Semua status</option>
              <option value="__unset">Belum diatur</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat data: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Dosen</th>
                  <th className="py-2.5 px-3">Program Studi</th>
                  <th className="py-2.5 px-3">Jabatan Fungsional</th>
                  <th className="py-2.5 px-3 w-72">Status Kepegawaian</th>
                  <th className="py-2.5 px-3 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-3 text-center text-slate-400">
                      Tidak ada dosen yang cocok.
                    </td>
                  </tr>
                )}
                {table.items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{r.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{r.nidn || 'NIDN/NUPTK belum ada'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{r.studyProgram}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.functionalPosition || '-'}</td>
                    <td className="py-2.5 px-3">
                      <select
                        className={`${inputCls} w-full`}
                        value={current(r)}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      >
                        <option value="">Belum diatur</option>
                        {/* nilai lama di luar daftar tetap tampil agar tidak hilang diam-diam */}
                        {r.employmentStatus && !options.includes(r.employmentStatus) && (
                          <option value={r.employmentStatus}>{r.employmentStatus}</option>
                        )}
                        {options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        disabled={!dirty(r) || savingId === r.id}
                        onClick={() => save(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        {savingId === r.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Simpan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            totalPages={table.totalPages}
            noun="dosen"
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </div>
      </div>
    </PortalLayout>
  );
}
