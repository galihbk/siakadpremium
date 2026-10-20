'use client';

import { pageWindow } from '@/lib/pageWindow';
import { confirmDialog } from '@/components/ui/ConfirmHost';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Printer,
  Download,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  IdCard,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export interface StudentItem {
  id: string;
  nim: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  studyProgram: string;
  faculty: string;
  entryYear: number;
  currentSemester: number;
  status: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT';
  ipk: number;
  sksTotal: number;
  dosenPA?: string;
  address?: string;
  studyProgramId?: string;
}

export default function SuperAdminMahasiswaPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ active: 0, leave: 0, graduated: 0, dropout: 0, all: 0, avgIpk: 0 });
  const [years, setYears] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterAngkatan, setFilterAngkatan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [studyPrograms, setStudyPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };
  const [loadingDb, setLoadingDb] = useState(false);

  // Urutan & halaman
  type SortField = 'nim' | 'fullName' | 'studyProgram' | 'entryYear' | 'status';
  const [sortField, setSortField] = useState<SortField>('nim');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Tunda pencarian 350 ms setelah berhenti mengetik agar tidak memanggil server di tiap huruf
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Setiap perubahan filter/urutan kembali ke halaman 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterProdi, filterAngkatan, filterStatus, sortField, sortOrder, itemsPerPage]);

  const requestSeq = useRef(0);

  const fetchDbStudents = async () => {
    const seq = ++requestSeq.current;
    setLoadingDb(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        sort: sortField,
        order: sortOrder,
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (filterProdi !== 'ALL') params.set('studyProgramId', filterProdi);
      if (filterAngkatan !== 'ALL') params.set('entryYear', filterAngkatan);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);

      const res = await fetch(`${getApiBaseUrl()}/students/list?${params.toString()}`);
      if (seq !== requestSeq.current) return; // ada permintaan yang lebih baru; abaikan hasil ini
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const d = json?.data ?? json;
      const mapped: StudentItem[] = (d.items || []).map((s: any) => ({
        id: s.id,
        studyProgramId: s.studyProgramId,
        nim: s.nim,
        fullName: s.name,
        email: s.email,
        phone: s.phone || '-',
        gender: (s.gender as 'MALE' | 'FEMALE') || 'MALE',
        studyProgram: s.studyProgram,
        faculty: s.faculty,
        entryYear: s.entryYear,
        currentSemester: s.currentSemester || 1,
        status: (s.status as 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT') || 'ACTIVE',
        ipk: s.ipk || 0,
        sksTotal: s.totalSks ?? 0,
        dosenPA: s.dosenPA || 'Belum ditentukan',
        address: s.address || '-',
      }));
      setStudents(mapped);
      setTotal(d.total ?? 0);
      if (d.stats) setStats(d.stats);
      if (Array.isArray(d.years)) setYears(d.years);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      console.warn('Gagal memuat mahasiswa dari DB:', e);
      showToast('Gagal memuat data mahasiswa dari server.', false);
    } finally {
      if (seq === requestSeq.current) setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearch, filterProdi, filterAngkatan, filterStatus, sortField, sortOrder]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/study-programs`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = json?.data ?? json;
        if (Array.isArray(list)) setStudyPrograms(list.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => undefined);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalItems = total;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const paginatedStudents = students;

  const BASE = '/admin/superadmin/mahasiswa';
  const openCreatePage = () => router.push(`${BASE}/baru`);
  const openStudentPage = (student: StudentItem) => router.push(`${BASE}/${student.id}`);

  const handleDeleteStudent = async (student: StudentItem) => {
    if (!(await confirmDialog(`Hapus data mahasiswa ${student.fullName} (${student.nim})?`))) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/${student.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Gagal menghapus mahasiswa.');
      showToast(`Mahasiswa ${student.fullName} berhasil dihapus.`);
      await fetchDbStudents();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus mahasiswa.', false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>;
      case 'LEAVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Cuti Kuliah</span>;
      case 'GRADUATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Lulus / Alumni</span>;
      case 'DROPOUT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Drop Out (DO)</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
      activeMenuHref="/admin/superadmin/mahasiswa"
    >
      <div className="w-full space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                PENGELOLAAN PENGGUNA & CIVITAS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Master Data Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pengelolaan biodata induk, status perkuliahan, registrasi program studi, dan riwayat akademik mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDbStudents}
              disabled={loadingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={openCreatePage}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Mahasiswa</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mahasiswa Aktif</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">
              {stats.active}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Terdaftar di semester ini</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuti Kuliah</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {stats.leave}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Dengan izin BAAK</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lulus / Alumni</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
              {stats.graduated}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Memiliki ijazah & transkrip</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata IPK</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats.avgIpk ? stats.avgIpk.toFixed(2) : '-'}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Skala predikat Unggul</span>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, email, atau program studi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Program Studi</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Angkatan</option>
              {years.map((y) => (
                  <option key={y} value={y}>
                    Angkatan {y}
                  </option>
                ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="LEAVE">Cuti</option>
              <option value="GRADUATED">Lulus</option>
              <option value="DROPOUT">Drop Out</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th
                    onClick={() => handleSort('nim')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>NIM</span>
                      {sortField === 'nim' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('fullName')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Nama Mahasiswa & Kontak</span>
                      {sortField === 'fullName' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('studyProgram')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Program Studi</span>
                      {sortField === 'studyProgram' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('entryYear')}
                    className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Angkatan / Smstr</span>
                      {sortField === 'entryYear' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">IPK / SKS</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-5 py-3.5 cursor-pointer hover:bg-slate-200/80 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      Tidak ditemukan mahasiswa dengan kriteria pencarian saat ini.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A8A] whitespace-nowrap">
                        {s.nim}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        <p className="text-[11px] text-slate-400">{s.email} &bull; {s.phone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{s.studyProgram}</p>
                        <p className="text-[10px] text-slate-400">{s.faculty}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-700 whitespace-nowrap">
                        {s.entryYear} / Smtr {s.currentSemester}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="font-bold text-emerald-700">{s.ipk.toFixed(2)}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({s.sksTotal} SKS)</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(s.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStudentPage(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100"
                            title="Detail Mahasiswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openStudentPage(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus"
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

          {/* Pagination Footer */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Menampilkan <strong className="text-slate-900">{startIndex}</strong> - <strong className="text-slate-900">{endIndex}</strong> dari <strong className="text-slate-900">{totalItems}</strong> mahasiswa
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                >
                  <option value={10}>10 baris</option>
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1">
                {pageWindow(currentPage, totalPages).map((pageNum) => pageNum < 0 ? (<span key={pageNum} className="px-1 text-slate-300 text-xs">…</span>) : (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#1E3A8A] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Detail Mahasiswa */}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-lg text-white ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}
        >
          {toast.text}
        </div>
      )}
    </PortalLayout>
  );
}
