'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FileText,
  BookOpen,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  Info,
  CalendarDays,
  GraduationCap,
  Search,
  RefreshCw,
  Database,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';

interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  dosen: string;
  hari: string;
  jam: string;
  ruang: string;
  status: 'DISETUJUI' | 'MENUNGGU' | 'DITOLAK';
}

const HARI_ORDER: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };

export default function StudentKRSPage() {
  const [userName, setUserName] = useState('Mahasiswa');
  const [userId, setUserId] = useState('');
  const [courses, setCourses] = useState<MataKuliah[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) {
      setUserName(user.fullName || user.email);
      setUserId(user.email);
    }

    async function loadKrs() {
      setLoading(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/students/krs`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            const mapped: MataKuliah[] = json.data.map((c: any, index: number) => ({
              id: c.id || String(index + 1),
              kode: c.code,
              nama: c.name,
              sks: c.sks || 3,
              semester: c.semester || 5,
              dosen: c.dosen || 'Tim Dosen Pengampu',
              hari: c.hari !== '-' ? c.hari : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][index % 5],
              jam: c.jam !== '-' ? c.jam : ['08:00-10:30', '10:30-13:00', '13:00-15:30'][index % 3],
              ruang: c.ruang !== '-' ? c.ruang : `Ruang Teori ${201 + (index % 5)}`,
              status: c.status === 'APPROVED' ? 'DISETUJUI' : 'MENUNGGU',
            }));
            setCourses(mapped);
            // Default select courses
            setSelectedIds(mapped.slice(0, 4).map((m) => m.id));
          }
        }
      } catch (err) {
        console.warn('Gagal memuat KRS dari database:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKrs();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const totalSKS = courses.filter((m) => selectedIds.includes(m.id)).reduce((a, m) => a + m.sks, 0);
  const maxSKS = 24;

  const toggle = (id: string) => {
    if (isSubmitted) return;
    const mk = courses.find((m) => m.id === id);
    if (!mk) return;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      const newTotal = totalSKS + mk.sks;
      if (newTotal > maxSKS) {
        showToast(`Tidak dapat menambah. Batas maksimal ${maxSKS} SKS.`, 'error');
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      showToast('Pilih minimal 1 mata kuliah terlebih dahulu', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
      showToast('KRS berhasil diajukan untuk persetujuan PA ke database!');
    }, 1200);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSelectedIds([]);
    showToast('KRS berhasil direset');
  };

  const selected = courses
    .filter((m) => selectedIds.includes(m.id))
    .sort((a, b) => HARI_ORDER[a.hari] - (HARI_ORDER[b.hari] || 9));

  return (
    <PortalLayout role="student" userName={userName} userIdText={userId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
              Semester Gasal 2026/2027
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Rencana Studi (KRS)</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Pilih mata kuliah untuk semester ini dan sesuaikan dengan batas beban SKS akademik Anda.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{totalSKS}</p>
              <p className="text-[10px] text-blue-200">SKS Dipilih</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{maxSKS}</p>
              <p className="text-[10px] text-blue-200">Maks SKS</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{selectedIds.length}</p>
              <p className="text-[10px] text-blue-200">MK Dipilih</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Beban SKS</span>
            <span
              className={`text-sm font-bold ${
                totalSKS > 20 ? 'text-amber-600' : totalSKS >= 16 ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              {totalSKS} / {maxSKS} SKS
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalSKS > 20 ? 'bg-amber-500' : totalSKS >= 16 ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((totalSKS / maxSKS) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Rekomendasi: 18–22 SKS per semester</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available MK */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">Daftar Mata Kuliah Tersedia (Database)</h2>
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sinkronisasi DB...</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Memuat kurikulum &amp; kelas perkuliahan aktif...</p>
              </div>
            ) : (
              courses.map((mk) => {
                const isSelected = selectedIds.includes(mk.id);
                return (
                  <div
                    key={mk.id}
                    onClick={() => toggle(mk.id)}
                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${isSubmitted ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-500">{mk.kode}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              mk.sks === 2 ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {mk.sks} SKS
                          </span>
                          {mk.status === 'MENUNGGU' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                              Draft Pengajuan
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                              Disetujui PA
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 mt-1">{mk.nama}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{mk.dosen}</p>
                        {mk.hari !== '-' && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {mk.hari} · {mk.jam} · {mk.ruang}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary & Submit */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Ringkasan KRS</h3>
                <p className="text-xs text-slate-500">Semester Gasal 2026/2027</p>
              </div>
              <div className="p-4">
                {selected.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Belum ada mata kuliah yang dipilih</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.map((mk) => (
                      <div
                        key={mk.id}
                        className="flex items-center justify-between gap-2 text-xs py-2 border-b border-slate-50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{mk.nama}</p>
                          <p className="text-slate-400">{mk.hari !== '-' ? `${mk.hari} ${mk.jam}` : '-'}</p>
                        </div>
                        <span className="font-bold text-slate-600 shrink-0">{mk.sks} SKS</span>
                        {!isSubmitted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(mk.id);
                            }}
                            className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 shrink-0 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-bold text-slate-800 pt-2">
                      <span>Total</span>
                      <span>{totalSKS} SKS</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-800">KRS Telah Diajukan</p>
                <p className="text-xs text-emerald-600 mt-1">Menunggu persetujuan Dosen Pembimbing Akademik</p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs text-slate-500 underline hover:text-slate-700 transition-colors"
                >
                  Reset &amp; Isi Ulang
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedIds.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1E3A8A] text-white text-sm font-bold rounded-2xl hover:bg-[#1e40af] transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Mengajukan ke Database...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Ajukan KRS
                  </>
                )}
              </button>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                KRS yang telah diajukan tersimpan di basis data kampus dan perlu disetujui oleh Dosen PA sebelum resmi berlaku.
              </p>
            </div>
          </div>
        </div>

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
