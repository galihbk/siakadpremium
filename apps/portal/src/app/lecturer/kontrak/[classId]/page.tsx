'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { ArrowLeft, FileSignature, RefreshCw, Save, Check, X } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if ((user as any)?.lecturerId) headers['x-lecturer-id'] = (user as any).lecturerId;
  return headers;
}

export default function LecturerContractPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const apiBase = getApiBaseUrl();

  const [courseName, setCourseName] = useState('');
  const [className, setClassName] = useState('');
  const [weights, setWeights] = useState({ tugas: 20, uts: 30, uas: 35, kehadiran: 15 });
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadContract = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/contract`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setCourseName(data.courseName || '');
        setClassName(data.className || '');
        const c = data.contract;
        if (c) {
          if (c.assessmentWeights) setWeights({ tugas: 20, uts: 30, uas: 35, kehadiran: 15, ...c.assessmentWeights });
          setIsPublished(Boolean(c.isPublished));
        } else {
          setWeights({ tugas: 20, uts: 30, uas: 35, kehadiran: 15 });
          setIsPublished(false);
        }
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || 'Gagal memuat kontrak kuliah.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const totalWeight = weights.tugas + weights.uts + weights.uas + weights.kehadiran;

  const handleSave = async () => {
    if (totalWeight !== 100) {
      showToast(`Total bobot penilaian harus 100% (sekarang ${totalWeight}%).`, 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/contract`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          assessmentWeights: weights,
          isPublished,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.data?.message || json?.message || 'Kontrak kuliah berhasil disimpan.');
      } else {
        showToast(json?.message || 'Gagal menyimpan kontrak kuliah.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        <button
          onClick={() => router.push('/lecturer/kontrak')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Kelas
        </button>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSignature className="w-6 h-6" />
            {courseName || 'Kontrak Kuliah'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">{className}</p>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] mb-2" />
            <p className="text-sm">Memuat kontrak kuliah...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Bobot Penilaian</h4>
                <span className={`text-xs font-bold ${totalWeight === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Total: {totalWeight}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['tugas', 'uts', 'uas', 'kehadiran'] as const).map((key) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-600 block mb-1 capitalize">{key}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={weights[key]}
                        onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 pr-6"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Publikasikan kontrak kuliah ini (mahasiswa dapat melihatnya)
                </span>
              </label>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Kontrak Kuliah
              </button>
            </div>
          </>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
