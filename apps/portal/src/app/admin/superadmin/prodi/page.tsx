'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getAuthSession } from '@/lib/auth';
import {
  GraduationCap,
  Landmark,
  Users,
  UserCheck,
  Search,
  Plus,
  Download,
  ChevronRight,
  Edit3,
  Trash2,
  CheckCircle2,
  Award,
  Building2,
  X,
  BookOpen,
  Filter,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';

interface RemoteProdiItem {
  code: string;
  diktiCode?: string;
  name: string;
  degreeLevel?: string;
  facultyCode?: string;
  facultyName?: string;
  accreditation?: string;
}

interface StudyProgram {
  id: string;
  code: string;
  diktiCode: string;
  name: string;
  degreeLevel: 'S1' | 'D4' | 'D3' | 'S2';
  degreeTitle: string;
  facultyId: string;
  facultyCode: string;
  facultyName: string;
  headOfProgram: string;
  headNip: string;
  studentsCount: number;
  lecturersCount: number;
  accreditation: 'Unggul' | 'Baik Sekali' | 'Baik' | 'A' | 'B';
  accreditationAgency: string;
  skAkreditasi: string;
  status: 'Aktif' | 'Nonaktif';
}

function ProdiContent() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const searchParams = useSearchParams();
  const initialFacultyParam = searchParams.get('faculty');

  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState<string>(initialFacultyParam || 'Semua');
  const [degreeFilter, setDegreeFilter] = useState<string>('Semua');
  const [accreditationFilter, setAccreditationFilter] = useState<string>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyProgram | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/study-programs`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setPrograms(data);
        }
      } else {
        console.error('Gagal memuat program studi:', res.status);
      }
    } catch (err) {
      console.error('Koneksi ke sistem program studi terputus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (initialFacultyParam) {
      setFacultyFilter(initialFacultyParam);
    }
  }, [initialFacultyParam]);

  // Tarik & Sinkronkan Data Prodi dari Feeder
  const [isPullingProdi, setIsPullingProdi] = useState(false);
  const [isSyncingProdi, setIsSyncingProdi] = useState(false);
  const [prodiPullMessage, setProdiPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  // Prodi dari Feeder yang kodenya TIDAK ditemukan di data Program Studi lokal --
  // yang sudah ada otomatis ditandai sinkron tanpa perlu aksi apa pun.
  const [prodiPullItems, setProdiPullItems] = useState<RemoteProdiItem[]>([]);
  const [prodiMatchedCount, setProdiMatchedCount] = useState<number | null>(null);
  // PDDIKTI tidak punya entitas Fakultas sama sekali, jadi fakultas induk prodi baru
  // wajib dipilih manual di sini -- tidak pernah ditebak otomatis oleh sistem.
  const [facultiesList, setFacultiesList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [prodiFacultyChoice, setProdiFacultyChoice] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${apiBase}/faculties`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = Array.isArray(json) ? json : json?.data || [];
        setFacultiesList(list.map((f: any) => ({ id: f.id, code: f.code, name: f.name })));
      })
      .catch((err) => console.warn('Gagal memuat daftar fakultas:', err));
  }, []);

  // Handler: Tarik Data Prodi dari Feeder
  const handlePullProdi = async () => {
    setIsPullingProdi(true);
    setProdiPullMessage(null);
    setProdiPullItems([]);
    setProdiMatchedCount(null);
    setProdiFacultyChoice({});
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/prodi`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401 || res.status === 403) {
        setProdiPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini. Fitur ini khusus Super Admin.' });
        return;
      }
      const json = await res.json().catch(() => null);
      // Respons API dibungkus TransformInterceptor: { success, message, data: {...} }.
      // success/message di level atas itu status HTTP generik, BUKAN hasil tarikan data
      // Feeder sesungguhnya -- hasil aslinya ada di dalam `data`.
      const result = json?.data ?? json;
      if (!result) {
        setProdiPullMessage({ success: false, text: 'Gagal membaca respons server.' });
        return;
      }

      if (!result.success) {
        setProdiPullMessage({ success: false, text: result.message });
        return;
      }

      const items: RemoteProdiItem[] = Array.isArray(result.items) ? result.items : [];
      // Cocokkan ke kode ATAU kode DIKTI lokal -- jangan cuma kode internal, karena
      // admin bisa saja sudah mengganti "Kode Internal Prodi" jadi penomoran sendiri
      // (mis. "01", "04") yang beda dari kode_program_studi asli dari Feeder.
      const localCodes = new Set(
        programs.flatMap((p) => [p.code?.trim().toLowerCase(), p.diktiCode?.trim().toLowerCase()].filter(Boolean))
      );
      const unmatched = items.filter((i) => !localCodes.has(i.code.trim().toLowerCase()));
      const matchedCount = items.length - unmatched.length;

      setProdiMatchedCount(matchedCount);
      setProdiPullItems(unmatched);
      // Kalau cuma ada satu fakultas lokal, tidak ada ambiguitas -- isi otomatis.
      // Kalau lebih dari satu, admin wajib pilih sendiri per prodi (lihat komentar
      // di RemoteProdiItem: Feeder tidak pernah memberi tahu fakultas induknya).
      if (facultiesList.length === 1) {
        setProdiFacultyChoice(Object.fromEntries(unmatched.map((i) => [i.code, facultiesList[0].id])));
      }
      setProdiPullMessage({
        success: true,
        text:
          unmatched.length === 0
            ? `${items.length} program studi ditarik dari Feeder, semuanya sudah sinkron dengan data lokal.`
            : `${items.length} program studi ditarik dari Feeder: ${matchedCount} sudah sinkron, ${unmatched.length} belum ada di data lokal.`,
      });
    } catch (err) {
      setProdiPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingProdi(false);
    }
  };

  // Handler: Menambahkan Program Studi yang belum ada di lokal (hasil Pull yang tidak cocok)
  const handleSyncProdi = async () => {
    if (prodiPullItems.length === 0) return;
    const missingFaculty = prodiPullItems.some((i) => !prodiFacultyChoice[i.code]?.trim());
    if (missingFaculty) {
      showToast('Pilih fakultas untuk setiap program studi terlebih dahulu -- Feeder tidak mengirim data fakultas.');
      return;
    }
    setIsSyncingProdi(true);
    try {
      const { token } = getAuthSession();
      const items = prodiPullItems.map((i) => ({ ...i, facultyId: prodiFacultyChoice[i.code] }));
      const res = await fetch(`${apiBase}/integration-settings/pddikti/prodi/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);
      showToast(result?.message || 'Sinkronisasi prodi selesai.');
      setProdiPullItems([]);
      setProdiFacultyChoice({});
      loadPrograms();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan data prodi.');
    } finally {
      setIsSyncingProdi(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    diktiCode: string;
    name: string;
    degreeLevel: StudyProgram['degreeLevel'];
    degreeTitle: string;
    facultyId: string;
    studentsCount: number;
    lecturersCount: number;
    accreditation: StudyProgram['accreditation'];
    accreditationAgency: string;
    skAkreditasi: string;
  }>({
    code: '',
    diktiCode: '',
    name: '',
    degreeLevel: 'S1',
    degreeTitle: 'S.Kom.',
    facultyId: '',
    studentsCount: 100,
    lecturersCount: 10,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: '',
  });

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('name');
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

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.diktiCode || '').includes(searchQuery) ||
        (p.headOfProgram || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchFaculty = facultyFilter === 'Semua' || p.facultyCode === facultyFilter;
      const matchDegree = degreeFilter === 'Semua' || p.degreeLevel === degreeFilter;
      const matchAcc = accreditationFilter === 'Semua' || p.accreditation === accreditationFilter;

      return matchSearch && matchFaculty && matchDegree && matchAcc;
    });
  }, [programs, searchQuery, facultyFilter, degreeFilter, accreditationFilter]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, facultyFilter, degreeFilter, accreditationFilter]);

  const sortedPrograms = useMemo(() => {
    return [...filteredPrograms].sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredPrograms, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedPrograms.length / itemsPerPage));
  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPrograms.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPrograms, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const total = programs.length;
    const s1Count = programs.filter((p) => p.degreeLevel === 'S1').length;
    const vokasiCount = programs.filter((p) => p.degreeLevel === 'D4' || p.degreeLevel === 'D3').length;
    const unggulCount = programs.filter((p) => p.accreditation === 'Unggul').length;
    const totalMhs = programs.reduce((acc, p) => acc + (p.studentsCount || 0), 0);

    return { total, s1Count, vokasiCount, unggulCount, totalMhs };
  }, [programs]);

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormData({
      code: '',
      diktiCode: '',
      name: '',
      degreeLevel: 'S1',
      degreeTitle: 'S.Kom.',
      facultyId: facultiesList[0]?.id || '',
      studentsCount: 100,
      lecturersCount: 10,
      accreditation: 'Unggul',
      accreditationAgency: 'LAM-INFOKOM',
      skAkreditasi: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: StudyProgram) => {
    setEditingProgram(p);
    setFormData({
      code: p.code,
      diktiCode: p.diktiCode || '',
      name: p.name,
      degreeLevel: p.degreeLevel,
      degreeTitle: p.degreeTitle || '',
      facultyId: p.facultyId,
      studentsCount: p.studentsCount || 0,
      lecturersCount: p.lecturersCount || 0,
      accreditation: p.accreditation,
      accreditationAgency: p.accreditationAgency || '',
      skAkreditasi: p.skAkreditasi || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.facultyId) {
      alert('Mohon isi field wajib (termasuk Fakultas Induk)!');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      code: formData.code.toUpperCase(),
      diktiCode: formData.diktiCode || '00000',
      name: formData.name,
      degreeLevel: formData.degreeLevel,
      degreeTitle: formData.degreeTitle,
      facultyId: formData.facultyId,
      studentsCount: Number(formData.studentsCount) || 0,
      lecturersCount: Number(formData.lecturersCount) || 0,
      accreditation: formData.accreditation,
      accreditationAgency: formData.accreditationAgency || 'BAN-PT',
      skAkreditasi: formData.skAkreditasi || 'Dalam Proses',
      status: 'Aktif',
    };

    try {
      if (editingProgram) {
        const res = await fetch(`${apiBase}/study-programs/${editingProgram.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Program Studi "${formData.name}" berhasil diperbarui!`);
          await loadPrograms();
          setIsAddModalOpen(false);
        } else {
          showToast('Gagal memperbarui program studi.');
        }
      } else {
        const res = await fetch(`${apiBase}/study-programs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Program Studi "${formData.name}" berhasil ditambahkan!`);
          await loadPrograms();
          setIsAddModalOpen(false);
        } else {
          showToast('Gagal menambahkan program studi baru.');
        }
      }
    } catch {
      showToast('Terjadi gangguan koneksi saat menyimpan data program studi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus Program Studi "${name}"?`)) {
      try {
        const res = await fetch(`${apiBase}/study-programs/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          showToast(`Program Studi "${name}" berhasil dihapus.`);
          await loadPrograms();
        } else {
          showToast('Gagal menghapus program studi.');
        }
      } catch {
        showToast('Terjadi gangguan koneksi saat menghapus program studi.');
      }
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="w-full space-y-6">
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
              <span className="text-[#1E3A8A] font-bold">Program Studi</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Program Studi (Prodi)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Daftar seluruh program studi S1, D4, dan D3 terakreditasi Institut Teknologi Nusantara.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => showToast('Data program studi berhasil diekspor (Excel/CSV)')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Program Studi</span>
            </button>
          </div>
        </div>

        {/* Card: Tarik Data Program Studi dari PDDIKTI (Neo Feeder) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 text-sm">Sinkronisasi Program Studi dari Web Service Neo Feeder PDDIKTI</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Ambil daftar prodi resmi dari Feeder, lalu cocokkan dengan Program Studi lokal. Prodi yang belum ada lokal akan ditambahkan ke master data ini setelah fakultas induknya dipilih.
                </p>
              </div>
            </div>
            <button
              onClick={handlePullProdi}
              disabled={isPullingProdi}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isPullingProdi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
              <span>{isPullingProdi ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
          </div>

          {prodiPullMessage && (
            <div
              className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                prodiPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {prodiPullMessage.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              )}
              <span>{prodiPullMessage.text}</span>
            </div>
          )}

          {prodiPullItems.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Program Studi Belum Ada di Lokal</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {prodiPullItems.length} prodi ditemukan di Feeder tapi kodenya tidak cocok dengan data Program Studi lokal mana pun.
                  Pilih fakultas induknya terlebih dahulu -- Feeder tidak mengirim data fakultas.
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Prodi</th>
                      <th className="py-2.5 px-3">Jenjang</th>
                      <th className="py-2.5 px-3">Fakultas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prodiPullItems.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.code}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.degreeLevel || '-'}</td>
                        <td className="py-2 px-3">
                          <select
                            value={prodiFacultyChoice[item.code] || ''}
                            onChange={(e) => setProdiFacultyChoice((prev) => ({ ...prev, [item.code]: e.target.value }))}
                            className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                              prodiFacultyChoice[item.code] ? 'border-slate-200' : 'border-amber-300'
                            }`}
                          >
                            <option value="">Pilih fakultas...</option>
                            {facultiesList.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSyncProdi}
                  disabled={isSyncingProdi}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSyncingProdi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSyncingProdi ? 'Menambahkan...' : `Tambahkan ${prodiPullItems.length} Prodi ke Lokal`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Program Studi</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Program studi aktif</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenjang Sarjana (S1)</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.s1Count} Prodi</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Pendidikan akademik S1</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenjang Vokasi (D4/D3)</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">{metrics.vokasiCount} Prodi</h3>
              <p className="text-xs text-purple-600 font-medium mt-0.5">Pendidikan terapan & profesi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akreditasi Unggul</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.unggulCount} Prodi</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Standar mutu tertinggi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama prodi, kode DIKTI, atau nama kaprodi..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Fakultas */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Fakultas</option>
              {facultiesList.map((f) => (
                <option key={f.id} value={f.code}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>

            {/* Filter Jenjang */}
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Jenjang</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="D4">Sarjana Terapan (D4)</option>
              <option value="D3">Diploma Tiga (D3)</option>
            </select>

            {/* Filter Akreditasi */}
            <select
              value={accreditationFilter}
              onChange={(e) => setAccreditationFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Akreditasi</option>
              <option value="Unggul">Unggul</option>
              <option value="Baik Sekali">Baik Sekali</option>
              <option value="Baik">Baik</option>
              <option value="A">A (Legacy)</option>
              <option value="B">B (Legacy)</option>
            </select>

            {(facultyFilter !== 'Semua' || degreeFilter !== 'Semua' || accreditationFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setFacultyFilter('Semua');
                  setDegreeFilter('Semua');
                  setAccreditationFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table of Study Programs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Nama / Jenjang */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan nama prodi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program Studi & Jenjang</span>
                      {sortField === 'name' ? (
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

                  {/* Sort: Fakultas */}
                  <th
                    onClick={() => handleSort('facultyCode')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan fakultas"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fakultas</span>
                      {sortField === 'facultyCode' ? (
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

                  {/* Sort: Kaprodi */}
                  <th
                    onClick={() => handleSort('headOfProgram')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kaprodi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ketua Program Studi (Kaprodi)</span>
                      {sortField === 'headOfProgram' ? (
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

                  {/* Sort: Gelar */}
                  <th
                    onClick={() => handleSort('degreeTitle')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan gelar"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Gelar</span>
                      {sortField === 'degreeTitle' ? (
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

                  {/* Sort: Mahasiswa */}
                  <th
                    onClick={() => handleSort('studentsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan jumlah mahasiswa"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Mahasiswa</span>
                      {sortField === 'studentsCount' ? (
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

                  {/* Sort: Dosen */}
                  <th
                    onClick={() => handleSort('lecturersCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan jumlah dosen"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Dosen</span>
                      {sortField === 'lecturersCount' ? (
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

                  {/* Sort: Akreditasi */}
                  <th
                    onClick={() => handleSort('accreditation')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan akreditasi"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Akreditasi</span>
                      {sortField === 'accreditation' ? (
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
                    <td colSpan={8} className="text-center py-16 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
                        <p className="font-semibold text-sm text-slate-700">Memuat data program studi...</p>
                        <p className="text-xs text-slate-400">Sinkronisasi data master akademik prodi & akreditasi</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada program studi yang cocok</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan filter fakultas atau jenjang</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              prog.degreeLevel === 'S1'
                                ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                                : prog.degreeLevel === 'D4'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {prog.degreeLevel}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{prog.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                Kode: {prog.diktiCode}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">({prog.code})</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/superadmin/fakultas`}
                          className="font-bold text-[#1E3A8A] hover:underline"
                        >
                          {prog.facultyCode}
                        </Link>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{prog.facultyName}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{prog.headOfProgram}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP: {prog.headNip}</p>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-700 font-mono">
                        {prog.degreeTitle}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-[#1E3A8A]">
                        {prog.studentsCount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {prog.lecturersCount}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prog.accreditation === 'Unggul'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-[#1E3A8A] border border-blue-200'
                            }`}
                          >
                            {prog.accreditation}
                          </span>
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">
                            {prog.accreditationAgency}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(prog)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Program Studi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prog.id, prog.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Program Studi"
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
                <option value={18}>Semua (18)</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredPrograms.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredPrograms.length)} dari {filteredPrograms.length} data
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

        {/* Modal: Tambah / Edit Program Studi */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingProgram ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
          subtitle="Master data program studi akademik Institut Teknologi Nusantara"
          icon={<GraduationCap className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Fakultas Induk *</label>
                    <select
                      value={formData.facultyId}
                      onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="">Pilih fakultas...</option>
                      {facultiesList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Program Studi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Teknik Informatika"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenjang Pendidikan *</label>
                    <select
                      value={formData.degreeLevel}
                      onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="S1">Sarjana (S1)</option>
                      <option value="D4">Sarjana Terapan (D4)</option>
                      <option value="D3">Diploma Tiga (D3)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Gelar Kelulusan *</label>
                    <input
                      type="text"
                      required
                      placeholder="S.Kom., S.T., S.M., S.Tr.Kom."
                      value={formData.degreeTitle}
                      onChange={(e) => setFormData({ ...formData, degreeTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode DIKTI</label>
                    <input
                      type="text"
                      placeholder="Contoh: 55201"
                      value={formData.diktiCode}
                      onChange={(e) => setFormData({ ...formData, diktiCode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode Internal Prodi</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: TI-S1"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] uppercase font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Peringkat Akreditasi</label>
                    <select
                      value={formData.accreditation}
                      onChange={(e) => setFormData({ ...formData, accreditation: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="Unggul">Unggul</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="Baik">Baik</option>
                      <option value="A">A (Legacy)</option>
                      <option value="B">B (Legacy)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Lembaga Akreditasi</label>
                    <input
                      type="text"
                      placeholder="LAM-INFOKOM / LAM-TEKNIK / BAN-PT"
                      value={formData.accreditationAgency}
                      onChange={(e) => setFormData({ ...formData, accreditationAgency: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingProgram ? 'Simpan Perubahan' : 'Tambah Program Studi'}</span>
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}

export default function SuperAdminProdiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading data program studi...</div>}>
      <ProdiContent />
    </Suspense>
  );
}
