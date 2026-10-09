'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  DollarSign,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  Check,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';

export const REPORT_STATUSES = ['Menunggu Verifikasi', 'Terverifikasi', 'Perlu Perbaikan'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface LaporanItem {
  id: string;
  code?: string;
  type: 'Penelitian' | 'Pengabdian';
  title: string;
  scheme: string;
  focusArea: string;
  leader: string;
  nidn?: string | null;
  faculty: string;
  studyProgram?: string | null;
  membersCount: number;
  year: number;
  fundingAmount: number;
  fundingSource: string;
  status: ReportStatus;
  targetOutput?: string | null;
  mitraSasaran?: string | null;
  documentUrl?: string | null;
  reviewerNote?: string | null;
  submittedAt?: string | null;
}

interface LecturerOption {
  id: string;
  nidn: string;
  fullName: string;
  studyProgramName: string;
  facultyName: string;
}

export interface LaporanConfig {
  type: 'Penelitian' | 'Pengabdian';
  /** contoh: "Penelitian" / "Pengabdian kepada Masyarakat" */
  title: string;
  breadcrumb: string;
  description: string;
  gradient: string;
  accentText: string;
  addLabel: string;
  leaderLabel: string;
  outputLabel: string;
  outputPlaceholder: string;
  hasMitra: boolean;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const STATUS_STYLE: Record<ReportStatus, string> = {
  Terverifikasi: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Menunggu Verifikasi': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Perlu Perbaikan': 'bg-rose-50 text-rose-700 border border-rose-200',
};

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

const emptyForm = (year: number) => ({
  title: '',
  lecturerId: '',
  leader: '',
  nidn: '',
  faculty: '',
  studyProgram: '',
  membersCount: '1',
  year: String(year),
  scheme: '',
  focusArea: '',
  fundingSource: '',
  fundingAmount: '',
  targetOutput: '',
  mitraSasaran: '',
  documentUrl: '',
});

export function LaporanKegiatanPage({ config }: { config: LaporanConfig }) {
  const currentYear = new Date().getFullYear();
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [year, setYear] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [search, setSearch] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<LaporanItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<ReportStatus>('Terverifikasi');
  const [verifyNote, setVerifyNote] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(currentYear));
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/lp3m/research?type=${config.type}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.data?.data || []);
      setLoadError(false);
    } catch (err) {
      console.error(`Gagal memuat laporan ${config.type}:`, err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [config.type]);

  useEffect(() => {
    load();
    fetch(`${apiBase}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setLecturers(j.data || []))
      .catch(() => {});
  }, [load]);

  const years = useMemo(
    () => [...new Set([currentYear, ...items.map((i) => i.year)])].sort((a, b) => b - a),
    [items, currentYear],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (year !== 'Semua' && String(i.year) !== year) return false;
      if (status !== 'Semua' && i.status !== status) return false;
      if (!q) return true;
      return [i.title, i.leader, i.nidn, i.focusArea, i.scheme, i.faculty, i.code].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      );
    });
  }, [items, year, status, search]);

  const metrics = useMemo(
    () => ({
      total: filtered.length,
      verified: filtered.filter((i) => i.status === 'Terverifikasi').length,
      pending: filtered.filter((i) => i.status === 'Menunggu Verifikasi').length,
      needFix: filtered.filter((i) => i.status === 'Perlu Perbaikan').length,
      funds: filtered.reduce((acc, i) => acc + (i.fundingAmount || 0), 0),
    }),
    [filtered],
  );

  const saveVerification = async () => {
    if (!verifying) return;
    try {
      const res = await fetch(`${apiBase}/lp3m/research/${verifying.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: verifyStatus, reviewerNote: verifyNote }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Laporan "${verifying.title}" ditandai: ${verifyStatus}`);
      setVerifying(null);
      load();
    } catch {
      showToast('Gagal menyimpan hasil verifikasi.');
    }
  };

  const remove = async (item: LaporanItem) => {
    if (!confirm(`Hapus laporan "${item.title}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/lp3m/research/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Laporan berhasil dihapus.');
      load();
    } catch {
      showToast('Gagal menghapus laporan.');
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/lp3m/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: config.type,
          title: form.title,
          leader: form.leader,
          nidn: form.nidn,
          faculty: form.faculty,
          studyProgram: form.studyProgram,
          membersCount: Number(form.membersCount) || 1,
          year: Number(form.year) || currentYear,
          scheme: form.scheme,
          focusArea: form.focusArea,
          fundingSource: form.fundingSource,
          fundingAmount: Number(form.fundingAmount) || 0,
          targetOutput: form.targetOutput,
          mitraSasaran: form.mitraSasaran,
          documentUrl: form.documentUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `HTTP ${res.status}`);
      }
      showToast(`Laporan ${config.type.toLowerCase()} berhasil dicatat dan menunggu verifikasi.`);
      setIsCreateOpen(false);
      setForm(emptyForm(currentYear));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan laporan.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportCsv = () => {
    const header = ['Kode', 'Judul', 'Ketua', 'NIDN', 'Fakultas', 'Program Studi', 'Skema', 'Sumber Dana', 'Dana Realisasi', 'Tahun', 'Luaran', 'Status'];
    const rows = filtered.map((i) =>
      [i.code ?? '', i.title, i.leader, i.nidn ?? '', i.faculty, i.studyProgram ?? '', i.scheme, i.fundingSource, i.fundingAmount, i.year, i.targetOutput ?? '', i.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Laporan_${config.type}_${year === 'Semua' ? 'Semua-Tahun' : year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const pickLecturer = (id: string) => {
    const l = lecturers.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      lecturerId: id,
      leader: l?.fullName ?? '',
      nidn: l?.nidn ?? '',
      faculty: l?.facultyName ?? '',
      studyProgram: l?.studyProgramName ?? '',
    }));
  };

  return (
    <PortalLayout role="lp3m" userName="Prof. Dr. Ir. H. Sudirman, M.T." userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi">
      <div className="space-y-6">
        {toast && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toast}</span>
          </div>
        )}

        {/* Banner */}
        <div className={`${config.gradient} rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={config.accentText}>{config.breadcrumb}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{config.title}</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">{config.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setForm(emptyForm(currentYear));
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{config.addLabel}</span>
            </button>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3 flex items-center justify-between">
            <span>Gagal memuat data laporan dari server.</span>
            <button onClick={load} className="font-bold underline cursor-pointer">
              Coba lagi
            </button>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Laporan</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Kegiatan yang sudah selesai</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Dana Realisasi</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(metrics.funds)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Akumulasi seluruh laporan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Butuh Verifikasi</span>
              <p className="text-3xl font-black text-amber-600 mt-1">{metrics.pending}</p>
              <p className="text-xs text-slate-500 mt-0.5">{metrics.needFix} perlu perbaikan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Terverifikasi</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{metrics.verified}</p>
              <p className="text-xs text-slate-500 mt-0.5">Masuk rekap borang akreditasi</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, nama ketua, NIDN, atau bidang fokus..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
            />
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
          >
            <option value="Semua">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                Tahun {y}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
          >
            <option value="Semua">Semua Status</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[300px]">Judul & Bidang Fokus</th>
                  <th className="py-3.5 px-4">{config.leaderLabel}</th>
                  <th className="py-3.5 px-4">Skema & Sumber Dana</th>
                  <th className="py-3.5 px-4 text-center">Tahun</th>
                  <th className="py-3.5 px-4 text-right">Dana Realisasi</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[140px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {items.length === 0
                        ? `Belum ada laporan ${config.type.toLowerCase()}. Klik "${config.addLabel}" untuk mencatat kegiatan yang sudah selesai.`
                        : 'Tidak ada laporan yang sesuai dengan filter.'}
                    </td>
                  </tr>
                )}
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-slate-800">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        {item.focusArea && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{item.focusArea}</span>
                        )}
                        {item.targetOutput && <span>Luaran: {item.targetOutput}</span>}
                      </div>
                      {config.hasMitra && item.mitraSasaran && (
                        <p className="text-[11px] text-slate-500 mt-1">Mitra: {item.mitraSasaran}</p>
                      )}
                      {item.documentUrl && (
                        <a
                          href={item.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-[#1E3A8A] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Lihat dokumen laporan
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{item.leader}</p>
                      {item.nidn && <p className="text-[11px] text-slate-500">NIDN: {item.nidn}</p>}
                      <p className="text-[11px] text-slate-400">{item.faculty}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{item.scheme || '-'}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px] font-bold">
                        {item.fundingSource}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">{item.year}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatRupiah(item.fundingAmount)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[item.status] ?? STATUS_STYLE['Menunggu Verifikasi']}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setVerifying(item);
                            setVerifyStatus(item.status === 'Perlu Perbaikan' ? 'Perlu Perbaikan' : 'Terverifikasi');
                            setVerifyNote(item.reviewerNote || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E3A8A] text-white hover:bg-[#1e40af] cursor-pointer"
                        >
                          Verifikasi
                        </button>
                        <button
                          onClick={() => remove(item)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal verifikasi */}
      {verifying && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-5 h-5 text-[#D4A017]" />
                <h3 className="font-extrabold text-base">Verifikasi Laporan {config.type}</h3>
              </div>
              <button onClick={() => setVerifying(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-black text-slate-900 text-sm leading-snug">{verifying.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>Ketua: <strong>{verifying.leader}</strong></div>
                  <div>Tahun: <strong>{verifying.year}</strong></div>
                  <div>Dana Realisasi: <strong className="text-emerald-700">{formatRupiah(verifying.fundingAmount)}</strong></div>
                  <div>Luaran: <strong>{verifying.targetOutput || '-'}</strong></div>
                </div>
                {verifying.documentUrl ? (
                  <a href={verifying.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1E3A8A] hover:underline">
                    <ExternalLink className="w-3 h-3" /> Buka dokumen laporan
                  </a>
                ) : (
                  <p className="text-amber-700 font-semibold">Dokumen laporan belum dilampirkan.</p>
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-2">Hasil Verifikasi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Terverifikasi', 'Perlu Perbaikan'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setVerifyStatus(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                        verifyStatus === st
                          ? st === 'Terverifikasi'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Verifikasi</label>
                <textarea
                  rows={3}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="Mis. kelengkapan laporan akhir, bukti luaran, atau bagian yang perlu diperbaiki..."
                  className={inputCls}
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button onClick={() => setVerifying(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button onClick={saveVerification} className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl cursor-pointer flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tambah laporan */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Catat Laporan {config.type} Selesai</h3>
                <p className="text-[11px] text-blue-200">Hanya untuk kegiatan yang sudah selesai dilaksanakan</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={create} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{config.leaderLabel} *</label>
                <SearchableSelect
                  required
                  value={form.lecturerId}
                  onChange={pickLecturer}
                  placeholder="Pilih dosen"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  options={lecturers.map((l) => ({
                    value: l.id,
                    label: `${l.fullName} (NIDN: ${l.nidn})`,
                    keywords: `${l.studyProgramName} ${l.facultyName}`,
                  }))}
                />
                {form.leader && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {form.studyProgram} &bull; {form.faculty}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Pelaksanaan *</label>
                  <input type="number" required min={2000} max={currentYear + 1} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Anggota Tim</label>
                  <input type="number" min={1} value={form.membersCount} onChange={(e) => setForm({ ...form, membersCount: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skema</label>
                  <input value={form.scheme} onChange={(e) => setForm({ ...form, scheme: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bidang Fokus</label>
                  <input value={form.focusArea} onChange={(e) => setForm({ ...form, focusArea: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
                  <input
                    list="lp3m-funding-sources"
                    value={form.fundingSource}
                    onChange={(e) => setForm({ ...form, fundingSource: e.target.value })}
                    placeholder="Mis. DIPA Internal, BIMA, Mandiri"
                    className={inputCls}
                  />
                  <datalist id="lp3m-funding-sources">
                    <option value="DIPA Internal" />
                    <option value="BIMA Kemdiktisaintek" />
                    <option value="Mandiri" />
                    <option value="Mitra / Industri" />
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dana Realisasi (Rp)</label>
                  <input type="number" min={0} value={form.fundingAmount} onChange={(e) => setForm({ ...form, fundingAmount: e.target.value })} className={inputCls} />
                </div>
              </div>

              {config.hasMitra && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mitra Sasaran</label>
                  <input value={form.mitraSasaran} onChange={(e) => setForm({ ...form, mitraSasaran: e.target.value })} className={inputCls} />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">{config.outputLabel}</label>
                <input value={form.targetOutput} onChange={(e) => setForm({ ...form, targetOutput: e.target.value })} placeholder={config.outputPlaceholder} className={inputCls} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan Dokumen Laporan Akhir</label>
                <input type="url" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} placeholder="https://..." className={inputCls} />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-60 text-white rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Laporan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
