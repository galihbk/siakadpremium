'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { Mail, Search, RefreshCw, Check, X, Eye, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

type LetterStatus = 'MENUNGGU_PA' | 'DIPROSES_BAAK' | 'SELESAI' | 'DITOLAK';

interface LetterRow {
  id: string;
  requestNo: string;
  letterNo: string | null;
  typeName: string;
  purpose: string;
  targetInstitution: string;
  status: LetterStatus;
  advisorNote: string | null;
  rejectionReason: string | null;
  rejectedBy: string | null;
  letterBody: string | null;
  createdAt: string;
  student: {
    nim: string;
    user: { fullName: string };
    studyProgram: { name: string } | null;
  };
}

const STATUS_STYLE: Record<LetterStatus, string> = {
  MENUNGGU_PA: 'bg-amber-50 text-amber-700 border border-amber-200',
  DIPROSES_BAAK: 'bg-blue-50 text-[#1E3A8A] border border-blue-200',
  SELESAI: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DITOLAK: 'bg-rose-50 text-rose-700 border border-rose-200',
};
const STATUS_LABEL: Record<LetterStatus, string> = {
  MENUNGGU_PA: 'Menunggu Dosen PA',
  DIPROSES_BAAK: 'Diproses BAAK',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminSuratPage() {
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, menungguPa: 0, diprosesBaak: 0, selesai: 0, ditolak: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [status, setStatus] = useState('Semua');
  const [search, setSearch] = useState('');

  const [issuing, setIssuing] = useState<LetterRow | null>(null);
  const [letterBodyDraft, setLetterBodyDraft] = useState('');
  const [rejectTarget, setRejectTarget] = useState<LetterRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewLetter, setPreviewLetter] = useState<LetterRow | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'Semua') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${getApiBaseUrl()}/letters?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLetters(json.data?.data ?? []);
      if (json.data?.summary) setSummary(json.data.summary);
    } catch (err) {
      console.error('Gagal memuat data surat:', err);
      showToast('Gagal memuat data dari server.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openIssue = (item: LetterRow) => {
    setIssuing(item);
    setLetterBodyDraft(item.letterBody ?? '');
  };

  const confirmIssue = async () => {
    if (!issuing) return;
    setActionId(issuing.id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/letters/${issuing.id}/issue`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ letterBody: letterBodyDraft || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast(json?.message || 'Surat berhasil diterbitkan.');
      setIssuing(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menerbitkan surat.');
    } finally {
      setActionId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast('Alasan penolakan wajib diisi.');
      return;
    }
    setActionId(rejectTarget.id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/letters/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast('Permohonan surat ditolak.');
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menolak permohonan.');
    } finally {
      setActionId(null);
    }
  };

  const cards = useMemo(
    () => [
      { label: 'Total Permohonan', val: summary.total, cls: 'bg-blue-50 text-[#1E3A8A]' },
      { label: 'Menunggu Dosen PA', val: summary.menungguPa, cls: 'bg-amber-50 text-amber-700' },
      { label: 'Diproses BAAK', val: summary.diprosesBaak, cls: 'bg-indigo-50 text-indigo-700' },
      { label: 'Selesai Terbit', val: summary.selesai, cls: 'bg-emerald-50 text-emerald-700' },
    ],
    [summary],
  );

  return (
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <Mail className="w-3.5 h-3.5" />
              Layanan Surat Mahasiswa
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Pemrosesan Surat Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Terbitkan nomor surat resmi untuk permohonan yang sudah disetujui Dosen PA, atau tolak bila tidak memenuhi syarat.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-2xl p-4 border border-slate-200 shadow-sm ${c.cls}`}>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-2xl font-black">{c.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIM, nomor surat, atau instansi..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="MENUNGGU_PA">Menunggu Dosen PA</option>
              <option value="DIPROSES_BAAK">Diproses BAAK</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">No. Tiket / Surat</th>
                  <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                  <th className="px-4 py-3 text-left font-semibold">Jenis Surat</th>
                  <th className="px-4 py-3 text-left font-semibold">Tujuan</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && letters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Belum ada permohonan surat yang cocok dengan filter.
                    </td>
                  </tr>
                )}
                {letters.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-800 block">{item.letterNo || item.requestNo}</span>
                      <span className="text-[11px] text-slate-400">{formatTanggal(item.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{item.student.user.fullName}</span>
                      <span className="text-[11px] font-mono text-slate-500">{item.student.nim}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.typeName}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{item.targetInstitution}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status === 'DIPROSES_BAAK' && (
                          <>
                            <button
                              onClick={() => openIssue(item)}
                              disabled={actionId === item.id}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Terbitkan
                            </button>
                            <button
                              onClick={() => setRejectTarget(item)}
                              disabled={actionId === item.id}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </>
                        )}
                        {item.status === 'MENUNGGU_PA' && (
                          <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Menunggu Dosen PA
                          </span>
                        )}
                        {(item.status === 'SELESAI' || item.status === 'DITOLAK') && (
                          <button
                            onClick={() => setPreviewLetter(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {toast}
          </div>
        )}
      </div>

      {/* Modal terbitkan surat */}
      {issuing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Terbitkan Surat Resmi</h4>
                  <p className="text-[11px] text-slate-500">{issuing.typeName} &bull; {issuing.student.user.fullName}</p>
                </div>
              </div>
              <button onClick={() => setIssuing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs overflow-y-auto">
              <p className="text-slate-600">
                Nomor surat resmi akan dibuat otomatis saat diterbitkan. Anda dapat menyunting isi surat di bawah sebelum disahkan.
              </p>
              <label className="block font-bold text-slate-700 mb-1">Isi Surat</label>
              <textarea
                rows={8}
                value={letterBodyDraft}
                onChange={(e) => setLetterBodyDraft(e.target.value)}
                placeholder="Kosongkan untuk memakai isi surat baku yang dibuat otomatis dari data mahasiswa."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-hidden"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setIssuing(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button onClick={confirmIssue} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Sahkan & Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tolak */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Tolak Permohonan Surat</h4>
              <button onClick={() => setRejectTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Menolak <strong>{rejectTarget.typeName}</strong> dari <strong>{rejectTarget.student.user.fullName}</strong>.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-hidden"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button onClick={confirmReject} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer">
                Tolak Permohonan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detail */}
      {previewLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {previewLetter.status === 'SELESAI' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h4 className="font-bold text-slate-900 text-sm">{previewLetter.typeName}</h4>
              </div>
              <button onClick={() => setPreviewLetter(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Mahasiswa: <strong>{previewLetter.student.user.fullName}</strong></div>
                <div>NIM: <strong className="font-mono">{previewLetter.student.nim}</strong></div>
                <div>Nomor: <strong className="font-mono">{previewLetter.letterNo || previewLetter.requestNo}</strong></div>
                <div>Tujuan: <strong>{previewLetter.targetInstitution}</strong></div>
              </div>
              {previewLetter.status === 'DITOLAK' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <p className="font-bold">Ditolak oleh {previewLetter.rejectedBy === 'ADVISOR' ? 'Dosen PA' : 'BAAK'}</p>
                  <p className="mt-1">{previewLetter.rejectionReason}</p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-line text-slate-700">
                  {previewLetter.letterBody}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setPreviewLetter(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
