'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import Link from 'next/link';
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
  CreditCard,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';

interface MataKuliah {
  id: string;
  courseId: string;
  kode: string;
  nama: string;
  className: string;
  sks: number;
  semester: number;
  dosen: string;
  hari: string;
  jam: string;
  ruang: string;
  quota: number;
  enrolledCount: number;
  isFull: boolean;
  status?: 'BELUM_BAYAR' | 'MENUNGGU' | 'DISETUJUI';
}

interface Tagihan {
  invoiceNo: string;
  amount: number;
  status: string;
  dueDate: string;
}

const HARI_ORDER: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (user?.id) headers['x-user-id'] = user.id;
  return headers;
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function StudentKRSPage() {
  const [userName, setUserName] = useState('Mahasiswa');
  const [userId, setUserId] = useState('');
  const [courses, setCourses] = useState<MataKuliah[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<Tagihan | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [krsPeriodOpen, setKrsPeriodOpen] = useState(true);

  // Terkunci (tidak bisa diedit lagi) kalau KRS sudah resmi diajukan ke PA (SUBMITTED) atau disetujui (APPROVED).
  // Selama masih DRAFT (belum bayar UKT), pilihan matkul masih bebas diubah.
  const isLocked = courses.some((m) => m.status === 'MENUNGGU' || m.status === 'DISETUJUI');
  const hasDraftInvoice = invoice && invoice.status !== 'LUNAS';

  const applyKrsData = (data: any[]) => {
    const mapped: MataKuliah[] = data.map((c: any) => ({
      id: c.id,
      courseId: c.courseId || c.id,
      kode: c.code,
      nama: c.name,
      className: c.className || 'Kelas A',
      sks: c.sks || 3,
      semester: c.semester || 1,
      dosen: c.dosen || 'Tim Dosen Pengampu',
      hari: c.hari || '-',
      jam: c.jam || '-',
      ruang: c.ruang || '-',
      quota: c.quota ?? 40,
      enrolledCount: c.enrolledCount ?? 0,
      isFull: Boolean(c.isFull),
      status: c.status === 'APPROVED' ? 'DISETUJUI' : c.status === 'SUBMITTED' ? 'MENUNGGU' : c.status === 'DRAFT' ? 'BELUM_BAYAR' : undefined,
    }));
    setCourses(mapped);
    const alreadyTaken = mapped.filter((m) => m.status).map((m) => m.id);
    setSelectedIds(alreadyTaken);
  };

  const loadInvoice = async (nim: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/invoices/student/${nim}`);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        const krsInvoice = list.find((t: any) => (t.paymentType || '').startsWith('UKT / SPP Semester'));
        setInvoice(
          krsInvoice
            ? { invoiceNo: krsInvoice.invoiceNo, amount: Number(krsInvoice.amount), status: krsInvoice.status, dueDate: krsInvoice.dueDate }
            : null,
        );
      }
    } catch {
      // biarkan invoice tetap null kalau gagal
    }
  };

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) {
      setUserName(user.fullName || user.email);
      setUserId(user.email);
    }

    async function loadKrs() {
      setLoading(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/students/krs`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            applyKrsData(json.data);
          }
        }
        const nim = user?.nim || (user as any)?.student?.nim;
        if (nim) await loadInvoice(nim);
      } catch (err) {
        console.warn('Gagal memuat KRS dari database:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadCurrentSemester() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/me`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          const data = json?.data || json;
          const currentSemester = data?.student?.currentSemester;
          if (currentSemester) {
            setExpandedSemesters(new Set([currentSemester]));
          }
        }
      } catch {
        // biarkan default (semua tertutup, di-fallback saat data matkul dimuat)
      } finally {
        setHasAutoExpanded(true);
      }
    }

    async function loadKrsStatus() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/academic/krs-status`);
        if (res.ok) {
          const json = await res.json();
          setKrsPeriodOpen(json?.isKrsOpen !== false);
        }
      } catch {
        // gagal cek status -- biarkan default terbuka, backend tetap validasi saat submit
      }
    }

    loadKrs();
    loadCurrentSemester();
    loadKrsStatus();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const totalSKS = courses.filter((m) => selectedIds.includes(m.id)).reduce((a, m) => a + m.sks, 0);
  const maxSKS = 24;

  // Satu mata kuliah cuma boleh satu kelas terpilih (radio per courseId) --
  // pilih kelas lain di matkul yang sama otomatis mengganti pilihan sebelumnya.
  const toggle = (id: string) => {
    if (isLocked) return;
    const mk = courses.find((m) => m.id === id);
    if (!mk) return;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (mk.isFull) {
      showToast(`Kelas ${mk.className} untuk ${mk.nama} sudah penuh (${mk.enrolledCount}/${mk.quota}). Pilih kelas lain.`, 'error');
      return;
    }
    const otherClassOfSameCourse = courses.find(
      (m) => m.courseId === mk.courseId && selectedIds.includes(m.id),
    );
    const totalWithoutSwapped = otherClassOfSameCourse
      ? totalSKS - otherClassOfSameCourse.sks
      : totalSKS;
    const newTotal = totalWithoutSwapped + mk.sks;
    if (newTotal > maxSKS) {
      showToast(`Tidak dapat menambah. Batas maksimal ${maxSKS} SKS.`, 'error');
      return;
    }
    setSelectedIds((prev) => [...prev.filter((x) => x !== otherClassOfSameCourse?.id), id]);
  };

  const handleSubmit = async () => {
    if (!krsPeriodOpen) {
      showToast('Periode pengisian KRS sedang ditutup oleh BAAK', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('Pilih minimal 1 mata kuliah terlebih dahulu', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/krs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ courseIds: selectedIds }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.data?.courses)) {
        applyKrsData(json.data.courses);
        if (json.data.invoice) {
          setInvoice({
            invoiceNo: json.data.invoice.invoiceNo,
            amount: Number(json.data.invoice.amount),
            status: json.data.invoice.status,
            dueDate: json.data.invoice.dueDate,
          });
        }
        showToast('Tagihan KRS berhasil dihitung & disimpan. Silakan lanjut ke pembayaran UKT.');
      } else {
        showToast(json?.message || 'Gagal menyimpan pilihan KRS. Silakan coba lagi.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server. Silakan coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selected = courses
    .filter((m) => selectedIds.includes(m.id))
    .sort((a, b) => HARI_ORDER[a.hari] - (HARI_ORDER[b.hari] || 9));

  // Kelompokkan per semester supaya mahasiswa semester atas yang mau mengulang
  // matkul semester bawah tetap bisa menemukannya
  const coursesBySemester = courses.reduce((acc: Record<number, MataKuliah[]>, mk) => {
    (acc[mk.semester] = acc[mk.semester] || []).push(mk);
    return acc;
  }, {});
  const semesterKeys = Object.keys(coursesBySemester)
    .map(Number)
    .sort((a, b) => a - b);

  // Kelompokkan tiap semester lagi per mata kuliah, supaya kelas paralel (Kelas A/B/C)
  // ditampilkan sebagai pilihan di dalam satu card, bukan card terpisah -- daftarnya
  // bisa panjang sekali kalau tiap kelas jadi card sendiri.
  const groupByCourse = (list: MataKuliah[]) => {
    const map = new Map<string, { courseId: string; kode: string; nama: string; sks: number; classes: MataKuliah[] }>();
    for (const mk of list) {
      const entry = map.get(mk.courseId) || { courseId: mk.courseId, kode: mk.kode, nama: mk.nama, sks: mk.sks, classes: [] };
      entry.classes.push(mk);
      map.set(mk.courseId, entry);
    }
    return Array.from(map.values());
  };

  // Fallback: kalau semester aktif mahasiswa tidak diketahui/tidak ada di daftar,
  // buka semester pertama saja secara default
  useEffect(() => {
    if (!hasAutoExpanded || loading || semesterKeys.length === 0) return;
    setExpandedSemesters((prev) => {
      if (prev.size > 0) return prev;
      return new Set([semesterKeys[0]]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAutoExpanded, loading, semesterKeys.join(',')]);

  const toggleSemester = (semNum: number) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(semNum)) next.delete(semNum);
      else next.add(semNum);
      return next;
    });
  };

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
              <h2 className="text-sm font-bold text-slate-700">Daftar Mata Kuliah Tersedia</h2>
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyinkronkan...</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Memuat kurikulum &amp; kelas perkuliahan aktif...</p>
              </div>
            ) : (
              semesterKeys.map((semNum) => {
                const isExpanded = expandedSemesters.has(semNum);
                const selectedInSem = coursesBySemester[semNum].filter((m) => selectedIds.includes(m.id)).length;
                return (
                <div key={semNum} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleSemester(semNum)}
                    className="w-full flex items-center gap-2 pt-1 text-left"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    <span className="text-xs font-bold text-white bg-[#1E3A8A] px-2.5 py-1 rounded-lg">
                      Semester {semNum}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {coursesBySemester[semNum].length} mata kuliah
                      {selectedInSem > 0 ? ` • ${selectedInSem} dipilih` : ''}
                    </span>
                    <div className="flex-1 border-t border-dashed border-slate-200" />
                  </button>

                  {isExpanded && groupByCourse(coursesBySemester[semNum]).map((grp) => {
                    const selectedClass = grp.classes.find((c) => selectedIds.includes(c.id));
                    return (
                      <div key={grp.courseId} className="bg-white rounded-xl border-2 border-slate-200 p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-500">{grp.kode}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              grp.sks === 2 ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {grp.sks} SKS
                          </span>
                          {selectedClass?.status === 'BELUM_BAYAR' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                              Menunggu Pembayaran UKT
                            </span>
                          ) : selectedClass?.status === 'MENUNGGU' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                              Menunggu Persetujuan PA
                            </span>
                          ) : selectedClass?.status === 'DISETUJUI' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                              Disetujui PA
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-bold text-slate-800 mt-1">{grp.nama}</p>

                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {grp.classes.map((mk) => {
                            const isSelected = selectedIds.includes(mk.id);
                            const isDisabled = (mk.isFull && !isSelected) || (isLocked && !isSelected);
                            return (
                              <button
                                key={mk.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => toggle(mk.id)}
                                className={`text-left rounded-lg border-2 px-3 py-2 transition-all min-w-[160px] ${
                                  isDisabled
                                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-50/40'
                                    : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                                } ${isLocked && !isSelected ? 'cursor-default' : ''}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">{mk.className}</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${
                                      mk.isFull ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {mk.isFull ? 'Penuh' : `${mk.enrolledCount}/${mk.quota}`}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{mk.dosen}</p>
                                {mk.hari !== '-' && (
                                  <p className="text-[11px] text-slate-400">{mk.hari} · {mk.jam}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
                        {!isLocked && (
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

            {!krsPeriodOpen && !isLocked && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center mb-3">
                <p className="text-sm font-bold text-rose-800">Periode KRS Sedang Ditutup</p>
                <p className="text-xs text-rose-600 mt-1">
                  Pengajuan/perubahan KRS belum bisa dilakukan. Silakan hubungi BAAK untuk informasi jadwal.
                </p>
              </div>
            )}

            {isLocked ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-800">KRS Telah Diajukan</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {courses.some((m) => m.status === 'DISETUJUI')
                    ? 'Disetujui Dosen Pembimbing Akademik'
                    : 'Menunggu persetujuan Dosen Pembimbing Akademik'}
                </p>
              </div>
            ) : hasDraftInvoice ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <CreditCard className="w-4 h-4" />
                  <p className="text-sm font-bold">Tagihan UKT Semester Ini</p>
                </div>
                <p className="text-xl font-black text-amber-900">{formatRupiah(invoice!.amount)}</p>
                <p className="text-xs text-amber-700">
                  {invoice!.status === 'MENUNGGU_VERIFIKASI'
                    ? 'Bukti transfer sudah dikirim, menunggu verifikasi Biro Keuangan.'
                    : 'Bayar tagihan ini dulu sebelum KRS bisa diajukan ke Dosen PA.'}
                </p>
                {invoice!.status !== 'MENUNGGU_VERIFIKASI' && (
                  <Link
                    href="/student/keuangan"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Bayar Sekarang
                  </Link>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedIds.length === 0 || !krsPeriodOpen}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-amber-300 text-amber-800 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Perbarui Tagihan (Pilihan Berubah)
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedIds.length === 0 || !krsPeriodOpen}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1E3A8A] text-white text-sm font-bold rounded-2xl hover:bg-[#1e40af] transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Menghitung Tagihan...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Hitung &amp; Simpan Tagihan KRS
                  </>
                )}
              </button>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600">
                Pilih mata kuliah lalu hitung tagihan UKT (SPP + biaya per SKS). Setelah tagihan <strong>lunas &amp; diverifikasi Biro Keuangan</strong>, KRS otomatis diajukan resmi ke Dosen PA.
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
