'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { Award, CheckCircle2, AlertTriangle, RefreshCw, X, Search, Settings2 } from 'lucide-react';

type Status = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface Row {
  id: string;
  status: Status;
  nim: string;
  name: string;
  studyProgram: string;
  entryYear: number;
  sksLulus: number;
  sksRequired: number;
  ipk: number | null;
  thesisGrade: string | null;
  suggestedPredicate: string;
  predicate: string | null;
  graduationDate: string | null;
  skNumber: string | null;
  adminNote: string | null;
  appliedAt: string;
  decidedAt: string | null;
}

const STATUS_LABEL: Record<Status, string> = { SUBMITTED: 'Menunggu Verifikasi', APPROVED: 'Lulus', REJECTED: 'Ditolak' };
const STATUS_TONE: Record<Status, string> = {
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

async function post(path: string, body: unknown) {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/graduation${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(message || `Permintaan gagal (HTTP ${res.status}).`);
  }
  return data;
}

export default function AdminYudisiumPage() {
  const [statusFilter, setStatusFilter] = useState<'' | Status>('');
  const table = useServerTable<Row, { counts?: Record<string, number> }>({
    endpoint: 'graduation/admin',
    defaultSortKey: 'appliedAt',
    defaultPageSize: 25,
    params: { status: statusFilter },
  });

  const [selected, setSelected] = useState<Row | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // form keputusan
  const [gradDate, setGradDate] = useState('');
  const [skNumber, setSkNumber] = useState('');
  const [predicate, setPredicate] = useState('');
  const [note, setNote] = useState('');

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const open = (r: Row) => {
    setSelected(r);
    setGradDate(r.graduationDate ? r.graduationDate.slice(0, 10) : '');
    setSkNumber(r.skNumber || '');
    setPredicate(r.predicate || r.suggestedPredicate);
    setNote('');
  };

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    try {
      await fn();
      notify(true, okText);
      setSelected(null);
      table.reload();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const counts = table.extra.counts || {};
  const totalAll = Object.values(counts).reduce((n, v) => n + v, 0);

  return (
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${
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

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Yudisium &amp; Kelulusan</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                Verifikasi pendaftar yudisium (syarat SKS, IPK, tugas akhir, dan tagihan sudah dicek sistem saat mendaftar), lalu
                tetapkan tanggal kelulusan, nomor SK, dan predikat. Mahasiswa yang disetujui otomatis berstatus Lulus.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([['', `Semua (${totalAll})`] as const, ...(['SUBMITTED', 'APPROVED', 'REJECTED'] as Status[]).map((s) => [s, `${STATUS_LABEL[s]} (${counts[s] ?? 0})`] as const)]).map(
            ([key, label]) => (
              <button
                key={key || 'all'}
                onClick={() => setStatusFilter(key as '' | Status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  statusFilter === key
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Cari NIM atau nama mahasiswa..."
              value={table.searchInput}
              onChange={(e) => table.setSearchInput(e.target.value)}
            />
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Mahasiswa</th>
                  <th className="py-2.5 px-3">Program Studi</th>
                  <th className="py-2.5 px-3 text-center">SKS Lulus</th>
                  <th className="py-2.5 px-3 text-center">IPK</th>
                  <th className="py-2.5 px-3">Mendaftar</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-3 text-center text-slate-400">
                      Belum ada pendaftar yudisium untuk filter ini.
                    </td>
                  </tr>
                )}
                {table.items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{r.name}</p>
                      <p className="font-mono text-[#1E3A8A]">{r.nim}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{r.studyProgram}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {r.sksLulus}/{r.sksRequired}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{r.ipk?.toFixed(2) ?? '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{fmtDate(r.appliedAt)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_TONE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => open(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> {r.status === 'SUBMITTED' ? 'Proses' : 'Detail'}
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
            noun="pendaftar"
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </div>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} (${selected.nim})` : ''}
        subtitle={selected ? STATUS_LABEL[selected.status] : ''}
        icon={<Award className="w-5 h-5" />}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">SKS Lulus</p>
                <p className="font-black text-slate-900">
                  {selected.sksLulus}/{selected.sksRequired}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">IPK</p>
                <p className="font-black text-slate-900">{selected.ipk?.toFixed(2) ?? '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Nilai Skripsi</p>
                <p className="font-black text-slate-900">{selected.thesisGrade ?? '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Angkatan</p>
                <p className="font-black text-slate-900">{selected.entryYear}</p>
              </div>
            </div>

            {selected.status === 'SUBMITTED' ? (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal Kelulusan *</label>
                    <input type="date" className={inputCls} value={gradDate} onChange={(e) => setGradDate(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nomor SK Yudisium *</label>
                    <input className={inputCls} value={skNumber} onChange={(e) => setSkNumber(e.target.value)} placeholder="mis. 123/SK/REKTOR/2026" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Predikat Kelulusan</label>
                    <select className={inputCls} value={predicate} onChange={(e) => setPredicate(e.target.value)}>
                      {Array.from(
                        new Set([selected.suggestedPredicate, 'Dengan Pujian (Cum Laude)', 'Sangat Memuaskan', 'Memuaskan', 'Cukup'])
                      ).map((p) => (
                        <option key={p} value={p}>
                          {p}
                          {p === selected.suggestedPredicate ? ' (sesuai IPK)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Catatan / Alasan penolakan</label>
                    <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    disabled={busy || note.trim().length < 3}
                    onClick={() => run(() => post(`/admin/${selected.id}/reject`, { note }), 'Pendaftaran yudisium ditolak.')}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl disabled:opacity-60 cursor-pointer"
                  >
                    Tolak
                  </button>
                  <button
                    disabled={busy || !gradDate || !skNumber.trim()}
                    onClick={() =>
                      run(
                        () => post(`/admin/${selected.id}/approve`, { graduationDate: gradDate, skNumber, predicate, note }),
                        'Kelulusan ditetapkan. Status mahasiswa menjadi Lulus.'
                      )
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 cursor-pointer"
                  >
                    {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Tetapkan Lulus
                  </button>
                </div>
              </>
            ) : (
              <div className="text-[13px] space-y-1 p-4 rounded-xl border border-slate-200">
                {selected.status === 'APPROVED' ? (
                  <>
                    <p>
                      <b>Predikat:</b> {selected.predicate}
                    </p>
                    <p>
                      <b>Tanggal kelulusan:</b> {fmtDate(selected.graduationDate)}
                    </p>
                    <p>
                      <b>No. SK:</b> {selected.skNumber}
                    </p>
                  </>
                ) : (
                  <p>
                    <b>Alasan penolakan:</b> {selected.adminNote}
                  </p>
                )}
                <p className="text-slate-400">Diputuskan {fmtDate(selected.decidedAt)}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
