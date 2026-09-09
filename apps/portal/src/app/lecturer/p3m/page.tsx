'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  FlaskConical,
  BookOpen,
  Award,
  Users,
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  FileCheck2,
  HelpCircle,
  Building,
  DollarSign,
  Layers,
  Edit,
  Trash2,
  Printer,
  Check,
  Send,
} from 'lucide-react';

export interface P3mReportItem {
  id: string;
  type: 'Penelitian' | 'Pengabdian';
  title: string;
  scheme: string;
  focusArea: string;
  year: number;
  status: 'Laporan Masuk' | 'Sedang Berjalan' | 'Laporan Kemajuan' | 'Laporan Akhir' | 'Selesai';
  fundingAmount: number;
  fundingSource: string;
  leader: string;
  members: string[];
  targetOutput: string;
  documentUrl: string;
  submittedAt: string;
  verifiedAt: string | null;
  reviewerNote?: string;
}

export default function LecturerP3mPage() {
  const [reports, setReports] = useState<P3mReportItem[]>([]);
  const [summary, setSummary] = useState({
    totalKegiatan: 5,
    totalPenelitian: 3,
    totalPengabdian: 2,
    totalDana: 133000000,
    aktifBerjalan: 2,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'Semua' | 'Penelitian' | 'Pengabdian'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<P3mReportItem | null>(null);
  const [editingItem, setEditingItem] = useState<P3mReportItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Penelitian' as 'Penelitian' | 'Pengabdian',
    title: '',
    scheme: 'Penelitian Fundamental Internal ITN',
    focusArea: '',
    year: 2026,
    status: 'Laporan Masuk' as P3mReportItem['status'],
    fundingAmount: '' as unknown as number,
    fundingSource: 'DIPA Internal ITN',
    leader: 'Dr. Bayu Wicaksono, M.Kom.',
    membersText: '',
    targetOutput: '',
    documentUrl: '',
    notes: '',
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'Semua') params.append('type', activeTab);
      if (selectedYear !== 'Semua') params.append('year', selectedYear);
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lecturers/p3m?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data.reports) {
          setReports(data.reports);
          if (data.summary) setSummary(data.summary);
        } else if (Array.isArray(data)) {
          setReports(data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data laporan P3M:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) {
      setCurrentUser(user);
      if (user.fullName) {
        setFormData((prev) => ({ ...prev, leader: user.fullName }));
      }
    }
    fetchReports();
  }, [activeTab, selectedYear, selectedStatus]);

  // Client Filtered List
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchTab = activeTab === 'Semua' || item.type === activeTab;
      const matchYear = selectedYear === 'Semua' || item.year.toString() === selectedYear;
      const matchStatus = selectedStatus === 'Semua' || item.status === selectedStatus;
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scheme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.focusArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetOutput.toLowerCase().includes(searchTerm.toLowerCase());

      return matchTab && matchYear && matchStatus && matchSearch;
    });
  }, [reports, activeTab, selectedYear, selectedStatus, searchTerm]);

  // Format IDR Currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit Handler (Create or Edit)
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const membersArray = formData.membersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        type: formData.type,
        title: formData.title,
        scheme: formData.scheme,
        focusArea: formData.focusArea,
        year: Number(formData.year),
        status: formData.status,
        fundingAmount: Number(formData.fundingAmount),
        fundingSource: formData.fundingSource,
        leader: formData.leader,
        members: membersArray,
        targetOutput: formData.targetOutput,
        documentUrl: formData.documentUrl,
      };

      if (editingItem) {
        // Update
        const res = await fetch(`${apiBase}/lecturers/p3m/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showNotification(`Laporan "${formData.title}" berhasil diperbarui.`);
          setEditingItem(null);
          setIsCreateModalOpen(false);
          fetchReports();
        } else {
          showNotification('Gagal memperbarui laporan P3M.');
        }
      } else {
        // Create
        const res = await fetch(`${apiBase}/lecturers/p3m`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showNotification(`Laporan ${formData.type} berhasil disimpan ke arsip pelaporan P3M.`);
          setIsCreateModalOpen(false);
          resetForm();
          fetchReports();
        } else {
          showNotification('Gagal menambahkan laporan P3M.');
        }
      }
    } catch (err) {
      showNotification('Terjadi kendala saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteReport = async (item: P3mReportItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data laporan "${item.title}"?`)) return;

    try {
      const res = await fetch(`${apiBase}/lecturers/p3m/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification(`Laporan "${item.title}" berhasil dihapus.`);
        fetchReports();
      } else {
        showNotification('Gagal menghapus laporan.');
      }
    } catch (err) {
      showNotification('Gagal menghapus laporan.');
    }
  };

  const openEditModal = (item: P3mReportItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      scheme: item.scheme,
      focusArea: item.focusArea,
      year: item.year,
      status: item.status,
      fundingAmount: item.fundingAmount,
      fundingSource: item.fundingSource,
      leader: item.leader,
      membersText: item.members.join(', '),
      targetOutput: item.targetOutput,
      documentUrl: item.documentUrl,
      notes: item.reviewerNote || '',
    });
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      type: 'Penelitian',
      title: '',
      scheme: 'Penelitian Fundamental Internal ITN',
      focusArea: '',
      year: 2026,
      status: 'Laporan Masuk',
      fundingAmount: '' as unknown as number,
      fundingSource: 'DIPA Internal ITN',
      leader: currentUser?.fullName || 'Dr. Bayu Wicaksono, M.Kom.',
      membersText: '',
      targetOutput: '',
      documentUrl: '',
      notes: '',
    });
  };

  return (
    <PortalLayout
      role="lecturer"
      userName={currentUser?.fullName || 'Dr. Bayu Wicaksono, M.Kom.'}
      userIdText="NIDN: 0412088501 • Dosen Tetap Informatika"
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner (Signature University Blue Gradient) */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
              <Link href="/lecturer" className="hover:text-white transition-colors">
                Dashboard Dosen
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Pusat Penelitian & Pengabdian (P3M)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Laporan Penelitian & Pengabdian (P3M)</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Pencatatan dan pengarsipan rekam jejak kegiatan penelitian dan pengabdian kepada masyarakat (PkM)
              untuk borang akreditasi institusi, BKD, dan pelaporan Tri Dharma Perguruan Tinggi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Laporkan Kegiatan Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards (Clean Light Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Kegiatan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Arsip Laporan
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{summary.totalKegiatan}</span>
              <span className="text-xs text-slate-500 font-medium">Arsip Kegiatan Tercatat</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Status Aktif Berjalan:</span>
              <strong className="text-slate-800">{summary.aktifBerjalan} Program</strong>
            </div>
          </div>

          {/* Card 2: Total Penelitian */}
          <div
            onClick={() => setActiveTab('Penelitian')}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle flex flex-col justify-between ${
              activeTab === 'Penelitian'
                ? 'border-[#1E3A8A] ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Bidang Penelitian
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1E3A8A]">{summary.totalPenelitian}</span>
              <span className="text-xs text-slate-500 font-medium">Judul Riset</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-[#1E3A8A] flex items-center justify-between font-semibold">
              <span>BIMA & Fundamental</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Total Pengabdian (PkM) */}
          <div
            onClick={() => setActiveTab('Pengabdian')}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle flex flex-col justify-between ${
              activeTab === 'Pengabdian'
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Pengabdian Masyarakat (PkM)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{summary.totalPengabdian}</span>
              <span className="text-xs text-slate-500 font-medium">Program Kemitraan</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center justify-between font-semibold">
              <span>Desa & Sekolah Binaan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Total Pendanaan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Total Dana Disetujui
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {formatRupiah(summary.totalDana)}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Sumber:</span>
              <strong className="text-slate-800">DIPA & Kemendikbud</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Semua, Penelitian, Pengabdian */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-subtle flex gap-2">
          <button
            onClick={() => setActiveTab('Semua')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'Semua'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Semua Kegiatan P3M ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('Penelitian')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'Penelitian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Penelitian / Riset ({summary.totalPenelitian})</span>
          </button>

          <button
            onClick={() => setActiveTab('Pengabdian')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'Pengabdian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengabdian kepada Masyarakat ({summary.totalPengabdian})</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan judul, skema, bidang fokus, atau luaran..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Filter Tahun */}
            <div className="w-full sm:w-44">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
              >
                <option value="Semua">Semua Tahun</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="2024">Tahun 2024</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="w-full sm:w-52">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
              >
                <option value="Semua">Semua Status</option>
                <option value="Laporan Masuk">Laporan Masuk</option>
                <option value="Sedang Berjalan">Sedang Berjalan</option>
                <option value="Laporan Akhir">Laporan Akhir</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedYear !== 'Semua' || selectedStatus !== 'Semua') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedYear('Semua');
                setSelectedStatus('Semua');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Arsip & Laporan Tri Dharma (P3M)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekam jejak kegiatan penelitian dan pengabdian dosen untuk dokumentasi akreditasi dan borang institusi
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[280px]">Judul Kegiatan & Bidang Fokus</th>
                  <th className="py-3 px-4 text-center">Jenis</th>
                  <th className="py-3 px-4">Skema & Sumber Dana</th>
                  <th className="py-3 px-4 text-center">Tahun</th>
                  <th className="py-3 px-4 text-right">Dana Disetujui</th>
                  <th className="py-3 px-4 text-center">Status Laporan</th>
                  <th className="py-3 px-4 text-center min-w-[150px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-7 h-7 rounded-full border-2 border-slate-300 border-t-[#1E3A8A] animate-spin"></div>
                        <span className="text-xs font-semibold">Memuat data laporan P3M...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <FlaskConical className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm text-slate-700">
                        Tidak ada arsip kegiatan yang sesuai
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Silakan laporkan kegiatan baru atau sesuaikan filter pencarian.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group text-slate-800"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Judul & Fokus */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              Fokus: {item.focusArea}
                            </span>
                            <span>&bull;</span>
                            <span>Ketua: <strong>{item.leader}</strong></span>
                            {item.members.length > 0 && (
                              <>
                                <span>&bull;</span>
                                <span>{item.members.length} Anggota</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Jenis Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {item.type === 'Penelitian' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                            <FlaskConical className="w-3 h-3" />
                            <span>Penelitian</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Users className="w-3 h-3" />
                            <span>Pengabdian</span>
                          </span>
                        )}
                      </td>

                      {/* Skema & Sumber Dana */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 text-xs">{item.scheme}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.fundingSource}</p>
                      </td>

                      {/* Tahun */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.year}
                      </td>

                      {/* Dana Disetujui */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(item.fundingAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'Sedang Berjalan'
                              ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                              : item.status === 'Laporan Akhir'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status === 'Selesai' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : item.status === 'Sedang Berjalan' ? (
                            <Clock className="w-3 h-3 text-blue-500" />
                          ) : (
                            <FileText className="w-3 h-3 text-amber-500" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Modal */}
                          <button
                            onClick={() => setDetailItem(item)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Lihat Detail & Catatan Reviewer"
                          >
                            Rincian
                          </button>

                          {/* Edit Report */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Perbarui Data Laporan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Report */}
                          <button
                            onClick={() => handleDeleteReport(item)}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Usulan / Laporan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* MODAL 1: FORM USULAN / LAPORAN BARU & EDIT */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">
                      {editingItem ? 'Perbarui Laporan Kegiatan' : 'Formulir Pelaporan Kegiatan Penelitian & PkM'}
                    </h3>
                    <p className="text-xs text-blue-100">
                      Pencatatan & Arsip Portofolio Tri Dharma Dosen &bull; ITN
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmitReport} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Jenis Kegiatan (Penelitian vs Pengabdian) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jenis Kegiatan Tri Dharma <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.type === 'Penelitian'
                          ? 'border-[#1E3A8A] bg-blue-50/60 text-[#1E3A8A] font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={formData.type === 'Penelitian'}
                        onChange={() => setFormData({ ...formData, type: 'Penelitian' })}
                        className="text-[#1E3A8A]"
                      />
                      <FlaskConical className="w-4 h-4" />
                      <span>Penelitian (Riset Ilmiah)</span>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.type === 'Pengabdian'
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={formData.type === 'Pengabdian'}
                        onChange={() => setFormData({ ...formData, type: 'Pengabdian' })}
                        className="text-emerald-600"
                      />
                      <Users className="w-4 h-4" />
                      <span>Pengabdian Masyarakat (PkM)</span>
                    </label>
                  </div>
                </div>

                {/* Judul Kegiatan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Kegiatan / Laporan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Implementasi Artificial Intelligence untuk Optimasi Sistem Logistik..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                  />
                </div>

                {/* Skema Hibah & Bidang Fokus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Skema Hibah / Kegiatan
                    </label>
                    <select
                      value={formData.scheme}
                      onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                    >
                      {formData.type === 'Penelitian' ? (
                        <>
                          <option value="Penelitian Fundamental Internal ITN">
                            Penelitian Fundamental Internal ITN
                          </option>
                          <option value="Penelitian Terapan Kemendikbudristek (BIMA)">
                            Penelitian Terapan Kemendikbudristek (BIMA)
                          </option>
                          <option value="Penelitian Kolaborasi Kerjasama Industri">
                            Penelitian Kolaborasi Kerjasama Industri
                          </option>
                          <option value="Penelitian Mandiri Dosen">Penelitian Mandiri Dosen</option>
                        </>
                      ) : (
                        <>
                          <option value="Pengabdian Kemitraan Wilayah Berkelanjutan">
                            Pengabdian Kemitraan Wilayah Berkelanjutan
                          </option>
                          <option value="Penerapan Iptek bagi Masyarakat (PIM)">
                            Penerapan Iptek bagi Masyarakat (PIM)
                          </option>
                          <option value="Pemberdayaan Desa Binaan ITN">
                            Pemberdayaan Desa Binaan ITN
                          </option>
                          <option value="Pengabdian Tanggap Bencana & CSR">
                            Pengabdian Tanggap Bencana & CSR
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bidang Fokus / Keilmuan
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.focusArea}
                      onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                      placeholder="Contoh: Kecerdasan Buatan / Rekayasa Perangkat Lunak"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                </div>

                {/* Tahun, Dana, & Sumber Dana */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tahun Anggaran</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dana Disetujui (Rp)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500000}
                      placeholder="Contoh: 25000000"
                      value={formData.fundingAmount || ''}
                      onChange={(e) => setFormData({ ...formData, fundingAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber Pendanaan</label>
                    <select
                      value={formData.fundingSource}
                      onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                    >
                      <option value="DIPA Internal ITN">DIPA Internal ITN</option>
                      <option value="Kemendikbudristek / BIMA">Kemendikbudristek / BIMA</option>
                      <option value="Hibah Kolaborasi Riset Industri">Hibah Kolaborasi Riset Industri</option>
                      <option value="DIPA Internal ITN & CSR Mitra">DIPA Internal ITN & CSR Mitra</option>
                      <option value="Mandiri">Mandiri</option>
                    </select>
                  </div>
                </div>

                {/* Tim Peneliti / Pelaksana */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ketua Peneliti / Pelaksana
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.leader}
                      onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Anggota Tim (Pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      value={formData.membersText}
                      onChange={(e) => setFormData({ ...formData, membersText: e.target.value })}
                      placeholder="Contoh: Ir. Rahmat, M.T., Nadia Salsabila (Mhs)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                </div>

                {/* Target Luaran & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Luaran</label>
                    <input
                      type="text"
                      required
                      value={formData.targetOutput}
                      onChange={(e) => setFormData({ ...formData, targetOutput: e.target.value })}
                      placeholder="Contoh: Jurnal Terakreditasi SINTA 2 & Hak Cipta"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Pelaporan</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                    >
                      <option value="Laporan Masuk">Laporan Masuk</option>
                      <option value="Sedang Berjalan">Sedang Berjalan</option>
                      <option value="Laporan Kemajuan">Laporan Kemajuan</option>
                      <option value="Laporan Akhir">Laporan Akhir</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Tautan Berkas / Dokumen PDF */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tautan Dokumen Berkas Laporan (PDF)
                  </label>
                  <input
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    placeholder="https://siakad.itn.ac.id/dokumen/p3m/laporan.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-mono text-[11px]"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Menyimpan Laporan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{editingItem ? 'Simpan Perubahan Laporan' : 'Laporkan Kegiatan'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: RINCIAN DETAIL LAPORAN & CATATAN REVIEWER */}
        {detailItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    {detailItem.type === 'Penelitian' ? (
                      <FlaskConical className="w-5 h-5 text-[#D4A017]" />
                    ) : (
                      <Users className="w-5 h-5 text-[#D4A017]" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                      Rincian Laporan {detailItem.type}
                    </span>
                    <h3 className="font-extrabold text-base leading-tight">
                      Tahun Anggaran {detailItem.year}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Judul Kegiatan
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                    {detailItem.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Skema Kegiatan
                    </span>
                    <strong className="text-slate-800">{detailItem.scheme}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Bidang Fokus
                    </span>
                    <strong className="text-slate-800">{detailItem.focusArea}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Dana Disetujui
                    </span>
                    <strong className="text-emerald-700 text-sm">
                      {formatRupiah(detailItem.fundingAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Sumber Dana
                    </span>
                    <strong className="text-slate-800">{detailItem.fundingSource}</strong>
                  </div>
                </div>

                {/* Tim Pelaksana */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Tim Peneliti / Pelaksana
                  </span>
                  <p className="text-slate-800 font-bold">Ketua: {detailItem.leader}</p>
                  {detailItem.members.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[11px] text-slate-500 font-semibold block">Anggota:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 mt-0.5">
                        {detailItem.members.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Target Luaran */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                  <span className="text-[10px] text-[#1E3A8A] font-bold uppercase block">
                    Target Luaran Tri Dharma
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailItem.targetOutput}</p>
                </div>

                {/* Catatan Reviewer P3M */}
                {detailItem.reviewerNote && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Catatan Tim Reviewer P3M ITN</span>
                    </span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {detailItem.reviewerNote}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Diajukan: {detailItem.submittedAt} &bull; Diverifikasi:{' '}
                      {detailItem.verifiedAt || 'Menunggu Sidang Reviewer'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={detailItem.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen Berkas (PDF)</span>
                </a>

                <button
                  onClick={() => setDetailItem(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
