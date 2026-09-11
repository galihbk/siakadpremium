'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  GraduationCap,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
  Award,
  AlertCircle,
  Printer,
  X,
  FileCheck,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AdmissionApplicantItem } from '@siakad/types';

export default function KelulusanPage() {
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'REGISTERED' | 'FAILED' | 'VERIFIED'>('ALL');

  // Action Modals
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SK Modal
  const [skModalOpen, setSkModalOpen] = useState(false);
  const [skApplicant, setSkApplicant] = useState<AdmissionApplicantItem | null>(null);

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
        throw new Error('Gagal memuat data kelulusan & registrasi.');
      }
    } catch (err: any) {
      console.error('Error fetching kelulusan:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  // Stats
  const acceptedCount = useMemo(() => applicants.filter((a) => a.status === 'PASSED').length, [applicants]);
  const registeredCount = useMemo(() => applicants.filter((a) => a.status === 'REGISTERED').length, [applicants]);
  const rejectedCount = useMemo(() => applicants.filter((a) => a.status === 'FAILED').length, [applicants]);
  const waitingDecisionCount = useMemo(() => applicants.filter((a) => a.status === 'VERIFIED').length, [applicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.chosenStudyProgram.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  // Open Decision Modal
  const handleOpenDecisionModal = (applicant: AdmissionApplicantItem, type: 'PASSED' | 'FAILED') => {
    setSelectedApplicant(applicant);
    setDecisionType(type);
    setDecisionNotes(
      type === 'PASSED'
        ? `Dinyatakan DITERIMA sebagai calon mahasiswa baru Program Studi ${applicant.chosenStudyProgram}.`
        : 'Nilai ujian CBT atau berkas belum memenuhi kuota program studi yang dipilih.',
    );
    setDecisionModalOpen(true);
  };

  // Submit Decision
  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setIsSubmitting(true);
    try {
      const payload = {
        status: decisionType,
        notes: decisionNotes.trim(),
      };

      const res = await fetch(`${apiBase}/admissions/applicants/${selectedApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal menyimpan keputusan seleksi.');
      }

      setDecisionModalOpen(false);
      setSelectedApplicant(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert to Active Student (Issuance of NIM)
  const handleConvertToStudent = async (applicant: AdmissionApplicantItem) => {
    if (
      !window.confirm(
        `Terbitkan Nomor Induk Mahasiswa (NIM) resmi untuk "${applicant.fullName}"?\n\nTindakan ini akan membuat akun mahasiswa aktif di sistem akademik.`,
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${applicant.id}/convert-to-student`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal menerbitkan NIM mahasiswa.');
      }

      const json = await res.json();
      alert(`Selamat! Registrasi ulang berhasil.\nNIM Baru: ${json.data?.student?.nim || 'Berhasil diterbitkan'}\nStatus: Mahasiswa Aktif.`);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses registrasi ulang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Diterima (Lolos)</span>;
      case 'REGISTERED':
        return <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><UserCheck className="w-3 h-3" /> Registrasi Selesai (NIM Terbit)</span>;
      case 'FAILED':
        return <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Tidak Lolos</span>;
      case 'VERIFIED':
        return <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-semibold">Siap Penetapan</span>;
      default:
        return <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-semibold">Menunggu Verifikasi</span>;
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/kelulusan"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kelulusan &amp; Registrasi Ulang Mahasiswa Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Penetapan status kelulusan pendaftar, penerbitan Nomor Induk Mahasiswa (NIM), dan cetak SK penerimaan.
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
              <span className="hidden sm:inline">Cetak Rekap</span>
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

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setStatusFilter('PASSED')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'PASSED'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Dinyatakan Diterima</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">{acceptedCount}</p>
            <span className="text-[11px] text-slate-500">Lolos seleksi penerimaan</span>
          </div>

          <div
            onClick={() => setStatusFilter('REGISTERED')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'REGISTERED'
                ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Registrasi Ulang (NIM)</span>
              <UserCheck className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700 mt-2">{registeredCount}</p>
            <span className="text-[11px] text-slate-500">Siap menjadi mahasiswa aktif</span>
          </div>

          <div
            onClick={() => setStatusFilter('VERIFIED')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'VERIFIED'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Siap Penetapan</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-2">{waitingDecisionCount}</p>
            <span className="text-[11px] text-slate-500">Berkas valid, tunggu sidang</span>
          </div>

          <div
            onClick={() => setStatusFilter('FAILED')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'FAILED'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Tidak Lolos Seleksi</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700 mt-2">{rejectedCount}</p>
            <span className="text-[11px] text-slate-500">Belum memenuhi kuota</span>
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
                placeholder="Cari nama calon mahasiswa, nomor registrasi, prodi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({applicants.length})
              </button>
              <button
                onClick={() => setStatusFilter('PASSED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'PASSED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diterima ({acceptedCount})
              </button>
              <button
                onClick={() => setStatusFilter('REGISTERED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'REGISTERED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NIM Terbit ({registeredCount})
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'VERIFIED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siap Putusan ({waitingDecisionCount})
              </button>
              <button
                onClick={() => setStatusFilter('FAILED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'FAILED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ditolak ({rejectedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Daftar Kelulusan &amp; Registrasi ({filteredApplicants.length} pendaftar)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Program Studi</th>
                  <th className="py-3 px-4 text-center">Skor CBT</th>
                  <th className="py-3 px-4 text-center">Status Kelulusan</th>
                  <th className="py-3 px-4 text-right">Aksi Kelulusan &amp; NIM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data kelulusan...</span>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Tidak ada pendaftar pada filter ini.</p>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((item) => (
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
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.testScore ?? '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderStatus(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* SK Button */}
                          {(item.status === 'PASSED' || item.status === 'REGISTERED') && (
                            <button
                              onClick={() => {
                                setSkApplicant(item);
                                setSkModalOpen(true);
                              }}
                              title="Cetak Surat Keputusan Penerimaan"
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3 text-blue-700" />
                              <span>SK</span>
                            </button>
                          )}

                          {/* Convert to Student Button */}
                          {item.status === 'PASSED' && (
                            <button
                              onClick={() => handleConvertToStudent(item)}
                              disabled={isSubmitting}
                              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Terbitkan NIM</span>
                            </button>
                          )}

                          {/* Decision Action Buttons */}
                          {item.status !== 'REGISTERED' && (
                            <>
                              <button
                                onClick={() => handleOpenDecisionModal(item, 'PASSED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                              >
                                {item.status === 'PASSED' ? 'Ubah' : 'Terima'}
                              </button>
                              <button
                                onClick={() => handleOpenDecisionModal(item, 'FAILED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {item.status === 'REGISTERED' && (
                            <span className="text-[11px] font-bold text-purple-700 px-2 py-0.5 bg-purple-50 rounded-md">
                              Mahasiswa Aktif
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Penetapan Keputusan */}
        {decisionModalOpen && selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {decisionType === 'PASSED' ? 'Penetapan DITERIMA (Lolos Seleksi)' : 'Penetapan TIDAK LOLOS Seleksi'}
                </h3>
                <button
                  onClick={() => setDecisionModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteDecision} className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{selectedApplicant.fullName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedApplicant.registrationNumber}</p>
                  <p className="text-blue-900 font-semibold">{selectedApplicant.chosenStudyProgram}</p>
                  <p className="text-slate-600 text-[11px]">Skor Ujian CBT: <strong>{selectedApplicant.testScore ?? '-'}</strong></p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan SK / Putusan Seleksi</label>
                  <textarea
                    rows={3}
                    required
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Tuliskan catatan kelulusan..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDecisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl text-white font-bold transition-colors disabled:opacity-50 ${
                      decisionType === 'PASSED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSubmitting ? 'Menyimpan...' : decisionType === 'PASSED' ? 'Tetapkan Diterima' : 'Tetapkan Tidak Lolos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Surat Keputusan Penerimaan (SK) */}
        {skModalOpen && skApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white font-black text-sm">
                    ITN
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">Institut Teknologi Nusantara</h3>
                    <p className="text-xs text-slate-500">Panitia Penerimaan Mahasiswa Baru (PMB)</p>
                  </div>
                </div>
                <button
                  onClick={() => setSkModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed border-b border-slate-100 pb-6">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black tracking-wider text-slate-900 uppercase">
                    Surat Keterangan Hasil Seleksi PMB
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Nomor: ITN/PMB/SK-KEL/{new Date().getFullYear()}/{skApplicant.registrationNumber}
                  </p>
                </div>

                <p>
                  Berdasarkan hasil verifikasi berkas administratif dan hasil Ujian Seleksi Mandiri CBT (Computer Based Test) Tahun Akademik 2027/2028, Panitia PMB Institut Teknologi Nusantara menyatakan bahwa:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-medium">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nomor Registrasi</span>
                    <span className="col-span-2 font-mono font-bold text-blue-900">{skApplicant.registrationNumber}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-bold text-slate-900">{skApplicant.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Asal Sekolah</span>
                    <span className="col-span-2">{skApplicant.highSchool || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Program Studi</span>
                    <span className="col-span-2 font-bold text-[#1E3A8A]">{skApplicant.chosenStudyProgram}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jalur Pendaftaran</span>
                    <span className="col-span-2">{skApplicant.jalurPendaftaran}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Hasil Evaluasi</span>
                    <span className="col-span-2 font-black text-emerald-700 uppercase">DINYATAKAN DITERIMA</span>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px]">
                  Calon mahasiswa yang dinyatakan diterima diwajibkan melakukan registrasi ulang akademik dan pembayaran biaya pendidikan tahap pertama sesuai dengan ketentuan yang berlaku.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Ditetapkan oleh Panitia Penerimaan Mahasiswa Baru ITN
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs hover:bg-[#172554] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Surat</span>
                  </button>
                  <button
                    onClick={() => setSkModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
