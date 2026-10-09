'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { Mail, Check, X, Clock, RefreshCw, ShieldCheck, User } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (user?.lecturerId) headers['x-lecturer-id'] = user.lecturerId;
  return headers;
}

interface LetterQueueItem {
  id: string;
  requestNo: string;
  typeName: string;
  purpose: string;
  targetInstitution: string;
  studentNote: string | null;
  createdAt: string;
  student: {
    nim: string;
    user: { fullName: string };
    studyProgram: { name: string } | null;
  };
}

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function LecturerSuratPage() {
  const [queue, setQueue] = useState<LetterQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LetterQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/letters/advisor/queue`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setQueue(json.data ?? []);
    } catch (err) {
      console.error('Gagal memuat antrean surat bimbingan:', err);
      showToast('Gagal memuat antrean surat dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (item: LetterQueueItem) => {
    setActionId(item.id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/letters/${item.id}/advisor-approve`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast(`Permohonan ${item.student.user.fullName} disetujui dan diteruskan ke BAAK.`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyetujui permohonan.');
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast('Alasan penolakan wajib diisi.');
      return;
    }
    setActionId(rejectTarget.id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/letters/${rejectTarget.id}/advisor-reject`, {
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

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <Mail className="w-3.5 h-3.5" />
              Verifikasi Surat Bimbingan
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Persetujuan Surat Mahasiswa Bimbingan</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Periksa dan setujui permohonan surat dari mahasiswa yang Anda bimbing sebelum diteruskan ke BAAK.
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Menunggu Verifikasi Anda ({queue.length})</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Memeriksa antrean verifikasi surat...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Tidak ada surat yang menunggu verifikasi.</p>
                <p className="text-xs text-slate-400 mt-1">Permohonan surat baru dari mahasiswa bimbingan Anda akan muncul di sini.</p>
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                        MENUNGGU VERIFIKASI
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">{item.requestNo}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.student.user.fullName} <span className="font-mono text-slate-500 font-normal">({item.student.nim})</span>
                    </p>
                    <p className="text-xs text-slate-500">{item.student.studyProgram?.name ?? '-'}</p>
                    <p className="text-sm font-black text-[#1E3A8A] mt-1">{item.typeName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Keperluan: {item.purpose} &bull; Tujuan: {item.targetInstitution}
                    </p>
                    {item.studentNote && <p className="text-xs text-slate-400 italic mt-0.5">Catatan: {item.studentNote}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">Diajukan: {formatTanggal(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setRejectTarget(item)}
                      disabled={actionId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                    <button
                      onClick={() => approve(item)}
                      disabled={actionId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Setujui
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {toast}
          </div>
        )}
      </div>

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
                Menolak permohonan <strong>{rejectTarget.typeName}</strong> dari <strong>{rejectTarget.student.user.fullName}</strong>.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan agar mahasiswa dapat memperbaiki permohonannya..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-hidden"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button onClick={reject} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer">
                Tolak Permohonan
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
