'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  Loader2,
} from 'lucide-react';

export interface KrsCourseRow {
  code: string;
  name: string;
  sks: number;
  classRoom: string;
  schedule: string;
  lecturer: string;
}

export interface KrsRecord {
  id: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  semester: number;
  academicYear: string;
  totalSks: number;
  status: 'APPROVED' | 'SUBMITTED' | 'DRAFT' | 'REJECTED';
  dosenPA: string;
  submittedAt: string;
  courses: KrsCourseRow[];
}

export default function AdminKrsPage() {
  const [krsList, setKrsList] = useState<KrsRecord[]>([]);
  const [academicYearName, setAcademicYearName] = useState<string | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [academicYears, setAcademicYears] = useState<{ id: string; code: string; name: string; semesterLabel: string; isActive: boolean }[]>([]);
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [selectedKrs, setSelectedKrs] = useState<KrsRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [krsStatus, setKrsStatus] = useState<{
    academicYearId: string;
    isKrsOpen: boolean;
    academicYearName: string;
    krsStartDate: string | null;
    krsEndDate: string | null;
  } | null>(null);
  const [krsStatusLoading, setKrsStatusLoading] = useState(false);
  const [isKrsWindowModalOpen, setIsKrsWindowModalOpen] = useState(false);
  const [krsWindowStart, setKrsWindowStart] = useState('');
  const [krsWindowEnd, setKrsWindowEnd] = useState('');
  const [isSavingKrsWindow, setIsSavingKrsWindow] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchKrsStatus = async () => {
    setKrsStatusLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/krs-status`);
      if (res.ok) {
        const json = await res.json();
        setKrsStatus(json.data ?? json);
      }
    } catch (e) {
      console.warn('Gagal memuat status KRS:', e);
    } finally {
      setKrsStatusLoading(false);
    }
  };

  const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

  const handleOpenKrsWindowModal = () => {
    setKrsWindowStart(toDateInput(krsStatus?.krsStartDate));
    setKrsWindowEnd(toDateInput(krsStatus?.krsEndDate));
    setIsKrsWindowModalOpen(true);
  };

  const handleSaveKrsWindow = async () => {
    if (!krsStatus?.academicYearId) return;
    setIsSavingKrsWindow(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/years/${krsStatus.academicYearId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          krsStartDate: krsWindowStart || null,
          krsEndDate: krsWindowEnd || null,
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan jendela tanggal periode KRS.');
      showToast('Jendela tanggal periode KRS berhasil disimpan.');
      setIsKrsWindowModalOpen(false);
      await fetchKrsStatus();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menyimpan jendela tanggal periode KRS.');
    } finally {
      setIsSavingKrsWindow(false);
    }
  };

  const fetchKrsOverview = useCallback(async () => {
    setLoadingDb(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filterAcademicYearId) params.set('academicYearId', filterAcademicYearId);
      const res = await fetch(`${getApiBaseUrl()}/academic/krs-overview?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setKrsList(json.data?.items ?? []);
      setAcademicYearName(json.data?.academicYearName ?? null);
      setLoadError(false);
    } catch (e) {
      console.error('Gagal memuat KRS dari database:', e);
      setLoadError(true);
    } finally {
      setLoadingDb(false);
    }
  }, [filterStatus, searchQuery, filterAcademicYearId]);

  useEffect(() => {
    fetchKrsStatus();
  }, []);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/academic/years`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (!Array.isArray(result)) return;
        setAcademicYears(result);
        const active = result.find((y: { isActive: boolean }) => y.isActive);
        if (active) setFilterAcademicYearId(active.id);
      })
      .catch((e) => console.warn('Gagal memuat daftar tahun akademik:', e));
  }, []);

  useEffect(() => {
    fetchKrsOverview();
  }, [fetchKrsOverview]);

  const filteredKrs = useMemo(() => {
    return krsList.filter((k) => {
      if (filterProdi !== 'ALL' && k.studyProgram !== filterProdi) return false;
      return true;
    });
  }, [krsList, filterProdi]);

  const prodiOptions = useMemo(() => Array.from(new Set(krsList.map((k) => k.studyProgram))).sort(), [krsList]);

  const activeAcademicYear = academicYears.find((y) => y.isActive);
  const activeFilterCount =
    (filterProdi !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (activeAcademicYear && filterAcademicYearId !== activeAcademicYear.id ? 1 : 0);
  const resetFilters = () => {
    setFilterProdi('ALL');
    setFilterStatus('ALL');
    if (activeAcademicYear) setFilterAcademicYearId(activeAcademicYear.id);
  };

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<KrsRecord>(filteredKrs, 'studentName');

  const handleUpdateKrsStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/krs-overview/${id}/${newStatus === 'APPROVED' ? 'approve' : 'reject'}`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast(json?.message || 'Status KRS berhasil diperbarui.');
      setDetailModalOpen(false);
      setSelectedKrs(null);
      await fetchKrsOverview();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui status KRS.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Disetujui Dosen PA</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <X className="w-3 h-3 text-rose-600" />
            <span>Ditolak / Revisi</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Draft Mahasiswa
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const avgSks = krsList.length > 0 ? krsList.reduce((acc, curr) => acc + curr.totalSks, 0) / krsList.length : 0;

  return (
    <PortalLayout role="admin" userName="" userIdText="" activeMenuHref="/admin/krs">
      <div className="w-full space-y-6">

        {toast && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <span>{toast}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                PEMANTAUAN AKADEMIK & STUDI
              </span>
              {academicYearName && <span className="text-xs text-slate-400 font-medium">&bull; {academicYearName}</span>}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kartu Rencana Studi (KRS) Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monitoring pengambilan SKS lintas program studi dan pengambilalihan persetujuan bila diperlukan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchKrsOverview}
              disabled={loadingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap KRS</span>
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3 flex items-center justify-between">
            <span>Gagal memuat data KRS dari server.</span>
            <button onClick={fetchKrsOverview} className="font-bold underline cursor-pointer">Coba lagi</button>
          </div>
        )}

        {/* Jendela Tanggal Periode KRS */}
        <div
          className={`rounded-2xl border shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            krsStatus?.isKrsOpen === false
              ? 'bg-rose-50/60 border-rose-200'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                krsStatus?.isKrsOpen === false ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {krsStatus?.isKrsOpen === false ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                Status Periode KRS:{' '}
                {krsStatusLoading
                  ? 'Memuat...'
                  : krsStatus?.isKrsOpen === false
                  ? 'DITUTUP'
                  : krsStatus?.isKrsOpen === true
                  ? 'DIBUKA'
                  : '-'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {krsStatus?.academicYearName ? `Tahun akademik ${krsStatus.academicYearName}. ` : ''}
                {krsStatus?.krsStartDate && krsStatus?.krsEndDate ? (
                  <>
                    Jendela:{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(krsStatus.krsStartDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} &ndash;{' '}
                      {new Date(krsStatus.krsEndDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </>
                ) : (
                  'Belum ada jendela tanggal diatur -- periode selalu terbuka selama tahun akademik aktif.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenKrsWindowModal}
            disabled={krsStatusLoading || !krsStatus}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Atur Periode KRS</span>
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total KRS Diajukan</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">{krsList.length}</p>
            <span className="text-[11px] text-slate-500 font-medium">Mahasiswa aktif</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disetujui Dosen PA</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
              {krsList.filter((k) => k.status === 'APPROVED').length}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold">Sesuai data bimbingan</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Review</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">
              {krsList.filter((k) => k.status === 'SUBMITTED').length}
            </p>
            <span className="text-[11px] text-amber-700 font-semibold">Perlu tindakan PA</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata SKS</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{avgSks.toFixed(1)}</p>
            <span className="text-[11px] text-blue-600 font-semibold">SKS per mahasiswa</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mahasiswa, NIM, atau Dosen Pembimbing Akademik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <SortableTh<KrsRecord> label="NIM / Mahasiswa" column="studentName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-5 py-3.5" />
                  <SortableTh<KrsRecord> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-5 py-3.5" />
                  <SortableTh<KrsRecord> label="Semester" column="semester" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="px-5 py-3.5" />
                  <SortableTh<KrsRecord> label="Beban SKS" column="totalSks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="px-5 py-3.5" />
                  <th className="px-5 py-3.5">Dosen Pembimbing PA</th>
                  <th className="px-5 py-3.5">Status KRS</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDb ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">Memuat data KRS...</td>
                  </tr>
                ) : filteredKrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      {krsList.length === 0
                        ? 'Belum ada mahasiswa yang mengajukan KRS pada tahun akademik aktif.'
                        : 'Tidak ditemukan data KRS dengan kriteria pencarian saat ini.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{k.studentName}</p>
                        <p className="text-[11px] font-mono text-[#1E3A8A] font-semibold">{k.nim}</p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {k.studyProgram}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                        Smtr {k.semester}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-extrabold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {k.totalSks} SKS
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {k.dosenPA}
                      </td>
                      <td className="px-5 py-3.5">
                        {renderStatusBadge(k.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedKrs(k);
                            setDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-slate-700 font-bold text-xs transition-colors"
                        >
                          Lihat Mata Kuliah
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredKrs.length} pageSize={pageSize} itemLabel="KRS" />
        </div>

        {/* Modal Filter */}
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter KRS Mahasiswa"
          icon={<SlidersHorizontal className="w-5 h-5" />}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Akademik</label>
              <SearchableSelect
                value={filterAcademicYearId}
                onChange={setFilterAcademicYearId}
                placeholder="Pilih tahun akademik..."
                searchPlaceholder="Cari tahun akademik..."
                options={academicYears.map((y) => ({
                  value: y.id,
                  label: `${y.name} ${y.semesterLabel}${y.isActive ? ' (Aktif)' : ''}`,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
              <SearchableSelect
                value={filterProdi}
                onChange={setFilterProdi}
                placeholder="Semua Program Studi"
                searchPlaceholder="Cari program studi..."
                options={[{ value: 'ALL', label: 'Semua Program Studi' }, ...prodiOptions.map((p) => ({ value: p, label: p }))]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Persetujuan</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
              >
                <option value="ALL">Semua Status Persetujuan</option>
                <option value="APPROVED">Disetujui Dosen PA</option>
                <option value="SUBMITTED">Menunggu Persetujuan</option>
                <option value="REJECTED">Ditolak / Perlu Revisi</option>
                <option value="DRAFT">Draft Mahasiswa</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 transition-colors cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal Detail Mata Kuliah KRS */}
        {selectedKrs && (
          <Modal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            maxWidth="2xl"
            title={
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                  KARTU RENCANA STUDI (KRS) &bull; {selectedKrs.academicYear}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{selectedKrs.studentName}</h3>
                <p className="text-xs font-mono text-[#1E3A8A] font-bold">
                  NIM: {selectedKrs.nim} &bull; {selectedKrs.studyProgram}
                </p>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400">Dosen Pembimbing PA:</span>
                  <p className="font-bold text-slate-800">{selectedKrs.dosenPA}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400">Total SKS Diambil:</span>
                  <p className="font-extrabold text-[#1E3A8A] text-sm">{selectedKrs.totalSks} SKS</p>
                </div>
              </div>

              {/* Course List Table -- overflow-x-auto supaya di layar sempit/mobile kolomnya scroll ke samping, bukan ketekan/rusak */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Kode</th>
                      <th className="p-2.5">Mata Kuliah</th>
                      <th className="p-2.5 text-center">SKS</th>
                      <th className="p-2.5">Jadwal & Ruang</th>
                      <th className="p-2.5">Dosen Pengajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedKrs.courses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#1E3A8A]">{c.code}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{c.sks}</td>
                        <td className="p-2.5 text-slate-600">
                          <p>{c.schedule}</p>
                          <p className="text-[10px] text-slate-400">{c.classRoom}</p>
                        </td>
                        <td className="p-2.5 text-slate-700">{c.lecturer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status Validasi:</span>
                  {renderStatusBadge(selectedKrs.status)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedKrs.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateKrsStatus(selectedKrs.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      {actionLoading ? 'Memproses...' : 'Setujui KRS Mahasiswa'}
                    </button>
                  )}
                  {selectedKrs.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleUpdateKrsStatus(selectedKrs.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all border border-rose-200 disabled:opacity-50"
                    >
                      Tolak / Minta Revisi
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL JENDELA TANGGAL PERIODE KRS */}
        <Modal
          isOpen={isKrsWindowModalOpen}
          onClose={() => setIsKrsWindowModalOpen(false)}
          title="Jendela Waktu Periode KRS"
          subtitle={krsStatus?.academicYearName ? `Berlaku untuk tahun akademik ${krsStatus.academicYearName}` : undefined}
          icon={<Calendar className="w-5 h-5" />}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Periode KRS</label>
                <input
                  type="date"
                  value={krsWindowStart}
                  onChange={(e) => setKrsWindowStart(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Akhir Periode KRS</label>
                <input
                  type="date"
                  value={krsWindowEnd}
                  onChange={(e) => setKrsWindowEnd(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Di luar rentang tanggal ini, mahasiswa otomatis tidak bisa mengajukan/mengubah KRS. Kosongkan keduanya untuk membiarkan
              periode selalu terbuka (tidak ada batasan tanggal) selama tahun akademik ini aktif.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsKrsWindowModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveKrsWindow}
                disabled={isSavingKrsWindow}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSavingKrsWindow && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PortalLayout>
  );
}
