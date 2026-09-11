'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { AdmissionApplicantItem } from '@siakad/types';

export default function PendaftarPage() {
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProdi, setFilterProdi] = useState<string>('ALL');
  const [filterJalur, setFilterJalur] = useState<string>('ALL');

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal
  const [statusUpdateApplicant, setStatusUpdateApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('VERIFIED');
  const [updateScoreVal, setUpdateScoreVal] = useState<string>('');
  const [updateNotesVal, setUpdateNotesVal] = useState<string>('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // New Applicant Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highSchool: '',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Mandiri Online (CBT)',
    testScore: '',
    notes: '',
  });

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
        throw new Error('Gagal memuat data pendaftar dari server.');
      }
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.highSchool && item.highSchool.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchProdi = filterProdi === 'ALL' || item.chosenStudyProgram === filterProdi;
      const matchJalur = filterJalur === 'ALL' || item.jalurPendaftaran === filterJalur;

      return matchSearch && matchStatus && matchProdi && matchJalur;
    });
  }, [applicants, searchQuery, filterStatus, filterProdi, filterJalur]);

  const uniqueProdis = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      if (a.chosenStudyProgram) set.add(a.chosenStudyProgram);
    });
    return Array.from(set);
  }, [applicants]);

  const uniqueJalur = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      if (a.jalurPendaftaran) set.add(a.jalurPendaftaran);
    });
    return Array.from(set);
  }, [applicants]);

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Mohon lengkapi Nama, Email, dan Nomor Telepon.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        highSchool: formData.highSchool.trim() || 'SMA/SMK Sederajat',
        chosenStudyProgram: formData.chosenStudyProgram,
        jalurPendaftaran: formData.jalurPendaftaran,
        testScore: formData.testScore ? parseFloat(formData.testScore) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch(`${apiBase}/admissions/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menyimpan calon mahasiswa baru.');
      }

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        highSchool: '',
        chosenStudyProgram: 'Teknik Informatika (S1)',
        jalurPendaftaran: 'Jalur Mandiri Online (CBT)',
        testScore: '',
        notes: '',
      });
      setAddModalOpen(false);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusModal = (applicant: AdmissionApplicantItem) => {
    setStatusUpdateApplicant(applicant);
    setUpdateStatusVal(applicant.status);
    setUpdateScoreVal(applicant.testScore !== undefined && applicant.testScore !== null ? String(applicant.testScore) : '');
    setUpdateNotesVal(applicant.notes || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateApplicant) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        status: updateStatusVal,
        notes: updateNotesVal.trim() || undefined,
      };

      if (updateScoreVal !== '') {
        payload.testScore = parseFloat(updateScoreVal);
      }

      const res = await fetch(`${apiBase}/admissions/applicants/${statusUpdateApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal memperbarui status pendaftar.');
      }

      setStatusModalOpen(false);
      setStatusUpdateApplicant(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplicant = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data pendaftar "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApplicants((prev) => prev.filter((item) => item.id !== id));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Gagal menghapus data.');
      }
    } catch (err) {
      alert('Terjadi kendala saat menghapus data pendaftar.');
    }
  };

  const handleExportCsv = () => {
    if (filteredApplicants.length === 0) return;
    const headers = ['No Registrasi', 'Nama Lengkap', 'Email', 'Telepon', 'Asal Sekolah', 'Program Studi', 'Jalur', 'Skor CBT', 'Status'];
    const rows = filteredApplicants.map((a) => [
      `"${a.registrationNumber}"`,
      `"${a.fullName}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.highSchool || '-'}"`,
      `"${a.chosenStudyProgram}"`,
      `"${a.jalurPendaftaran}"`,
      `"${a.testScore ?? '-'}"`,
      `"${a.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_pendaftar_pmb_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-semibold">Menunggu Verifikasi</span>;
      case 'VERIFIED':
        return <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-semibold">Berkas Valid</span>;
      case 'PASSED':
        return <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-semibold">Lolos Seleksi</span>;
      case 'FAILED':
        return <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-semibold">Tidak Lolos</span>;
      case 'REGISTERED':
        return <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md text-xs font-semibold">Registrasi Ulang</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/pendaftar"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Calon Mahasiswa Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direktori seluruh pendaftar PMB tahun akademik berjalan beserta status seleksi dan data kontak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={fetchApplicants}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan'}</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Calon Mahasiswa</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
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

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor registrasi, nama, email, asal sekolah..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Verifikasi</option>
                <option value="VERIFIED">Berkas Valid</option>
                <option value="PASSED">Lolos Seleksi</option>
                <option value="REGISTERED">Registrasi Ulang</option>
                <option value="FAILED">Tidak Lolos</option>
              </select>

              <select
                value={filterProdi}
                onChange={(e) => setFilterProdi(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 max-w-[200px]"
              >
                <option value="ALL">Semua Program Studi</option>
                {uniqueProdis.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filterJalur}
                onChange={(e) => setFilterJalur(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 max-w-[180px]"
              >
                <option value="ALL">Semua Jalur</option>
                {uniqueJalur.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Menampilkan {filteredApplicants.length} dari {applicants.length} pendaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Pendaftar</th>
                  <th className="py-3 px-4">Program Studi</th>
                  <th className="py-3 px-4">Jalur Seleksi</th>
                  <th className="py-3 px-4">Asal Sekolah</th>
                  <th className="py-3 px-4 text-center">Skor CBT</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data pendaftar...</span>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Tidak ada pendaftar yang cocok.</p>
                      <p className="text-[11px] mt-1">Coba sesuaikan kata kunci atau filter status Anda.</p>
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
                        <div className="text-[11px] text-slate-400">{item.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.chosenStudyProgram}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.jalurPendaftaran}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.highSchool || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.testScore !== undefined && item.testScore !== null ? (
                          <span className={item.testScore >= 65 ? 'text-emerald-700 font-black' : 'text-slate-700'}>
                            {item.testScore}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderStatus(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedApplicant(item);
                              setDetailModalOpen(true);
                            }}
                            title="Lihat Detail"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(item)}
                            title="Ubah Status / Skor"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteApplicant(item.id, item.fullName)}
                            title="Hapus Data"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail Pendaftar */}
        {detailModalOpen && selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Detail Calon Mahasiswa</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedApplicant.registrationNumber}</p>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedApplicant.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status Seleksi</span>
                    <div className="mt-0.5">{renderStatus(selectedApplicant.status)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <span className="font-medium text-slate-800">{selectedApplicant.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">No. Telepon / WhatsApp</span>
                    <span className="font-medium text-slate-800">{selectedApplicant.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Program Studi Pilihan</span>
                    <span className="font-bold text-blue-900">{selectedApplicant.chosenStudyProgram}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jalur Seleksi</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.jalurPendaftaran}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Asal Sekolah</span>
                    <span className="font-medium text-slate-800">{selectedApplicant.highSchool || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Skor Ujian CBT</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.testScore ?? 'Belum Ujian'}</span>
                  </div>
                </div>

                {selectedApplicant.notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                    <span className="text-amber-800 font-bold block mb-0.5">Catatan Panitia:</span>
                    <p className="text-amber-700">{selectedApplicant.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenStatusModal(selectedApplicant);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                >
                  Perbarui Status / Skor
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Calon Mahasiswa */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Tambah Calon Mahasiswa Baru</h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplicant} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: Muhammad Rizky Pratama"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@pendaftar.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    value={formData.highSchool}
                    onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                    placeholder="SMA Negeri 1 Jakarta / SMK Telkom"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program Studi Pilihan</label>
                    <select
                      value={formData.chosenStudyProgram}
                      onChange={(e) => setFormData({ ...formData, chosenStudyProgram: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      <option value="Teknik Informatika (S1)">Teknik Informatika (S1)</option>
                      <option value="Sistem Informasi (S1)">Sistem Informasi (S1)</option>
                      <option value="Teknik Mesin (S1)">Teknik Mesin (S1)</option>
                      <option value="Teknik Elektro (S1)">Teknik Elektro (S1)</option>
                      <option value="Bisnis Digital (S1)">Bisnis Digital (S1)</option>
                      <option value="Manajemen (S1)">Manajemen (S1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jalur Seleksi</label>
                    <select
                      value={formData.jalurPendaftaran}
                      onChange={(e) => setFormData({ ...formData, jalurPendaftaran: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      <option value="Jalur Mandiri Online (CBT)">Jalur Mandiri Online (CBT)</option>
                      <option value="Jalur Prestasi Nilai Rapor">Jalur Prestasi Nilai Rapor</option>
                      <option value="Jalur Prestasi Kemitraan">Jalur Prestasi Kemitraan</option>
                      <option value="Jalur Alih Jenjang (Transfer)">Jalur Alih Jenjang (Transfer)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Skor Ujian CBT (Opsional)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.testScore}
                      onChange={(e) => setFormData({ ...formData, testScore: e.target.value })}
                      placeholder="Contoh: 85"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan Panitia</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Misal: Berkas ijazah lengkap"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172554] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Calon Mahasiswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ubah Status & Nilai */}
        {statusModalOpen && statusUpdateApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Perbarui Status Pendaftar</h3>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStatusUpdate} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="font-bold text-slate-900">{statusUpdateApplicant.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{statusUpdateApplicant.registrationNumber}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Seleksi</label>
                  <select
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                  >
                    <option value="PENDING">PENDING - Menunggu Verifikasi</option>
                    <option value="VERIFIED">VERIFIED - Berkas Valid</option>
                    <option value="PASSED">PASSED - Dinyatakan Lolos</option>
                    <option value="FAILED">FAILED - Tidak Lolos</option>
                    <option value="REGISTERED">REGISTERED - Selesai Registrasi Ulang</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skor Ujian CBT (0 - 100)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={updateScoreVal}
                    onChange={(e) => setUpdateScoreVal(e.target.value)}
                    placeholder="Contoh: 82.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Verifikator / Panitia</label>
                  <textarea
                    rows={2}
                    value={updateNotesVal}
                    onChange={(e) => setUpdateNotesVal(e.target.value)}
                    placeholder="Catatan tambahan hasil seleksi..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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
