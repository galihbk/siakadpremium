'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Award,
  Search,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AdmissionApplicantItem } from '@siakad/types';

export default function SeleksiPage() {
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScoreState, setFilterScoreState] = useState<'ALL' | 'GRADED' | 'UNGRADED' | 'PASS' | 'FAIL'>('ALL');
  const passingGrade = 65.0;

  // Modal Input Nilai
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [targetApplicant, setTargetApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [inputScore, setInputScore] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = getApiBaseUrl();

  const fetchApplicants = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants?limit=100`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
          ? json.data.data
          : [];
        setApplicants(list);
      } else {
        throw new Error('Gagal memuat data seleksi CBT.');
      }
    } catch (err: any) {
      console.error('Error fetching CBT applicants:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  // Stats calculation
  const gradedApplicants = useMemo(
    () => applicants.filter((a) => a.testScore !== undefined && a.testScore !== null),
    [applicants],
  );

  const avgScore = useMemo(() => {
    if (gradedApplicants.length === 0) return 0;
    const sum = gradedApplicants.reduce((acc, curr) => acc + (curr.testScore || 0), 0);
    return Math.round((sum / gradedApplicants.length) * 10) / 10;
  }, [gradedApplicants]);

  const maxScore = useMemo(() => {
    if (gradedApplicants.length === 0) return 0;
    return Math.max(...gradedApplicants.map((a) => a.testScore || 0));
  }, [gradedApplicants]);

  const passCount = useMemo(
    () => gradedApplicants.filter((a) => (a.testScore || 0) >= passingGrade).length,
    [gradedApplicants, passingGrade],
  );

  const unGradedCount = useMemo(
    () => applicants.length - gradedApplicants.length,
    [applicants, gradedApplicants],
  );

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.chosenStudyProgram.toLowerCase().includes(searchQuery.toLowerCase());

      const score = item.testScore;
      const isGraded = score !== undefined && score !== null;

      let matchFilter = true;
      if (filterScoreState === 'GRADED') matchFilter = isGraded;
      else if (filterScoreState === 'UNGRADED') matchFilter = !isGraded;
      else if (filterScoreState === 'PASS') matchFilter = isGraded && (score || 0) >= passingGrade;
      else if (filterScoreState === 'FAIL') matchFilter = isGraded && (score || 0) < passingGrade;

      return matchSearch && matchFilter;
    });
  }, [applicants, searchQuery, filterScoreState, passingGrade]);

  const handleOpenScoreModal = (applicant: AdmissionApplicantItem) => {
    setTargetApplicant(applicant);
    setInputScore(applicant.testScore !== undefined && applicant.testScore !== null ? String(applicant.testScore) : '');
    setInputNotes(applicant.notes || '');
    setScoreModalOpen(true);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApplicant) return;

    setIsSubmitting(true);
    try {
      const parsed = parseFloat(inputScore);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        alert('Skor harus berupa angka antara 0 hingga 100.');
        setIsSubmitting(false);
        return;
      }

      // If score >= passingGrade, we can suggest ACCEPTED if verified
      const payload: any = {
        testScore: parsed,
        notes: inputNotes.trim() || undefined,
      };

      const res = await fetch(`${apiBase}/admissions/applicants/${targetApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal menyimpan skor ujian CBT.');
      }

      setScoreModalOpen(false);
      setTargetApplicant(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan nilai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/seleksi"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ujian &amp; Seleksi CBT (Computer Based Test)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pengelolaan hasil skor tes potensi akademik, literasi bahasa, dan penentuan passing grade seleksi PMB ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchApplicants}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Rekap Nilai</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={fetchApplicants} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
            <span className="text-xs font-bold text-slate-500">Rata-rata Skor CBT</span>
            <p className="text-2xl font-black text-blue-900 mt-2">{avgScore}</p>
            <span className="text-[11px] text-slate-400">Dari {gradedApplicants.length} peserta berstatus dinilai</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
            <span className="text-xs font-bold text-slate-500">Skor Tertinggi</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">{maxScore}</p>
            <span className="text-[11px] text-slate-400">Peringkat 1 seleksi mandiri</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
            <span className="text-xs font-bold text-slate-500">Memenuhi Passing Grade</span>
            <p className="text-2xl font-black text-emerald-700 mt-2">{passCount} Peserta</p>
            <span className="text-[11px] text-slate-400">Nilai ≥ {passingGrade}</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle">
            <span className="text-xs font-bold text-slate-500">Belum Ada Nilai</span>
            <p className="text-2xl font-black text-amber-600 mt-2">{unGradedCount} Peserta</p>
            <span className="text-[11px] text-slate-400">Menunggu jadwal / pelaksanaan ujian</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama peserta, nomor registrasi, prodi pilihan..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setFilterScoreState('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterScoreState === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({applicants.length})
              </button>
              <button
                onClick={() => setFilterScoreState('PASS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterScoreState === 'PASS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lolos PG ({passCount})
              </button>
              <button
                onClick={() => setFilterScoreState('FAIL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterScoreState === 'FAIL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Di Bawah PG ({gradedApplicants.length - passCount})
              </button>
              <button
                onClick={() => setFilterScoreState('UNGRADED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterScoreState === 'UNGRADED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Ujian ({unGradedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Daftar Peserta Seleksi ({filteredApplicants.length} peserta)
            </span>
            <span className="text-[11px] text-slate-500">
              Passing Grade Kelulusan: <strong>{passingGrade}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Peserta</th>
                  <th className="py-3 px-4">Program Studi</th>
                  <th className="py-3 px-4">Jalur Seleksi</th>
                  <th className="py-3 px-4 text-center">Skor Ujian CBT</th>
                  <th className="py-3 px-4 text-center">Kualifikasi PG</th>
                  <th className="py-3 px-4 text-right">Aksi Input</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data seleksi CBT...</span>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Tidak ada peserta pada kriteria ini.</p>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((item) => {
                    const hasScore = item.testScore !== undefined && item.testScore !== null;
                    const isPass = hasScore && (item.testScore || 0) >= passingGrade;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {item.registrationNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>{item.fullName}</div>
                          <div className="text-[11px] text-slate-400">{item.highSchool || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {item.chosenStudyProgram}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.jalurPendaftaran}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {hasScore ? (
                            <span className="text-base font-black text-slate-900">{item.testScore}</span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">Belum Dinilai</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {hasScore ? (
                            isPass ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Lolos PG
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Di Bawah PG
                              </span>
                            )
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">
                              Belum Tes
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenScoreModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{hasScore ? 'Ubah Nilai' : 'Input Nilai'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Input Nilai CBT */}
        {scoreModalOpen && targetApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Input / Perbarui Skor CBT</h3>
                <button
                  onClick={() => setScoreModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveScore} className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{targetApplicant.fullName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{targetApplicant.registrationNumber}</p>
                  <p className="text-slate-600 font-medium">{targetApplicant.chosenStudyProgram}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skor Ujian CBT (Skala 0 - 100) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={inputScore}
                    onChange={(e) => setInputScore(e.target.value)}
                    placeholder="Contoh: 85.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Passing Grade kelulusan ITN adalah {passingGrade}. Nilai di atas {passingGrade} otomatis terkualifikasi.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Pengawas / Ujian</label>
                  <textarea
                    rows={2}
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder="Contoh: Peserta menyelesaikan seluruh 100 soal tanpa kendala teknis."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setScoreModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172554] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Skor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
