'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FlaskConical,
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  BookOpen,
  DollarSign,
  Building2,
  Trash2,
  X,
  Send,
  Sparkles,
  FileCheck2,
  Check,
} from 'lucide-react';

export interface PenelitianItem {
  id: string;
  code?: string;
  title: string;
  scheme: string;
  focusArea: string;
  leader: string;
  nidn: string;
  faculty: string;
  membersCount: number;
  year: number;
  fundingAmount: number;
  fundingSource: string;
  status: 'Sedang Berjalan' | 'Selesai' | 'Menunggu Verifikasi' | 'Perlu Revisi' | 'Ditolak' | 'Disetujui';
  targetOutput: string;
  submittedAt?: string;
  reviewerNote?: string;
}

export default function PenelitianAdminPage() {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedScheme, setSelectedScheme] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [items, setItems] = useState<PenelitianItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [selectedForReview, setSelectedForReview] = useState<PenelitianItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<PenelitianItem['status']>('Disetujui');
  const [reviewNote, setReviewNote] = useState<string>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    scheme: 'Penelitian Fundamental Internal',
    focusArea: 'Kecerdasan Buatan & Big Data',
    leader: 'Dr. Bayu Wicaksono, M.Kom.',
    nidn: '0412088501',
    faculty: 'Fakultas Ilmu Komputer',
    fundingAmount: '35000000',
    fundingSource: 'DIPA Internal',
    targetOutput: 'Jurnal Internasional Terindeks Scopus & Prototipe Web',
    year: 2026,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type: 'Penelitian' });
      if (selectedYear !== 'Semua') params.append('year', selectedYear);
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lp3m/research?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.data || json.data || [];
        setItems(data);
      }
    } catch (err) {
      console.warn('Gagal memuat data penelitian dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedYear, selectedStatus, searchTerm]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const disetujui = items.filter((i) => ['Disetujui', 'Sedang Berjalan', 'Selesai'].includes(i.status)).length;
    const butuhReview = items.filter((i) => i.status === 'Menunggu Verifikasi').length;
    const totalDana = items.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);
    return { total, disetujui, butuhReview, totalDana };
  }, [items]);

  // Filtered Items by Scheme
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchScheme = selectedScheme === 'Semua' || item.scheme === selectedScheme;
      return matchScheme;
    });
  }, [items, selectedScheme]);

  const handleSaveReview = async () => {
    if (!selectedForReview) return;
    try {
      const res = await fetch(`${apiBase}/lp3m/research/${selectedForReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          reviewerNote: reviewNote,
        }),
      });

      if (res.ok) {
        showToast(`Status penelitian "${selectedForReview.title}" berhasil diubah menjadi: ${reviewStatus}`);
        fetchItems();
      } else {
        showToast('Gagal memperbarui status di database.');
      }
    } catch (err) {
      showToast('Koneksi database terganggu saat menyimpan review.');
    }
    setSelectedForReview(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const res = await fetch(`${apiBase}/lp3m/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Penelitian',
          title: form.title,
          scheme: form.scheme,
          focusArea: form.focusArea,
          leader: form.leader,
          nidn: form.nidn,
          faculty: form.faculty,
          membersCount: 2,
          year: form.year,
          fundingAmount: Number(form.fundingAmount) || 0,
          fundingSource: form.fundingSource,
          targetOutput: form.targetOutput,
        }),
      });

      if (res.ok) {
        showToast(`Usulan penelitian baru berhasil didaftarkan ke database.`);
        setIsCreateOpen(false);
        setForm({
          title: '',
          scheme: 'Penelitian Fundamental Internal',
          focusArea: 'Kecerdasan Buatan & Big Data',
          leader: 'Dr. Bayu Wicaksono, M.Kom.',
          nidn: '0412088501',
          faculty: 'Fakultas Ilmu Komputer',
          fundingAmount: '35000000',
          fundingSource: 'DIPA Internal',
          targetOutput: 'Jurnal Internasional Terindeks Scopus & Prototipe Web',
          year: 2026,
        });
        fetchItems();
      } else {
        showToast('Gagal menyimpan usulan baru ke database.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat menyimpan usulan.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data penelitian "${title}" dari database?`)) {
      try {
        const res = await fetch(`${apiBase}/lp3m/research/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Data penelitian berhasil dihapus dari database.`);
          fetchItems();
        } else {
          showToast('Gagal menghapus data dari database.');
        }
      } catch (err) {
        showToast('Gagal menghubungi server database.');
      }
    }
  };

  return (
    <PortalLayout
      role="lp3m"
      userName="Prof. Dr. Ir. H. Sudirman, M.T."
      userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi"
    >
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#091a44] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Laporan & Usulan Penelitian</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Laporan & Usulan Penelitian Dosen</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Pengelolaan seluruh usulan riset ilmiah, proses verifikasi reviewer, pemantauan luaran publikasi
              jurnal internasional Scopus/SINTA, serta alokasi hibah penelitian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Usulkan Penelitian Baru</span>
            </button>
            <button
              onClick={() => showToast('Mengekspor rekapitulasi data penelitian ke format Excel...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Penelitian</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</p>
              <p className="text-xs text-slate-500 mt-0.5"><strong className="text-emerald-700">{metrics.disetujui}</strong> Didanai / Aktif</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Alokasi Dana</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(metrics.totalDana)}</p>
              <p className="text-xs text-slate-500 mt-0.5">DIPA Internal & BIMA</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Butuh Verifikasi</span>
              <p className="text-3xl font-black text-rose-600 mt-1">{metrics.butuhReview}</p>
              <p className="text-xs text-slate-500 mt-0.5">Menunggu Tindakan Reviewer</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Luaran</span>
              <p className="text-xl font-black text-purple-700 mt-1">100% SINTA & Scopus</p>
              <p className="text-xs text-slate-500 mt-0.5">Terakreditasi Nasional</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul riset, nama ketua peneliti, NIDN, atau fokus ilmu..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
            >
              <option value="Semua">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>

            {(searchTerm || selectedYear !== '2026' || selectedStatus !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('2026');
                  setSelectedStatus('Semua');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[300px]">Judul Penelitian & Bidang Fokus</th>
                  <th className="py-3.5 px-4">Ketua Peneliti</th>
                  <th className="py-3.5 px-4">Skema & Sumber Dana</th>
                  <th className="py-3.5 px-4 text-right">Dana Disetujui</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[140px]">Aksi Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group text-slate-800">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {item.focusArea}
                        </span>
                        <span>&bull;</span>
                        <span>Target: {item.targetOutput}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{item.leader}</p>
                      <p className="text-[11px] text-slate-500">NIDN: {item.nidn}</p>
                      <p className="text-[11px] text-slate-400">{item.faculty}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{item.scheme}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px] font-bold">
                        {item.fundingSource}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(item.fundingAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Disetujui' || item.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'Sedang Berjalan'
                            ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                            : item.status === 'Menunggu Verifikasi'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedForReview(item);
                            setReviewStatus(item.status);
                            setReviewNote(item.reviewerNote || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E3A8A] text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

        {/* Modal Review */}
        {selectedForReview && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-extrabold text-base">Verifikasi Usulan Penelitian Dosen</h3>
                </div>
                <button onClick={() => setSelectedForReview(null)} className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900 text-sm leading-snug">{selectedForReview.title}</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>Ketua: <strong>{selectedForReview.leader}</strong> ({selectedForReview.nidn})</div>
                    <div>Fakultas: <strong>{selectedForReview.faculty}</strong></div>
                    <div>Usulan Dana: <strong className="text-emerald-700">{formatRupiah(selectedForReview.fundingAmount)}</strong></div>
                    <div>Skema: <strong>{selectedForReview.scheme}</strong></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block font-bold text-slate-700">Keputusan Reviewer</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Disetujui', 'Perlu Revisi', 'Ditolak'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReviewStatus(st)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          reviewStatus === st
                            ? st === 'Disetujui' ? 'bg-emerald-600 text-white' : st === 'Perlu Revisi' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan / Rekomendasi Evaluasi</label>
                    <textarea
                      rows={4}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Masukkan catatan penilaian kelayakan proposal riset..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button onClick={() => setSelectedForReview(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                  Batal
                </button>
                <button onClick={handleSaveReview} className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl cursor-pointer flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Simpan Keputusan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Create */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-extrabold text-base">Formulir Usulan Penelitian Dosen</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Penelitian *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Eksplorasi Model Machine Learning untuk Prediksi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Ketua Peneliti *</label>
                    <input
                      type="text"
                      required
                      value={form.leader}
                      onChange={(e) => setForm({ ...form, leader: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIDN *</label>
                    <input
                      type="text"
                      required
                      value={form.nidn}
                      onChange={(e) => setForm({ ...form, nidn: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fakultas</label>
                    <select
                      value={form.faculty}
                      onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                      <option value="Fakultas Teknik">Fakultas Teknik</option>
                      <option value="Fakultas Ekonomi & Bisnis">Fakultas Ekonomi & Bisnis</option>
                      <option value="Fakultas Pertanian & Biosains">Fakultas Pertanian & Biosains</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Skema Usulan</label>
                    <input
                      type="text"
                      value={form.scheme}
                      onChange={(e) => setForm({ ...form, scheme: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Anggaran Usulan (Rp) *</label>
                    <input
                      type="number"
                      required
                      value={form.fundingAmount}
                      onChange={(e) => setForm({ ...form, fundingAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
                    <select
                      value={form.fundingSource}
                      onChange={(e) => setForm({ ...form, fundingSource: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value="DIPA Internal">DIPA Internal Perguruan Tinggi</option>
                      <option value="BIMA Kemendikbud">BIMA Kemendikbud</option>
                      <option value="Mandiri / Mitra">Mandiri / Mitra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Luaran Wajib</label>
                  <input
                    type="text"
                    value={form.targetOutput}
                    onChange={(e) => setForm({ ...form, targetOutput: e.target.value })}
                    placeholder="Contoh: Jurnal Internasional Scopus Q2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl cursor-pointer flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    <span>Daftarkan Penelitian</span>
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
