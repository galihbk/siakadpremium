'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  X,
  CreditCard,
  FileText,
  Award,
  BookOpen,
  Users,
  Flag,
  Loader2,
} from 'lucide-react';

interface CalendarEventItem {
  id: string;
  title: string;
  category: 'Keuangan & UKT' | 'KRS & Registrasi' | 'Perkuliahan' | 'Ujian (UTS/UAS)' | 'Nilai & Yudisium' | 'Libur Kampus';
  startDate: string;
  endDate: string;
  academicYear: string;
  semester: 'Gasal' | 'Genap' | 'Pendek';
  target: string;
  status: 'Berlangsung' | 'Akan Datang' | 'Selesai';
  notes: string;
}

export default function SuperAdminKalenderPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterTab, setSemesterTab] = useState<'Gasal' | 'Genap' | 'Pendek'>('Gasal');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    category: CalendarEventItem['category'];
    startDate: string;
    endDate: string;
    academicYear: string;
    semester: CalendarEventItem['semester'];
    target: string;
    status: CalendarEventItem['status'];
    notes: string;
  }>({
    title: '',
    category: 'Perkuliahan',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    academicYear: '2026/2027',
    semester: 'Gasal',
    target: 'Seluruh Mahasiswa & Dosen',
    status: 'Akan Datang',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Muat agenda kalender akademik dari sistem
  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/calendar-events`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setEvents(data);
        }
      } else {
        console.error('Gagal memuat agenda kalender:', res.status);
      }
    } catch (err) {
      console.error('Koneksi ke kalender akademik terputus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, semesterTab, categoryFilter, statusFilter]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.target || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchSemester = e.semester === semesterTab;
      const matchCategory = categoryFilter === 'Semua' || e.category === categoryFilter;
      const matchStatus = statusFilter === 'Semua' || e.status === statusFilter;

      return matchSearch && matchSemester && matchCategory && matchStatus;
    });
  }, [events, searchQuery, semesterTab, categoryFilter, statusFilter]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aVal: any = (a as any)[sortField];
      const bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [filteredEvents, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / itemsPerPage));
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEvents, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const totalAgenda = events.length;
    const runningAgenda = events.filter((e) => e.status === 'Berlangsung').length;
    const upcomingAgenda = events.filter((e) => e.status === 'Akan Datang').length;
    const completedAgenda = events.filter((e) => e.status === 'Selesai').length;
    return { totalAgenda, runningAgenda, upcomingAgenda, completedAgenda };
  }, [events]);

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      category: 'Perkuliahan',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      academicYear: '2026/2027',
      semester: semesterTab,
      target: 'Seluruh Mahasiswa & Dosen',
      status: 'Akan Datang',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: CalendarEventItem) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate,
      academicYear: ev.academicYear,
      semester: ev.semester,
      target: ev.target,
      status: ev.status,
      notes: ev.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEvent) {
        const res = await fetch(`${apiBase}/academic/calendar-events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast(`Agenda "${formData.title}" berhasil diperbarui.`);
          await loadCalendarEvents();
          setIsModalOpen(false);
        } else {
          showToast('Gagal memperbarui agenda kalender. Silakan periksa kembali formulir.');
        }
      } else {
        const res = await fetch(`${apiBase}/academic/calendar-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast(`Agenda baru "${formData.title}" berhasil ditambahkan.`);
          await loadCalendarEvents();
          setIsModalOpen(false);
        } else {
          showToast('Gagal menambahkan agenda baru. Silakan periksa kembali formulir.');
        }
      }
    } catch {
      showToast('Terjadi gangguan koneksi saat menyimpan agenda kalender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Hapus agenda "${title}" dari kalender akademik?`)) {
      try {
        const res = await fetch(`${apiBase}/academic/calendar-events/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          showToast(`Agenda "${title}" berhasil dihapus.`);
          await loadCalendarEvents();
        } else {
          showToast('Gagal menghapus agenda kalender.');
        }
      } catch {
        showToast('Terjadi gangguan koneksi saat menghapus agenda.');
      }
    }
  };

  const milestones = [
    { title: 'Pembayaran UKT', date: '1 - 20 Agt 2026', status: 'Selesai', color: 'bg-emerald-500' },
    { title: 'Pengisian KRS', date: '15 - 31 Agt 2026', status: 'Selesai', color: 'bg-emerald-500' },
    { title: 'Perkuliahan Bag. I', date: '1 Sep - 23 Okt 2026', status: 'Aktif', color: 'bg-[#1E3A8A] ring-4 ring-blue-100' },
    { title: 'Ujian Tengah (UTS)', date: '26 Okt - 6 Nov 2026', status: 'Akan Datang', color: 'bg-slate-300' },
    { title: 'Perkuliahan Bag. II', date: '9 Nov - 24 Des 2026', status: 'Akan Datang', color: 'bg-slate-300' },
    { title: 'Ujian Akhir (UAS)', date: '4 - 16 Jan 2027', status: 'Akan Datang', color: 'bg-slate-300' },
    { title: 'Yudisium & Wisuda', date: 'Februari 2027', status: 'Akan Datang', color: 'bg-slate-300' },
  ];

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Master Data</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Kalender Akademik</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-7 h-7 text-[#1E3A8A]" />
              <span>Kalender Akademik ITN</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Jadwal resmi semester Gasal, Genap, masa perkuliahan, evaluasi UTS/UAS, dan yudisium kampus.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => showToast('Kalender akademik berhasil diekspor (PDF/iCal)')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export iCal / PDF</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Agenda Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Akademik Aktif</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">2026/2027 Gasal</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Semester Sedang Berjalan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agenda Berjalan</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.runningAgenda} Agenda</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Kuliah Bag. I & KPRS Online</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agenda Akan Datang</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.upcomingAgenda} Agenda</h3>
              <p className="text-xs text-slate-500 mt-0.5">UTS & UAS Semester Gasal</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agenda Selesai</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.completedAgenda} Agenda</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">UKT & KRS telah tuntas 100%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Visual Timeline Milestone Semester */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#1E3A8A]" />
                Alur Tahapan Semester Gasal 2026/2027
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Progres siklus akademik semester berjalan dari pembayaran registrasi hingga yudisium kelulusan
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Minggu Ke-2 Perkuliahan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  m.status === 'Aktif'
                    ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                    : m.status === 'Selesai'
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-white border-slate-100 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">Step 0{idx + 1}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${m.color}`}></div>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{m.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.date}</p>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-2.5 ${
                    m.status === 'Aktif'
                      ? 'bg-[#1E3A8A] text-white'
                      : m.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Selector Semester & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Semester Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSemesterTab('Gasal')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                semesterTab === 'Gasal'
                  ? 'bg-white text-[#1E3A8A] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semester Gasal (Aktif)
            </button>
            <button
              onClick={() => setSemesterTab('Genap')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                semesterTab === 'Genap'
                  ? 'bg-white text-[#1E3A8A] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semester Genap
            </button>
            <button
              onClick={() => setSemesterTab('Pendek')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                semesterTab === 'Pendek'
                  ? 'bg-white text-[#1E3A8A] font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semester Antara / Pendek
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama agenda atau peserta..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Kategori */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Keuangan & UKT">Keuangan & UKT</option>
              <option value="KRS & Registrasi">KRS & Registrasi</option>
              <option value="Perkuliahan">Perkuliahan</option>
              <option value="Ujian (UTS/UAS)">Ujian (UTS/UAS)</option>
              <option value="Nilai & Yudisium">Nilai & Yudisium</option>
              <option value="Libur Kampus">Libur Kampus</option>
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Selesai">Selesai</option>
            </select>

            {(searchQuery || categoryFilter !== 'Semua' || statusFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-1.5"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Kalender Akademik */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Agenda */}
                  <th
                    onClick={() => handleSort('title')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan nama agenda"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Agenda & Kegiatan Akademik</span>
                      {sortField === 'title' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Kategori */}
                  <th
                    onClick={() => handleSort('category')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kategori"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      {sortField === 'category' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Tanggal Mulai */}
                  <th
                    onClick={() => handleSort('startDate')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tanggal pelaksanaan"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Periode Pelaksanaan</span>
                      {sortField === 'startDate' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Sasaran Peserta */}
                  <th
                    onClick={() => handleSort('target')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan sasaran peserta"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Sasaran Peserta</span>
                      {sortField === 'target' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan status agenda"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-2" />
                      <p className="font-semibold text-sm text-slate-700">Memuat agenda kalender akademik...</p>
                      <p className="text-xs text-slate-400 mt-0.5">Mengambil jadwal dan kegiatan resmi dari sistem</p>
                    </td>
                  </tr>
                ) : paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada agenda akademik ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm leading-snug">{ev.title}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ev.notes}</p>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.category === 'Keuangan & UKT'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : ev.category === 'KRS & Registrasi'
                                ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                                : ev.category === 'Perkuliahan'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : ev.category === 'Ujian (UTS/UAS)'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : ev.category === 'Nilai & Yudisium'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ev.category}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {ev.startDate} <span className="text-slate-400 font-normal">s/d</span> {ev.endDate}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-slate-700">{ev.target}</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.status === 'Berlangsung'
                              ? 'bg-blue-100 text-[#1E3A8A]'
                              : ev.status === 'Akan Datang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.status === 'Berlangsung'
                                ? 'bg-[#1E3A8A] animate-pulse'
                                : ev.status === 'Akan Datang'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                          ></span>
                          {ev.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Agenda"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id, ev.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Agenda"
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

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>Semua (20)</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredEvents.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredEvents.length)} dari {filteredEvents.length} agenda
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Tambah / Edit Agenda */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEvent ? 'Edit Agenda Akademik' : 'Tambah Agenda Akademik Baru'}
          subtitle="Jadwal operasional Institut Teknologi Nusantara"
          icon={<CalendarDays className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kegiatan / Agenda <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ujian Tengah Semester (UTS) Gasal 2026/2027"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Agenda</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as CalendarEventItem['category'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Keuangan & UKT">Keuangan & UKT</option>
                      <option value="KRS & Registrasi">KRS & Registrasi</option>
                      <option value="Perkuliahan">Perkuliahan</option>
                      <option value="Ujian (UTS/UAS)">Ujian (UTS/UAS)</option>
                      <option value="Nilai & Yudisium">Nilai & Yudisium</option>
                      <option value="Libur Kampus">Libur Kampus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          semester: e.target.value as CalendarEventItem['semester'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Gasal">Semester Gasal</option>
                      <option value="Genap">Semester Genap</option>
                      <option value="Pendek">Semester Pendek</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sasaran Peserta</label>
                    <input
                      type="text"
                      placeholder="e.g. Mahasiswa & Dosen Pengampu"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Agenda</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as CalendarEventItem['status'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Berlangsung">Berlangsung</option>
                      <option value="Akan Datang">Akan Datang</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan Teknis</label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi operasional kegiatan akademik..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {isSubmitting
                        ? 'Menyimpan...'
                        : editingEvent
                        ? 'Simpan Perubahan'
                        : 'Tambah Agenda'}
                    </span>
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
