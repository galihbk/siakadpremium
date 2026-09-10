'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  X,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  FileCheck2,
  DollarSign,
  MapPin,
  Building,
} from 'lucide-react';

export interface PengabdianItem {
  id: string;
  title: string;
  scheme: string;
  focusArea: string;
  leader: string;
  nidn: string;
  faculty: string;
  membersCount: number;
  year: number;
  fundingAmount: number;
  fundingSource: 'DIPA Internal' | 'BIMA Kemendikbud' | 'Mandiri / Mitra';
  status: 'Menunggu Verifikasi' | 'Perlu Revisi' | 'Disetujui' | 'Sedang Berjalan' | 'Selesai' | 'Ditolak';
  targetOutput: string;
  mitraSasaran: string;
  lokasiMitra: string;
  reviewerNote?: string;
  submittedAt: string;
}

export default function PengabdianAdminPage() {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedScheme, setSelectedScheme] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [items, setItems] = useState<PengabdianItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [selectedForReview, setSelectedForReview] = useState<PengabdianItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<PengabdianItem['status']>('Disetujui');
  const [reviewNote, setReviewNote] = useState<string>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    scheme: 'Program Kemitraan Masyarakat (PKM)',
    focusArea: 'Pengembangan Ekonomi Desa & UMKM',
    leader: 'Dr. Siti Rahmawati, S.P., M.Si.',
    nidn: '0408038302',
    faculty: 'Fakultas Pertanian & Biosains',
    year: 2026,
    fundingAmount: '20000000',
    fundingSource: 'DIPA Internal' as const,
    mitraSasaran: '',
    lokasiMitra: '',
    targetOutput: 'Publikasi Media Massa & Video Dokumenter',
  });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type: 'Pengabdian' });
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
      console.warn('Gagal memuat data pengabdian dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedYear, selectedStatus, searchTerm]);

  // Currency Formatter
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

  // Filtered Items
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
        showToast(`Status pengabdian "${selectedForReview.title}" berhasil diubah menjadi: ${reviewStatus}`);
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
          type: 'Pengabdian',
          title: form.title,
          scheme: form.scheme,
          focusArea: form.focusArea,
          leader: form.leader,
          nidn: form.nidn,
          faculty: form.faculty,
          membersCount: 3,
          year: form.year,
          fundingAmount: Number(form.fundingAmount) || 0,
          fundingSource: form.fundingSource,
          targetOutput: form.targetOutput,
          mitraSasaran: form.mitraSasaran,
        }),
      });

      if (res.ok) {
        showToast(`Usulan pengabdian baru berhasil didaftarkan ke database.`);
        setIsCreateOpen(false);
        setForm({
          title: '',
          scheme: 'Program Kemitraan Masyarakat (PKM)',
          focusArea: 'Pengembangan Ekonomi Desa & UMKM',
          leader: 'Dr. Siti Rahmawati, S.P., M.Si.',
          nidn: '0408038302',
          faculty: 'Fakultas Pertanian & Biosains',
          year: 2026,
          fundingAmount: '20000000',
          fundingSource: 'DIPA Internal',
          mitraSasaran: '',
          lokasiMitra: '',
          targetOutput: 'Publikasi Media Massa & Video Dokumenter',
        });
        fetchItems();
      } else {
        showToast('Gagal menyimpan usulan ke database.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengabdian "${title}" dari database?`)) {
      try {
        const res = await fetch(`${apiBase}/lp3m/research/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Data pengabdian berhasil dihapus dari database.`);
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
        <div className="bg-gradient-to-r from-[#091a44] via-[#065f46] to-[#047857] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Pengabdian kepada Masyarakat (PkM)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Pengabdian kepada Masyarakat (PkM)</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Pencatatan dan evaluasi program kemitraan dosen bersama masyarakat, pemberdayaan desa binaan,
              sekolah kejuruan, serta pendampingan UMKM berbasis teknologi tepat guna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Usulkan Program PkM Baru</span>
            </button>
            <button
              onClick={() => showToast('Mengekspor rekapitulasi data pengabdian ke format Excel...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Program PkM</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</p>
              <p className="text-xs text-slate-500 mt-0.5"><strong className="text-emerald-700">{metrics.disetujui}</strong> Program Kemitraan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Dana Disetujui</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(metrics.totalDana)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Hibah Internal & Kemitraan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Butuh Verifikasi</span>
              <p className="text-3xl font-black text-rose-600 mt-1">{metrics.butuhReview}</p>
              <p className="text-xs text-slate-500 mt-0.5">Usulan Proposal Baru</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mitra Binaan</span>
              <p className="text-xl font-black text-emerald-800 mt-1">Desa & UMKM</p>
              <p className="text-xs text-slate-500 mt-0.5">Wilayah Jawa Tengah</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
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
              placeholder="Cari nama program PkM, ketua pengabdi, nama mitra sasaran, atau lokasi..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
            >
              <option value="Semua">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
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
                  <th className="py-3.5 px-4 min-w-[280px]">Judul Program & Mitra Sasaran</th>
                  <th className="py-3.5 px-4">Ketua Pengabdi</th>
                  <th className="py-3.5 px-4">Skema & Lokasi</th>
                  <th className="py-3.5 px-4 text-right">Dana Disetujui</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[140px]">Aksi Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group text-slate-800">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          Mitra: {item.mitraSasaran}
                        </span>
                        <span>&bull;</span>
                        <span>Fokus: {item.focusArea}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{item.leader}</p>
                      <p className="text-[11px] text-slate-500">NIDN: {item.nidn}</p>
                      <p className="text-[11px] text-slate-400">{item.faculty}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{item.scheme}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{item.lokasiMitra}</span>
                      </p>
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
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
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
              <div className="bg-gradient-to-r from-[#091a44] to-[#047857] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-extrabold text-base">Verifikasi Usulan Pengabdian Masyarakat (PkM)</h3>
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
                    <div>Mitra: <strong>{selectedForReview.mitraSasaran}</strong></div>
                    <div>Lokasi: <strong>{selectedForReview.lokasiMitra}</strong></div>
                    <div>Usulan Dana: <strong className="text-emerald-700">{formatRupiah(selectedForReview.fundingAmount)}</strong></div>
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
                      placeholder="Masukkan catatan penilaian kelayakan program pengabdian..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button onClick={() => setSelectedForReview(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                  Batal
                </button>
                <button onClick={handleSaveReview} className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer flex items-center gap-1.5">
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
              <div className="bg-gradient-to-r from-[#091a44] to-[#047857] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-extrabold text-base">Formulir Usulan Pengabdian Masyarakat (PkM)</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan PkM *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Pendampingan Digitalisasi Pemasaran untuk UMKM..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Ketua Pengabdi *</label>
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
                    <label className="block font-bold text-slate-700 mb-1">Nama Mitra Sasaran *</label>
                    <input
                      type="text"
                      required
                      value={form.mitraSasaran}
                      onChange={(e) => setForm({ ...form, mitraSasaran: e.target.value })}
                      placeholder="Contoh: Kelompok Tani Mekar Sari"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Mitra *</label>
                    <input
                      type="text"
                      required
                      value={form.lokasiMitra}
                      onChange={(e) => setForm({ ...form, lokasiMitra: e.target.value })}
                      placeholder="Contoh: Desa Binaan Majenang"
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
                    placeholder="Contoh: Video Dokumenter & Publikasi Media Massa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    <span>Daftarkan Pengabdian</span>
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
