'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  FileCheck,
  FileX,
  Eye,
  Clock,
  Check,
  X,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { AdmissionApplicantItem } from '@siakad/types';

export default function VerifikasiPage() {
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState<'pending' | 'verified' | 'all'>('pending');

  // Modals & Action States
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [actionNotes, setActionNotes] = useState('');
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
        throw new Error('Gagal memuat antrean verifikasi.');
      }
    } catch (err: any) {
      console.error('Error fetching verification applicants:', err);
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
  const pendingCount = useMemo(() => applicants.filter((a) => a.status === 'PENDING').length, [applicants]);
  const verifiedCount = useMemo(() => applicants.filter((a) => a.status === 'VERIFIED' || a.status === 'PASSED' || a.status === 'REGISTERED').length, [applicants]);
  const rejectedCount = useMemo(() => applicants.filter((a) => a.status === 'FAILED').length, [applicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.highSchool && item.highSchool.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchTab = true;
      if (viewTab === 'pending') {
        matchTab = item.status === 'PENDING';
      } else if (viewTab === 'verified') {
        matchTab = item.status === 'VERIFIED' || item.status === 'PASSED' || item.status === 'REGISTERED';
      }

      return matchSearch && matchTab;
    });
  }, [applicants, searchQuery, viewTab]);

  const handleOpenActionModal = (applicant: AdmissionApplicantItem, type: 'APPROVE' | 'REJECT') => {
    setSelectedApplicant(applicant);
    setActionType(type);
    setActionNotes(type === 'APPROVE' ? 'Seluruh berkas persyaratan lengkap dan valid.' : 'Berkas belum memenuhi persyaratan (ijazah / KTP tidak jelas).');
    setVerifyModalOpen(true);
  };

  const handleExecuteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setIsSubmitting(true);
    try {
      const newStatus = actionType === 'APPROVE' ? 'VERIFIED' : 'FAILED';
      const payload = {
        status: newStatus,
        notes: actionNotes.trim(),
      };

      const res = await fetch(`${apiBase}/admissions/applicants/${selectedApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal memproses verifikasi berkas.');
      }

      setVerifyModalOpen(false);
      setSelectedApplicant(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/verifikasi"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verifikasi Berkas Calon Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pemeriksaan keabsahan dokumen persyaratan administratif pendaftaran PMB ITN.
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setViewTab('pending')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              viewTab === 'pending'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
            <span className="text-[11px] text-slate-500">Berkas pendaftar baru</span>
          </div>

          <div
            onClick={() => setViewTab('verified')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              viewTab === 'verified'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Berkas Terverifikasi</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">{verifiedCount}</p>
            <span className="text-[11px] text-slate-500">Memenuhi syarat seleksi</span>
          </div>

          <div
            onClick={() => setViewTab('all')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              viewTab === 'all'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Berkas Ditolak</span>
              <FileX className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700 mt-2">{rejectedCount}</p>
            <span className="text-[11px] text-slate-500">Perlu unggah ulang</span>
          </div>

          <div
            onClick={() => setViewTab('all')}
            className="p-4 rounded-2xl bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Total Berkas</span>
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{applicants.length}</p>
            <span className="text-[11px] text-slate-500">Keseluruhan pendaftar</span>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama calon mahasiswa, nomor registrasi, asal sekolah..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setViewTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Antrean ({pendingCount})
              </button>
              <button
                onClick={() => setViewTab('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewTab === 'verified' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terverifikasi ({verifiedCount})
              </button>
              <button
                onClick={() => setViewTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({applicants.length})
              </button>
            </div>
          </div>
        </div>

        {/* Verification Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs font-semibold">Memeriksa antrean berkas...</p>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">Tidak ada antrean berkas</p>
              <p className="text-xs text-slate-400 mt-1">
                {viewTab === 'pending'
                  ? 'Semua berkas pendaftar baru telah diverifikasi oleh panitia.'
                  : 'Tidak ada data yang sesuai dengan pencarian.'}
              </p>
            </div>
          ) : (
            filteredApplicants.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.registrationNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.fullName}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600">{item.chosenStudyProgram}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Asal: <strong>{item.highSchool || '-'}</strong></span>
                    <span>Jalur: <strong>{item.jalurPendaftaran}</strong></span>
                    <span>Kontak: {item.phone}</span>
                  </div>

                  {/* Checklist Dokumen Berkas */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      <FileText className="w-3 h-3 text-slate-500" /> KTP / KK
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      <FileText className="w-3 h-3 text-slate-500" /> Ijazah / SKL
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      <FileText className="w-3 h-3 text-slate-500" /> Rapor / Nilai
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      <FileText className="w-3 h-3 text-slate-500" /> Pasfoto Resmi
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md inline-block">
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {item.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleOpenActionModal(item, 'APPROVE')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi & Setujui</span>
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(item, 'REJECT')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        item.status === 'VERIFIED' || item.status === 'PASSED' || item.status === 'REGISTERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.status === 'VERIFIED' ? 'Berkas Valid' : item.status === 'PASSED' ? 'Lolos Seleksi' : item.status === 'REGISTERED' ? 'Registrasi Selesai' : 'Berkas Ditolak'}
                      </span>
                      <button
                        onClick={() => handleOpenActionModal(item, 'APPROVE')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                        title="Tinjau ulang berkas"
                      >
                        Ubah
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Konfirmasi Verifikasi */}
        {verifyModalOpen && selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === 'APPROVE' ? 'Setujui Verifikasi Berkas' : 'Tolak Berkas Pendaftar'}
                </h3>
                <button
                  onClick={() => setVerifyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteVerification} className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{selectedApplicant.fullName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{selectedApplicant.registrationNumber}</p>
                  <p className="text-slate-600 font-medium">{selectedApplicant.chosenStudyProgram}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Hasil Verifikasi</label>
                  <textarea
                    rows={3}
                    required
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Berikan alasan atau catatan verifikasi..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVerifyModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl text-white font-bold transition-colors disabled:opacity-50 ${
                      actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSubmitting ? 'Memproses...' : actionType === 'APPROVE' ? 'Setujui Berkas' : 'Tolak Berkas'}
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
